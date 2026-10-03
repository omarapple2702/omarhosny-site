// Page-specific enhancements: Random, About constellation, Contact hub, 3D calculator.
import { $, $$, siteData, store, announce, pick, rnd } from './util.js';
import { motion } from './gfx.js';
import { applyTheme } from './core.js';
import { randomColour } from './lab.js';

const S = siteData();

// ---- Random Omar ----
const IDEAS = { kind: ['A browser tool', 'A small game', 'A menu bar app', 'A visualiser', 'A planner', 'A calculator mode', 'A timer'], who: ['tennis practice', 'swimming laps', 'study sessions', 'time zones', 'unit conversions', 'local-first notes', 'a focus break'], twist: ['that works offline', 'with one big button', 'that saves only to your device', 'with keyboard-first controls', 'with a 3D preview', 'that fits on one screen'] };
const CHALLENGES = () => [`Reaction test: get under ${Math.round(rnd(24, 38)) * 10} ms.`, `Target hunt: score above ${Math.round(rnd(8, 20)) * 10}.`, `Memory grid: reach level ${Math.round(rnd(5, 8))}.`, `Avoid: last longer than ${Math.round(rnd(15, 40))} seconds.`, 'Logic challenge: answer all ten without a miss.', 'Lab: make the particles form one tight cluster.', 'Lab: stack 20 objects with gravity pointing sideways.'];
const TIPS = ['Press the backtick key (`) to open the terminal.', 'Drag the glowing core on the home page to spin it.', 'Click the core on the home page for a pulse.', 'Open the Lab and change the light angle on the 3D object.', 'Try the lock on the WeLock page.', 'On the Omar Calc page, the calculator works with your keyboard.', 'Press Up, Up, Down, Down, Left, Right, Left, Right, B, A somewhere on the site.', 'Switch Motion to reduced in the footer and see what stays.'];
const lines = () => (S.projects || []).flatMap((p) => [p.summary, ...(p.lines || [])]).filter(Boolean);
const GEN = {
  project: () => { const p = pick((S.projects || []).filter((x) => !x.pending)); return { text: `${p.name}: ${p.summary}`, href: p.href, label: `Open ${p.name}` }; },
  challenge: () => ({ text: pick(CHALLENGES()), href: '/arcade/', label: 'Go to the Arcade' }),
  colour: () => { const c = randomColour(); return { text: `${c.hex.toUpperCase()}  ·  rgb(${c.rgb.join(', ')})  ·  hsl(${c.h}, ${c.s}%, ${c.l}%)`, swatch: c.hex }; },
  ui: () => { const n = pick(['default', 'ember', 'violet', 'mono']); applyTheme(n); return { text: `Theme: ${n}. It stays on this device until you pick another.` }; },
  interaction: () => ({ text: pick(TIPS) }),
  build: () => ({ text: `${pick(IDEAS.kind)} for ${pick(IDEAS.who)} ${pick(IDEAS.twist)}. An idea, not a plan.` }),
  line: () => ({ text: pick(lines()) }),
  game: () => pick([...(S.games || []).map((n) => ({ text: `${n}: play it on the Arcade page.`, href: '/arcade/', label: 'Go to the Arcade' })), ...(S.extGames || []).map((g) => ({ text: `${g.name}: ${g.summary}`, href: g.url, label: `Play ${g.name}`, external: true }))]),
};
function random() {
  for (const b of $$('[data-gen]')) b.addEventListener('click', () => {
    const r = GEN[b.dataset.gen](), out = $('#' + b.dataset.out); out.textContent = ''; const p = document.createElement('span'); p.textContent = r.text; out.append(p);
    if (r.swatch) { out.style.setProperty('--sw', r.swatch); out.classList.add('has-sw'); } else out.classList.remove('has-sw');
    if (r.href) { out.append(' '); const a = document.createElement('a'); a.href = r.href; a.textContent = r.label; if (r.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent += ' (opens in a new tab)'; } out.append(a); }
  });
  const found = (store.get().found || []).length; const f = $('#secrets-found'); if (f) f.textContent = `${found} of 3 secrets found on this device.`;
}

