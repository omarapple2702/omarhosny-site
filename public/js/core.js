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

// ---- Mobile menu: collapses behind a button; no scroll lock; Escape closes ----
(() => {
  const btn = $('.menu-btn'), nav = $('#main-nav'); if (!btn || !nav) return;
  const set = (o) => { btn.setAttribute('aria-expanded', String(o)); nav.classList.toggle('open', o); };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); } });
  nav.addEventListener('focusout', (e) => { if (nav.classList.contains('open') && !nav.contains(e.relatedTarget) && e.relatedTarget !== btn) set(false); });
})();

// ---- Motion switch (footer) ----
(() => {
  const b = $('#motion-toggle'); if (!b) return;
  const sync = () => { b.setAttribute('aria-pressed', String(motion.off)); b.textContent = motion.off ? 'Motion: reduced' : 'Motion: full'; };
  sync(); b.addEventListener('click', () => { setMotion(!motion.off); store.set((d) => { (d.settings ??= {}).motion = motion.off ? 'reduced' : 'full'; }); sync(); announce(motion.off ? 'Decorative motion reduced.' : 'Full motion on.'); });
  window.addEventListener('oh:motion', sync);
})();

// ---- Scroll depth: reveal below-the-fold blocks in 3D, expose scroll for parallax ----
(() => {
  const els = $$('.rv').filter((e) => e.getBoundingClientRect().top > innerHeight * 0.92);
  if (els.length && 'IntersectionObserver' in window) {
    els.forEach((e, i) => { e.classList.add('rv-wait'); e.style.setProperty('--d', (i % 4) * 60 + 'ms'); });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }
  let tick = false;
  addEventListener('scroll', () => { if (tick || motion.off) return; tick = true; requestAnimationFrame(() => { root.style.setProperty('--sy', Math.min(scrollY, 1200)); tick = false; }); }, { passive: true });
})();

// ---- Card tilt (depth + light), hover-capable pointers only ----
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  for (const c of $$('.tilt')) {
    c.addEventListener('pointermove', (e) => { if (motion.off) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(2) + 'deg'); c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%'); });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
  }
})();

// ---- Custom cursor: desktop enhancement; the real cursor stays visible ----
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const dot = document.createElement('div'), ring = document.createElement('div'); dot.className = 'cur-dot'; ring.className = 'cur-ring'; dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
  document.body.append(dot, ring); let x = -50, y = -50, rx = -50, ry = -50, raf = 0;
  const loop = () => { rx += (x - rx) * 0.2; ry += (y - ry) * 0.2; ring.style.transform = `translate3d(${rx}px,${ry}px,0)`; dot.style.transform = `translate3d(${x}px,${y}px,0)`; raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.3 ? requestAnimationFrame(loop) : 0; };
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || motion.off) { root.classList.remove('cur-on'); return; } root.classList.add('cur-on'); x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); const t = e.target.closest?.('a,button,input,select,textarea,summary,canvas,[role=button]'); ring.classList.toggle('big', !!t); }, { passive: true });
  document.addEventListener('pointerleave', () => root.classList.remove('cur-on'));
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
  const pages = { projects: '/projects/', arcade: '/arcade/', lab: '/lab/', about: '/about/', contact: '/contact/', random: '/random/', interests: '/interests/', learning: '/learning/', home: '/' };
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
if (!navigator.connection?.saveData && 'IntersectionObserver' in window) {
  const bg = document.createElement('canvas'); bg.className = 'bg-canvas'; bg.setAttribute('aria-hidden', 'true'); document.body.prepend(bg);
  const go = () => import('./scenes.js').then((m) => m.background(bg)); 'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 300);
}
const mods = { learning: 'pages.js', arcade: 'arcade.js', lab: 'lab.js', random: 'pages.js', about: 'pages.js', contact: 'pages.js', 'projects-omar-calculator': 'pages.js', notfound: 'pages.js' };
if (mods[page]) import('./' + mods[page]).then((m) => m.init?.(page));
