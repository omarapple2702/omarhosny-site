// Note: axe-core must be installed (see Setup). Inline [style] attributes set at runtime by scripts via CSSOM are allowed by the CSP and are not flagged.
// Site audit: axe-core (WCAG 2.2 AA), keyboard, reflow, cookies/storage, request origins, links, copy scan.
// Setup:  npm i --no-save playwright axe-core   then   npx playwright install chromium
// Run:    npm run dev   (in one terminal, serves dist/ with the production headers)   then   node qa/audit.mjs
import { chromium as pw } from 'playwright';
import { readFileSync } from 'node:fs';
import { EXTERNAL_GAMES } from '../src/games.mjs';
import { mkdirSync } from 'node:fs';
mkdirSync('qa/shots', { recursive: true });
const axeSrc = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const base = 'http://localhost:4173';
// Keyboard audit counts controls a user can actually tab to: rendered (not display:none), not hidden, not disabled, tabindex >= 0.
const FOCUSABLE = 'a[href],button,input,select,textarea,[tabindex],summary';  // summary: the toggle of <details> is a real focus stop
const paths = ['/', '/projects/', '/projects/omar-calculator/', '/projects/omnidesk/', '/projects/day-frame/', '/projects/welock/', '/projects/terra-view/', '/projects/atlas-ai/', '/projects/omarlink/', '/interests/', '/learning/', '/arcade/', '/lab/', '/random/', '/about/', '/contact/', '/privacy/', '/terms/', '/cookies/', '/nope'];
const sizes = { mobile: [390, 844], tablet: [820, 1180], desktop: [1440, 900], 'reflow-320': [320, 640], 'zoom200-640': [640, 480] };
const launch = () => pw.launch({ headless: true });
const localStorage_ok = (r) => r.ls <= 1; // only the single "oh:v1" key is allowed (scores + preferences)
const issues = [], origins = new Map(), extLinks = new Map(), axeAll = new Map();
const VAGUE = /^(click here|learn more|view|open|read more|more|here|link)$/i;
for (const [name, [w, h]] of Object.entries(sizes)) {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  let logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(m.text()));
  page.on('pageerror', (e) => logs.push('pageerror ' + e.message));
  page.on('request', (r) => { const o = new URL(r.url()).origin; origins.set(o, (origins.get(o) || 0) + 1); });
  page.on('requestfailed', (r) => logs.push('reqfail ' + r.url()));
  for (const p of paths) {
    logs = [];
    const res = await page.goto(base + p, { waitUntil: 'networkidle' });
    const t = `${name} ${p}`;
    const r = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((e) => +e.tagName[1]);
      let skipped = false; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skipped = true;
      const links = [...document.querySelectorAll('a')].map((a) => ({
        href: a.getAttribute('href'), abs: a.href, text: a.textContent.replace(/\s+/g, ' ').trim(), target: a.target, rel: a.rel,
        newtab: /opens in a new tab/.test(a.textContent), h: a.getBoundingClientRect().height, w: a.getBoundingClientRect().width,
        inline: getComputedStyle(a).display === 'inline', inProse: !!a.closest('.prose p, .prose li, .lede, .more-link'),
      }));
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        h1: document.querySelectorAll('h1').length, skipped,
        imgs: [...document.images].map((i) => ({ alt: i.getAttribute('alt'), src: i.src })),
        main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav').length,
        lang: document.documentElement.lang, title: document.title,
        canonical: document.querySelector('link[rel=canonical]')?.href,
        desc: document.querySelector('meta[name=description]')?.content?.length,
        inlineStyles: 0, scripts: [...document.scripts].filter((s) => !/json/.test(s.type) && !(s.type === 'module' && /^\/js\//.test(s.getAttribute('src') || ''))).length,
        iframes: document.querySelectorAll('iframe,embed,object').length,
        cookies: document.cookie, ls: localStorage.length, ss: sessionStorage.length,
        fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').length,
        text: document.body.innerText, links,
      };
    });
    if (p !== '/nope' && res.status() !== 200) issues.push(`${t}: status ${res.status()}`);
    if (r.overflow > 0) issues.push(`${t}: horizontal overflow ${r.overflow}px`);
    if (r.h1 !== 1) issues.push(`${t}: ${r.h1} h1`);
    if (r.skipped) issues.push(`${t}: heading level skipped`);
    if (r.main !== 1) issues.push(`${t}: ${r.main} main landmarks`);
    if (r.lang !== 'en') issues.push(`${t}: lang`);
    if (r.imgs.some((i) => i.alt === null)) issues.push(`${t}: img missing alt`);
    if (r.inlineStyles) issues.push(`${t}: ${r.inlineStyles} inline style attrs`);
    if (r.scripts) issues.push(`${t}: ${r.scripts} executable scripts`);
    if (r.iframes) issues.push(`${t}: embeds present`);
    if (r.cookies || r.ss || (r.ls && !localStorage_ok(r))) issues.push(`${t}: storage used (cookie="${r.cookies}", ls=${r.ls}, ss=${r.ss})`);
    if (r.fontsLoaded < 2) issues.push(`${t}: fonts loaded ${r.fontsLoaded}`);
    if (logs.length && p !== '/nope') issues.push(`${t}: console ${logs.join(' | ')}`);
    if (logs.filter((l) => !/404/.test(l)).length && p === '/nope') issues.push(`${t}: console ${logs.join(' | ')}`);
    for (const l of r.links) {
      if (VAGUE.test(l.text)) issues.push(`${t}: vague link text "${l.text}"`);
      if (!l.text) issues.push(`${t}: link with no name ${l.href}`);
      if (!(l.inline && l.inProse) && l.w && l.h && (l.h < 24 || l.w < 24)) issues.push(`${t}: target <24px "${l.text.slice(0, 25)}" ${Math.round(l.w)}x${Math.round(l.h)}`);
      if (/^https?:/.test(l.href || '') && !l.href.startsWith(base)) {
        if (!l.href.startsWith('https://')) issues.push(`${t}: non-HTTPS external ${l.href}`);
        if (l.target !== '_blank' || !/noopener/.test(l.rel) || !/noreferrer/.test(l.rel)) issues.push(`${t}: external link missing target/rel ${l.href}`);
        if (!l.newtab) issues.push(`${t}: external link without new-tab notice ${l.href}`);
        extLinks.set(l.href, l.text.slice(0, 50));
      }
    }
    if (/lorem|todo|testimonial|★|⭐|\d+\s*(reviews|ratings)|trusted by|thousands of|#1(?![0-9a-f])|industry-leading|placeholder|link not added|to be added/i.test(r.text)) issues.push(`${t}: suspicious copy: ${r.text.match(/lorem|todo|testimonial|★|⭐|\d+\s*(reviews|ratings)|trusted by|thousands of|#1(?![0-9a-f])|industry-leading|placeholder|link not added|to be added/i)[0]}`);
    const SOON_OK = ['/projects/', '/projects/omarlink/']; // OmarLink is the one intentionally unreleased project
    if (/coming soon/i.test(r.text) && !SOON_OK.includes(p) && p !== '/nope') issues.push(`${t}: "coming soon" outside ${SOON_OK.join(' and ')}`);
    if (p === '/projects/omarlink/' && !/coming soon/i.test(r.text)) issues.push(`${t}: OmarLink page lost its "Coming soon" status`);
    if (p === '/arcade/') { const missing = await page.evaluate((urls) => urls.filter((u) => ![...document.querySelectorAll('a[href]')].some((a) => a.href === u)), EXTERNAL_GAMES.map((g) => g.url)); if (missing.length) issues.push(`${t}: Game Archive is missing links: ${missing.join(', ')}`); }
    if (['mobile', 'desktop'].includes(name)) {
      const ax = await page.evaluate(async (src) => { (0, eval)(src); const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }); return res.violations.map((v) => `${v.id}(${v.nodes.length}): ${v.help}`); }, axeSrc).catch((e) => ['axe-failed ' + e.message.slice(0, 80)]);
      for (const v of ax) axeAll.set(`${t} ${v}`, 1);
    }
    if (name === 'desktop' || name === 'mobile' || name === 'reflow-320') await page.screenshot({ path: `qa/shots/${name}${p.replace(/\//g, '_') || '_'}.png`, fullPage: true });
  }
  if (name === 'desktop') console.log('cookies set (browser jar):', JSON.stringify(await ctx.cookies()));
  try { await browser.close(); } catch {}
}
for (const k of axeAll.keys()) issues.push('axe ' + k);

