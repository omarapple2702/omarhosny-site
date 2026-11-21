// Site-wide behaviour. Loaded on every page as a module; everything here is an enhancement.
import { $, $$, siteData, store, announce, pick } from './util.js';
import { motion, setMotion, setAccent } from './gfx.js';

const root = document.documentElement; root.classList.add('js');
const THEMES = { default: [82, 217, 234], ember: [255, 180, 84], violet: [182, 156, 255], mono: [223, 231, 242] };
export const applyTheme = (n, save = true) => { if (!THEMES[n]) return false; root.dataset.theme = n; setAccent(THEMES[n]); window.dispatchEvent(new Event('oh:motion')); if (save) store.set((d) => { (d.settings ??= {}).theme = n; }); return true; };
export const found = (id) => store.set((d) => { d.found = [...new Set([...(d.found || []), id])]; });
const prefs = store.get().settings || {};
if (prefs.theme) applyTheme(prefs.theme, false);
if (prefs.motion === 'reduced') setMotion(true);
if (prefs.fx === 'scan') root.dataset.fx = 'scan';

// ---- Mobile menu: stacked panel under the pill; Escape, link click and focus leaving close it ----
(() => {
  const btn = $('.menu-btn'), nav = $('#main-nav'); if (!btn || !nav) return;
  const set = (o) => { btn.setAttribute('aria-expanded', String(o)); nav.classList.toggle('open', o); };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); } });
  document.addEventListener('pointerdown', (e) => { if (nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false); });
  nav.addEventListener('focusout', (e) => { if (nav.classList.contains('open') && e.relatedTarget && !nav.contains(e.relatedTarget) && e.relatedTarget !== btn) set(false); });
})();

// ---- Header gains a shadow once the page scrolls ----
(() => {
  const h = $('.site-header'); if (!h) return;
  const on = () => h.classList.toggle('scrolled', scrollY > 8);
  on(); addEventListener('scroll', on, { passive: true });
})();

// ---- Motion switch (footer) ----
(() => {
  const b = $('#motion-toggle'); if (!b) return;
  const sync = () => { b.setAttribute('aria-pressed', String(motion.off)); b.textContent = motion.off ? 'Motion: reduced' : 'Motion: full'; };
  sync(); b.addEventListener('click', () => { setMotion(!motion.off); store.set((d) => { (d.settings ??= {}).motion = motion.off ? 'reduced' : 'full'; }); sync(); announce(motion.off ? 'Decorative motion reduced.' : 'Full motion on.'); });
  window.addEventListener('oh:motion', sync);
})();

// ---- Scroll reveal: fade and slide up with staggered delays; blocks already in view are left alone ----
(() => {
  if (motion.off) return;
  const els = $$('.rv').filter((e) => e.getBoundingClientRect().top > innerHeight * 0.92);
  if (!els.length || !('IntersectionObserver' in window)) return;
  els.forEach((e) => { e.classList.add('rv-wait'); e.style.setProperty('--d', [...e.parentElement.children].indexOf(e) % 4 * 90 + 'ms'); });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('rv-in'); setTimeout(() => e.target.classList.add('done'), 1000); io.unobserve(e.target); } }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
})();