// ---- About: constellation ----
function constellation() {
  const box = $('.const'), detail = $('#const-detail'); if (!box) return;
  for (const n of $$('.cn', box)) { n.style.setProperty('--x', n.dataset.x); n.style.setProperty('--y', n.dataset.y); n.style.setProperty('--z', n.dataset.z); const show = () => { detail.textContent = n.dataset.text; $$('.cn', box).forEach((x) => x.setAttribute('aria-pressed', String(x === n))); }; n.addEventListener('click', show); n.addEventListener('focus', show); n.addEventListener('pointerenter', show); }
  if (!matchMedia('(hover: hover)').matches) return;
  box.addEventListener('pointermove', (e) => { if (motion.off) return; const r = box.getBoundingClientRect(); box.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(1) + 'deg'); box.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 10).toFixed(1) + 'deg'); });
  box.addEventListener('pointerleave', () => { box.style.setProperty('--ry', '0deg'); box.style.setProperty('--rx', '0deg'); });
}

// ---- Contact hub parallax ----
function hub() {
  $$('.hub .layer[data-d]').forEach((l) => l.style.setProperty('--depth', l.dataset.d));
  const el = $('.hub'); if (!el || !matchMedia('(hover: hover)').matches) return;
  el.addEventListener('pointermove', (e) => { if (motion.off) return; const r = el.getBoundingClientRect(); el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); });
}

// ---- Omar Calc: a small usable 3D calculator (no eval) ----
function evaluate(src) {
  const t = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').match(/\d*\.?\d+|[()+\-*/%]/g); if (!t || t.join('') !== src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s/g, '')) throw new Error('syntax');
  let i = 0; const peek = () => t[i], next = () => t[i++];
  const prim = () => { const x = next(); if (x === '(') { const v = expr(); if (next() !== ')') throw new Error('paren'); return pct(v); } if (x === '-') return -unary(); if (x === '+') return unary(); if (x == null || !/^\d|^\./.test(x)) throw new Error('syntax'); return pct(parseFloat(x)); };
  const pct = (v) => { while (peek() === '%') { next(); v /= 100; } return v; };
  const unary = () => prim();
  const term = () => { let v = unary(); while (peek() === '*' || peek() === '/') { const o = next(), r = unary(); v = o === '*' ? v * r : v / r; } return v; };
  const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(), r = term(); v = o === '+' ? v + r : v - r; } return v; };
  const v = expr(); if (i < t.length) throw new Error('syntax'); if (!Number.isFinite(v)) throw new Error('range'); return v;
}
function calc() {
  const box = $('.calc3d'); if (!box) return; const expr = $('.calc-expr', box), res = $('.calc-res', box); let s = '', done = false;
  const show = () => { expr.textContent = s || '0'; };
  const press = (k) => {
    if (k === 'C') { s = ''; res.textContent = ''; done = false; }
    else if (k === '⌫') { s = s.slice(0, -1); }
    else if (k === '=') { if (!s) return; try { const v = evaluate(s), out = String(+v.toPrecision(12)); res.textContent = out; announce('Result ' + out); s = out; done = true; } catch { res.textContent = 'Check the expression'; announce('Check the expression'); } }
    else { if (done && /[\d.(]/.test(k)) { s = ''; res.textContent = ''; } done = false; s += k; try { res.textContent = String(+evaluate(s).toPrecision(12)); } catch { res.textContent = ''; } }
    show();
  };
  for (const b of $$('button[data-k]', box)) b.addEventListener('click', () => press(b.dataset.k));
  box.addEventListener('keydown', (e) => { if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return; const m = { '*': '×', '/': '÷', '-': '−', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', Delete: 'C' }, k = m[e.key] || (/^[\d.+()%]$/.test(e.key) ? e.key : null); if (k) { e.preventDefault(); press(k); } });
  if (matchMedia('(hover: hover)').matches) { box.addEventListener('pointermove', (e) => { if (motion.off) return; const r = box.getBoundingClientRect(); box.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + 'deg'); box.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 10).toFixed(1) + 'deg'); }); box.addEventListener('pointerleave', () => { box.style.setProperty('--ry', '0deg'); box.style.setProperty('--rx', '0deg'); }); }
  show();
}

export function init(page) { if (page === 'random') random(); if (page === 'about' || page === 'learning') constellation(); if (page === 'contact') hub(); if (page === 'projects-omar-calculator') calc(); }