// Keyboard + reduced motion
const kb = await launch();
for (const mode of ['normal', 'reduce']) {
  const c = await kb.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  const page = await c.newPage();
  await page.goto(base + '/');
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.intro > h1')).animationName);
  console.log(`motion (${mode}): hero animation = ${anim}`);
  if (mode === 'reduce' && anim !== 'none') issues.push('reduced motion not honoured');
  if (mode === 'normal') {
    for (const p of paths.filter((x) => x !== '/nope')) {
      await page.goto(base + p);
      const total = await page.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.disabled && e.tabIndex >= 0 && !e.closest('[inert]') && !((d) => d && e !== d.querySelector(':scope > summary'))(e.closest('details:not([open])'))).length, FOCUSABLE);
      const seen = [];
      for (let i = 0; i < total + 3; i++) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate((sel) => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); return { t: (e.textContent || '').trim().slice(0, 30), vis: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, key: [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.disabled && e.tabIndex >= 0 && !e.closest('[inert]') && !((d) => d && e !== d.querySelector(':scope > summary'))(e.closest('details:not([open])'))).indexOf(e) }; }, FOCUSABLE);
        if (!f) break; seen.push(f);
      }
      const uniq = new Set(seen.map((s) => s.key));
      if (uniq.size < total) issues.push(`keyboard ${p}: only ${uniq.size}/${total} focusable reached`);
      if (seen.some((s) => !s.vis)) issues.push(`keyboard ${p}: element without visible focus outline`);
      const order = seen.map((s) => s.key); if (order.some((k, i) => i && k < order[i - 1])) issues.push(`keyboard ${p}: tab order does not follow document order`);
      if (await page.evaluate(() => document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length)) issues.push(`keyboard ${p}: positive tabindex present`);
      if (seen[0] && !/Skip/.test(seen[0].t)) issues.push(`keyboard ${p}: first tab stop is not skip link`);
      // Shift+Tab goes back
      await page.keyboard.press('Shift+Tab');
      // Skip link works
    }
    { // 390px: Menu button must be reachable, and opening it must expose reachable nav links
      const mc = await kb.newContext({ viewport: { width: 390, height: 844 } }), mp = await mc.newPage();
      for (const p of paths.filter((x) => x !== '/nope')) {
        await mp.goto(base + p);
        let onBtn = false; for (let i = 0; i < 4 && !onBtn; i++) { await mp.keyboard.press('Tab'); onBtn = await mp.evaluate(() => document.activeElement?.classList.contains('menu-btn')); }
        if (!onBtn) { issues.push(`keyboard-mobile ${p}: Menu button not reached within the first 4 tab stops (skip link, brand, Menu)`); continue; }
        await mp.keyboard.press('Enter');
        const open = await mp.evaluate(() => document.querySelector('.menu-btn').getAttribute('aria-expanded') === 'true' && [...document.querySelectorAll('#main-nav a')].every((a) => a.getClientRects().length > 0));
        if (!open) issues.push(`keyboard-mobile ${p}: Enter on Menu does not reveal nav links`);
        await mp.keyboard.press('Tab'); const inNav = await mp.evaluate(() => !!document.activeElement.closest('#main-nav'));
        if (!inNav) issues.push(`keyboard-mobile ${p}: focus does not move into the opened menu`);
        await mp.keyboard.press('Escape'); const back = await mp.evaluate(() => document.activeElement.classList.contains('menu-btn') && document.querySelector('.menu-btn').getAttribute('aria-expanded') === 'false');
        if (!back) issues.push(`keyboard-mobile ${p}: Escape does not close menu and return focus to Menu`);
      }
      await mc.close();
    }
    await page.goto(base + '/');
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    const hash = await page.evaluate(() => location.hash);
    console.log('skip link Enter →', hash);
    if (hash !== '#main') issues.push('skip link does not jump to #main');
    // Enter activates nav link, Escape harmless
    await page.focus('nav[aria-label=Main] a'); await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
    console.log('nav Enter →', new URL(page.url()).pathname);
    await page.keyboard.press('Escape');
  }
}
try { await kb.close(); } catch {}
console.log('third-party/all request origins:', JSON.stringify([...origins]));
console.log('external links:', extLinks.size); for (const [u, t] of extLinks) console.log('  ', u, '|', t);
console.log(issues.length ? `ISSUES (${issues.length}):\n` + [...new Set(issues)].join('\n') : 'No issues');