// ---- Terminal (a visual Easter egg: only prints information about this site) ----
let term;
function buildTerm() {
  const d = document.createElement('dialog'); d.className = 'term'; d.setAttribute('aria-labelledby', 'term-title');
  d.innerHTML = '<div class="term-box"><div class="term-bar"><h2 id="term-title">Terminal</h2><button type="button" class="term-x">Close <span class="sr-only">terminal</span></button></div><div class="term-out" role="log" aria-live="polite" tabindex="0"></div><form class="term-form"><label for="term-in">Command</label><span aria-hidden="true">&gt;</span><input id="term-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go"><button type="submit" class="term-go">Run</button></form></div>';
  document.body.append(d);
  const out = $('.term-out', d), inp = $('#term-in', d), S = siteData(), hist = []; let hi = 0, opener = null;
  const line = (txt, cls = '') => { const p = document.createElement('p'); if (cls) p.className = cls; if (txt instanceof Node) p.append(txt); else p.textContent = txt; out.append(p); out.scrollTop = out.scrollHeight; };
  const link = (href, label) => { const a = document.createElement('a'); a.href = href; a.textContent = label; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; const n = document.createElement('span'); n.className = 'sr-only'; n.textContent = ' (opens in a new tab)'; a.append(n); } return a; };
  const row = (a, txt) => { const f = document.createDocumentFragment(); f.append(a, document.createTextNode(txt ? '  ' + txt : '')); line(f); };
  const pages = { projects: '/projects/', arcade: '/arcade/', lab: '/lab/', omarverse: '/omarverse/', about: '/about/', contact: '/contact/', random: '/random/', interests: '/interests/', learning: '/learning/', home: '/' };
  const C = {
    help: () => { line('Commands: help, projects, interests, learning, arcade, lab, about, contact, random, status, clear'); line('Also: open <page>, theme <default|ember|violet|mono>, motion, exit'); },
    projects: () => { (S.projects || []).forEach((p) => row(link(p.href || '/projects/', p.name), p.statusLabel + (p.summary ? ' — ' + p.summary : ''))); },
    arcade: () => { line('On this site (scores stay in this browser):'); (S.games || []).forEach((g) => line('  ' + g)); line('More Omar games, each on its own site:'); (S.extGames || []).forEach((g) => row(link(g.url, g.name), g.category + ' · ' + g.host)); row(link('/arcade/', 'Open the Arcade')); },
    games: () => C.arcade(),
    interests: () => { (S.interests || []).forEach((i) => line('  ' + i)); row(link('/interests/', 'Open Interests')); },
    learning: () => { (S.learning || []).forEach((i) => line('  ' + i)); row(link('/learning/', 'Open Learning')); },
    lab: () => { line('Experiments: ' + (S.lab || []).join(', ') + '.'); row(link('/lab/', 'Open the Lab')); },
    about: () => { line((S.about || []).join(' ')); row(link('/about/', 'Read About')); },
    contact: () => { row(link('mailto:' + S.email, S.email)); (S.socials || []).forEach((s) => row(link(s.url, s.name), s.handle)); },
    random: () => { const p = pick(S.projects || []); line('Random project: ' + p?.name); row(link('/random/', 'More randomness')); },
    status: () => { const st = store.get(); line(`Site: ${S.host}`); line(`Projects: ${(S.projects || []).filter((p) => !p.pending).length} listed, ${(S.projects || []).filter((p) => p.pending).length} coming soon`); line(`Motion: ${motion.off ? 'reduced' : 'full'}   Theme: ${root.dataset.theme || 'default'}`); line(`Local scores stored: ${Object.keys(st).filter((k) => k !== 'settings' && k !== 'found').length} games   Cookies: none   Tracking: none`); },
    clear: () => { out.textContent = ''; },
    motion: () => { setMotion(!motion.off); line('Motion: ' + (motion.off ? 'reduced' : 'full')); },
    exit: () => d.close(),
    sudo: () => { line('Nice try. This terminal only reads the site.'); found('sudo'); },
    open: (a) => { const t = pages[a?.toLowerCase()]; if (t) { line('Opening ' + t); location.href = t; } else line('Open which page? ' + Object.keys(pages).join(', ')); },
    theme: (a) => { if (applyTheme((a || '').toLowerCase())) line('Theme: ' + a); else line('Themes: ' + Object.keys(THEMES).join(', ')); },
  };
  d.addEventListener('close', () => { inp.blur(); if (opener && opener !== document.body && opener.isConnected) opener.focus(); });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  $('.term-x', d).addEventListener('click', () => d.close());
  $('.term-form', d).addEventListener('submit', (e) => {
    e.preventDefault(); const v = inp.value.trim(); inp.value = ''; if (!v) return; hist.push(v); hi = hist.length; line('> ' + v, 'cmd');
    const [c, ...r] = v.split(/\s+/), f = C[c.toLowerCase()]; if (f) f(r.join(' ')); else line(`Unknown command "${c}". Type help.`);
  });
  inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp' && hist.length) { hi = Math.max(0, hi - 1); inp.value = hist[hi]; e.preventDefault(); } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); } });
  line('Omar Hosny — site terminal. Type help.');
  return { open(o) { opener = o || document.activeElement; if (!d.open) d.showModal(); inp.focus(); } };
}
const typing = (t) => (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.getClientRects().length > 0) || t.isContentEditable;
export const openTerminal = (o) => (term ??= buildTerm()).open(o);
$$('[data-open-terminal]').forEach((b) => b.addEventListener('click', () => openTerminal(b)));
addEventListener('keydown', (e) => { const t = e.target; if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(t)) { e.preventDefault(); openTerminal(); } });

// ---- Easter eggs ----
(() => {
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let i = 0;
  addEventListener('keydown', (e) => { if (typing(e.target)) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0; if (i === seq.length) { i = 0; const on = root.dataset.fx !== 'scan'; if (on) root.dataset.fx = 'scan'; else delete root.dataset.fx; store.set((d) => { (d.settings ??= {}).fx = on ? 'scan' : ''; }); found('konami'); announce(on ? 'Scanline mode on. Enter the sequence again to turn it off.' : 'Scanline mode off.'); } });
  const logo = $('.brand'); let n = 0, t0 = 0;
  logo?.addEventListener('click', (e) => { const now = Date.now(); n = now - t0 < 900 ? n + 1 : 1; t0 = now; if (n >= 5) { e.preventDefault(); n = 0; applyTheme(root.dataset.theme === 'ember' ? 'default' : 'ember'); found('logo'); announce('Ember theme ' + (root.dataset.theme === 'ember' ? 'on' : 'off') + '.'); } });
})();

// ---- Lazy-load heavy parts ----
const page = document.body.dataset.page;
if ($('canvas[data-scene]')) import('./scenes.js').then((m) => m.mountScenes());
if ($('[data-buddy]')) import('./hero.js').then((m) => m.init());
const mods = { omarverse: 'omarverse.js', learning: 'pages.js', arcade: 'arcade.js', lab: 'lab.js', random: 'pages.js', about: 'pages.js', contact: 'pages.js', 'projects-omar-calculator': 'pages.js', notfound: 'pages.js' };
if (mods[page]) import('./' + mods[page]).then((m) => m.init?.(page));

// ---- Omarverse entry: respond instantly, warm the world up in the background, navigate when it is ready ----
(() => {
  if (page === 'omarverse') return;
  const links = $$('a[href="/omarverse/"]'); if (!links.length) return;
  let warm = null;
  // The CSP has no connect-src, so no fetch(): warm the stylesheet through a non-blocking <link> and the scripts through import().
  const css = () => new Promise((res) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/omarverse.css'; l.media = 'print'; l.onload = l.onerror = () => res(); document.head.append(l); });
  const preload = () => warm ??= Promise.allSettled([css(), import('./omarverse.js'), import('./ov/hub.js'), import('./ov/areas.js'), document.fonts?.ready]);
  for (const a of links) for (const ev of ['pointerenter', 'focus', 'touchstart']) a.addEventListener(ev, preload, { once: true, passive: true });
  let busy = false;
  addEventListener('pageshow', (e) => { if (e.persisted) { busy = false; $('.ovx')?.remove(); root.classList.remove('ovx-lock'); } });
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href="/omarverse/"]'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    e.preventDefault(); if (busy) return; busy = true; preload();
    const r = a.getBoundingClientRect(), x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2, t0 = performance.now();
    const ov = document.createElement('div'); ov.className = 'ovx'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = '<i class="ovx-veil"></i><i class="ovx-glow"></i><i class="ovx-glow2"></i><i class="ovx-ring"></i><i class="ovx-ring"></i><i class="ovx-vig"></i><div class="ovx-core"><svg viewBox="0 0 120 120" focusable="false"><circle cx="60" cy="60" r="54"/></svg><p class="ovx-word">Omarverse</p><p class="ovx-msg"></p></div>';
    ov.style.setProperty('--x', x + 'px'); ov.style.setProperty('--y', y + 'px'); ov.style.setProperty('--dx', innerWidth / 2 - x + 'px'); ov.style.setProperty('--dy', innerHeight / 2 - y + 'px');
    document.body.append(ov); root.classList.add('ovx-lock'); announce('Entering Omarverse');
    requestAnimationFrame(() => ov.classList.add('is-on'));
    try { sessionStorage.setItem('ovx', '1'); } catch {}
    const minMs = motion.off ? 150 : 1500;
    Promise.race([preload(), new Promise((r) => setTimeout(r, 2500))]).then(() => new Promise((r) => setTimeout(r, Math.max(0, minMs - (performance.now() - t0))))).then(() => { location.href = '/omarverse/'; });
  });
})();

// ---- Homepage reveal: show the hero as soon as type and the first frame are ready. Nothing is delayed on purpose. ----
(() => {
  if (page !== 'home') return;
  const done = () => { root.classList.add('hv-go'); setTimeout(() => $('.hv-skel')?.remove(), 1500); };
  if (motion.off) return done();
  const t0 = performance.now(), fonts = document.fonts?.ready || Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).catch(() => {}).then(() => requestAnimationFrame(() => { if (performance.now() < 300) root.classList.add('hv-fast'); done(); }));
})();
