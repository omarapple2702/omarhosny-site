// Lab: small interactive experiments. All local, nothing is sent anywhere.
import { $, $$, announce, rnd, pick } from './util.js';
import { motion, isLite } from './gfx.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const val = (id) => +$('#' + id).value;
function outputs() { for (const r of $$('input[type=range]')) { const o = $(`output[data-for="${r.id}"]`); if (!o) continue; const f = () => { o.textContent = r.value; }; r.addEventListener('input', f); f(); } }

// Shared canvas loop: runs only while visible, honours pause + reduced motion.
function sim(cv, step, { autorun = true } = {}) {
  const g = cv.getContext('2d'), api = { g, w: 1, h: 1, running: autorun && !motion.off, ptr: { x: -1, y: -1, in: false }, draw: null };
  let raf = 0, last = 0, vis = false;
  const fit = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, isLite() ? 1.25 : 2); api.w = r.width; api.h = r.height; cv.width = r.width * d; cv.height = r.height * d; g.setTransform(d, 0, 0, d, 0, 0); api.onResize?.(); api.kick(); };
  const tick = (t) => { raf = 0; if (!vis || document.hidden) return; const dt = Math.min(0.033, (t - last) / 1000 || 0.016); last = t; step(dt, api.running); if (api.running || api.again) { api.again = false; raf = requestAnimationFrame(tick); } };
  api.kick = () => { if (vis && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } else if (!vis) api.again = true; };
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) api.kick(); }).observe(cv);
  new ResizeObserver(fit).observe(cv);
  const loc = (e) => { const r = cv.getBoundingClientRect(); api.ptr.x = e.clientX - r.left; api.ptr.y = e.clientY - r.top; };
  cv.addEventListener('pointermove', (e) => { api.ptr.in = true; loc(e); api.onMove?.(e); api.kick(); }); cv.addEventListener('pointerleave', () => { api.ptr.in = false; api.kick(); });
  cv.addEventListener('pointerdown', (e) => { loc(e); api.onDown?.(e); api.kick(); });
  addEventListener('oh:motion', () => { if (motion.off) api.running = false; syncBtn?.(); api.kick(); });
  let syncBtn = null; api.bind = (btn) => { syncBtn = () => { btn.textContent = api.running ? 'Pause' : 'Run'; btn.setAttribute('aria-pressed', String(!api.running)); }; btn.addEventListener('click', () => { api.running = !api.running; syncBtn(); api.kick(); }); syncBtn(); };
  return api;
}

// ---- Particle playground ----
function particles() {
  const cv = $('#pp-canvas'); let P = [];
  const fill = () => { const n = val('pp-count'); while (P.length < n) P.push({ x: rnd(0, cv.clientWidth), y: rnd(0, cv.clientHeight), vx: rnd(-1, 1) * 40, vy: rnd(-1, 1) * 40 }); P.length = n; };
  const s = sim(cv, (dt, run) => {
    fill(); const { g, w, h } = s, spd = val('pp-speed'), att = val('pp-attr'), D = val('pp-dist');
    if (run) for (const p of P) { if (s.ptr.in) { const dx = s.ptr.x - p.x, dy = s.ptr.y - p.y, d = Math.hypot(dx, dy) + 24; p.vx += (dx / d) * att * 900 * dt / (1 + d / 90); p.vy += (dy / d) * att * 900 * dt / (1 + d / 90); } p.vx *= 0.995; p.vy *= 0.995; const sp = Math.hypot(p.vx, p.vy); if (sp > 160) { p.vx *= 160 / sp; p.vy *= 160 / sp; } if (sp < 14) { p.vx += rnd(-1, 1) * 20 * dt * 10; p.vy += rnd(-1, 1) * 20 * dt * 10; } p.x += p.vx * dt * spd; p.y += p.vy * dt * spd; if (p.x < 0 || p.x > w) { p.vx *= -1; p.x = clamp(p.x, 0, w); } if (p.y < 0 || p.y > h) { p.vy *= -1; p.y = clamp(p.y, 0, h); } }
    g.clearRect(0, 0, w, h); g.lineWidth = 1;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d = dx * dx + dy * dy; if (d < D * D) { g.strokeStyle = `rgba(82,217,234,${0.5 * (1 - Math.sqrt(d) / D)})`; g.beginPath(); g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); g.stroke(); } }
    g.fillStyle = '#e8eef7'; for (const p of P) { g.beginPath(); g.arc(p.x, p.y, 2, 0, 7); g.fill(); }
  });
  s.bind($('#pp-toggle')); for (const id of ['pp-count', 'pp-speed', 'pp-attr', 'pp-dist']) $('#' + id).addEventListener('input', s.kick);
  $('#pp-reset').addEventListener('click', () => { P = []; for (const [id, v] of [['pp-count', 90], ['pp-speed', 1], ['pp-attr', 0.6], ['pp-dist', 110]]) { $('#' + id).value = v; $('#' + id).dispatchEvent(new Event('input')); } s.kick(); });
}

// ---- Gravity playground ----
function gravity() {
  const cv = $('#gv-canvas'); let B = [];
  const add = (x, y) => { if (B.length >= 70) B.shift(); const r = rnd(10, 20); B.push({ x, y, vx: rnd(-80, 80), vy: rnd(-60, 0), r, sq: $('#gv-shape').value === 'box', hue: rnd(180, 230) }); s.kick(); };
  const s = sim(cv, (dt, run) => {
    const { g, w, h } = s, G = val('gv-g') * 30, dir = $('#gv-dir').value, ax = dir === 'left' ? -G : dir === 'right' ? G : 0, ay = dir === 'up' ? -G : dir === 'down' ? G : 0;
    if (run) for (let it = 0; it < 2; it++) { const d = dt / 2; for (const b of B) { b.vx += ax * d; b.vy += ay * d; b.x += b.vx * d; b.y += b.vy * d; if (b.x < b.r) { b.x = b.r; b.vx *= -0.6; } if (b.x > w - b.r) { b.x = w - b.r; b.vx *= -0.6; } if (b.y < b.r) { b.y = b.r; b.vy *= -0.6; } if (b.y > h - b.r) { b.y = h - b.r; b.vy *= -0.6; b.vx *= 0.99; } }
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { const p = B[i], q = B[j], dx = q.x - p.x, dy = q.y - p.y, dd = Math.hypot(dx, dy) || 0.01, ov = p.r + q.r - dd; if (ov > 0) { const nx = dx / dd, ny = dy / dd; p.x -= nx * ov / 2; p.y -= ny * ov / 2; q.x += nx * ov / 2; q.y += ny * ov / 2; const rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny; if (rv < 0) { const j2 = -1.5 * rv / 2; p.vx -= j2 * nx; p.vy -= j2 * ny; q.vx += j2 * nx; q.vy += j2 * ny; } } } }
    g.clearRect(0, 0, w, h); for (const b of B) { g.fillStyle = `hsla(${b.hue},80%,62%,.9)`; g.strokeStyle = 'rgba(232,238,247,.7)'; g.lineWidth = 1.5; g.beginPath(); if (b.sq) g.roundRect(b.x - b.r * 0.9, b.y - b.r * 0.9, b.r * 1.8, b.r * 1.8, 4); else g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.stroke(); }
    $('#gv-count').textContent = B.length + ' objects';
  });
  s.onDown = () => add(s.ptr.x, s.ptr.y); s.bind($('#gv-toggle'));
  $('#gv-add').addEventListener('click', () => { for (let i = 0; i < 5; i++) add(rnd(30, Math.max(40, s.w - 30)), rnd(20, 80)); announce('Added 5 objects.'); });
  $('#gv-reset').addEventListener('click', () => { B = []; $('#gv-g').value = 12; $('#gv-dir').value = 'down'; $('#gv-g').dispatchEvent(new Event('input')); s.kick(); announce('Gravity playground reset.'); });
  for (const id of ['gv-g', 'gv-dir']) $('#' + id).addEventListener('input', s.kick);
  cv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(s.w / 2 + rnd(-60, 60), 30); } });
}

// ---- Colour lab ----
const hsl2rgb = (h, s, l) => { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)); };
const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
// Pick the text colour (black or white) with the higher contrast. Worst case across all backgrounds is 4.58:1, so it always meets WCAG AA for normal text.
const inkFor = (rgb) => { const L = lum(rgb); return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#000000' : '#ffffff'; };
export function randomColour() { const h = Math.floor(rnd(0, 360)), s = Math.floor(rnd(55, 90)), l = Math.floor(rnd(38, 66)), rgb = hsl2rgb(h, s, l); return { h, s, l, rgb, hex: hex(rgb) }; }
function copy(text) { return navigator.clipboard?.writeText(text).catch(() => fallback(text)) ?? Promise.resolve(fallback(text)); }
function fallback(t) { const a = document.createElement('textarea'); a.value = t; a.className = 'sr-only'; document.body.append(a); a.select(); try { document.execCommand('copy'); } catch {} a.remove(); }
function colours() {
  const box = $('#cl-swatches'), gen = () => {
    const base = Math.floor(rnd(0, 360)), mode = $('#cl-mode').value, hs = { random: () => Array.from({ length: 5 }, () => rnd(0, 360)), analogous: () => [-40, -20, 0, 20, 40].map((o) => base + o), complementary: () => [0, 0, 180, 180, 0].map((o, i) => base + o + (i % 2) * 8), triad: () => [0, 120, 240, 0, 120].map((o, i) => base + o + i * 6) }[mode]();
    box.textContent = '';
    hs.forEach((hh, i) => { const H = ((hh % 360) + 360) % 360 | 0, S = i === 2 ? 70 : 62 + (i % 3) * 10, L = [34, 48, 58, 68, 24][i], rgb = hsl2rgb(H, S, L), fg = inkFor(rgb), li = document.createElement('li'); li.className = 'swatch'; li.style.background = hex(rgb); li.style.color = fg;
      const vals = [['HEX', hex(rgb).toUpperCase()], ['RGB', `rgb(${rgb.join(', ')})`], ['HSL', `hsl(${H}, ${S}%, ${L}%)`]];
      for (const [k, v] of vals) { const row = document.createElement('div'), t = document.createElement('code'), b = document.createElement('button'); t.textContent = v; b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy'; b.setAttribute('aria-label', `Copy ${k} ${v}`); b.style.color = fg; b.addEventListener('click', () => copy(v).then(() => { b.textContent = 'Copied'; announce(`Copied ${v}`); setTimeout(() => { b.textContent = 'Copy'; }, 1400); })); row.append(t, b); li.append(row); }
      box.append(li); });
  };
  $('#cl-gen').addEventListener('click', gen); $('#cl-mode').addEventListener('change', gen); gen();
}

// ---- Pointer physics ----
function pointer() {
  const cv = $('#pt-canvas'); const sp = { x: 0, y: 0, vx: 0, vy: 0 }, ea = { x: 0, y: 0 }, tg = { x: 0, y: 0, vx: 0, vy: 0 }, trail = []; let init = false, lastT = 0, outT = 0;
  const s = sim(cv, (dt) => {
    const { g, w, h } = s; if (!init) { tg.x = sp.x = ea.x = w / 2; tg.y = sp.y = ea.y = h / 2; init = true; }
    if (s.ptr.in) { const now = performance.now(), d = Math.max(1, now - lastT) / 1000; tg.vx = (s.ptr.x - tg.x) / d * 0.35 + tg.vx * 0.65; tg.vy = (s.ptr.y - tg.y) / d * 0.35 + tg.vy * 0.65; tg.x = s.ptr.x; tg.y = s.ptr.y; lastT = now; } else { tg.vx *= 0.9; tg.vy *= 0.9; }
    const k = val('pt-k'), dm = val('pt-d'), e = val('pt-e'); for (let i = 0; i < 4; i++) { const d = dt / 4; sp.vx += (-k * (sp.x - tg.x) - dm * sp.vx) * d; sp.vy += (-k * (sp.y - tg.y) - dm * sp.vy) * d; sp.x += sp.vx * d; sp.y += sp.vy * d; }
    ea.x += (tg.x - ea.x) * (1 - Math.pow(1 - e, dt * 60)); ea.y += (tg.y - ea.y) * (1 - Math.pow(1 - e, dt * 60));
    trail.push([sp.x, sp.y]); if (trail.length > 40) trail.shift();
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(90,130,200,.12)'; g.lineWidth = 1; for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.beginPath(); trail.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = 'rgba(74,124,255,.7)'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(232,238,247,.5)'; g.beginPath(); g.moveTo(tg.x - 12, tg.y); g.lineTo(tg.x + 12, tg.y); g.moveTo(tg.x, tg.y - 12); g.lineTo(tg.x, tg.y + 12); g.stroke();
    const vl = Math.hypot(tg.vx, tg.vy); if (vl > 20) { g.strokeStyle = '#52d9ea'; g.lineWidth = 2; g.beginPath(); g.moveTo(tg.x, tg.y); g.lineTo(tg.x + tg.vx * 0.08, tg.y + tg.vy * 0.08); g.stroke(); }
    g.fillStyle = '#4a7cff'; g.beginPath(); g.arc(sp.x, sp.y, 11, 0, 7); g.fill(); g.strokeStyle = '#52d9ea'; g.lineWidth = 2; g.beginPath(); g.arc(ea.x, ea.y, 16, 0, 7); g.stroke();
    if (performance.now() - outT > 90) { outT = performance.now(); $('#pt-x').textContent = Math.round(tg.x); $('#pt-y').textContent = Math.round(tg.y); $('#pt-v').textContent = Math.round(vl) + ' px/s'; $('#pt-s').textContent = Math.round(Math.hypot(sp.vx, sp.vy)) + ' px/s'; }
    s.again = Math.hypot(sp.vx, sp.vy) > 2 || Math.hypot(ea.x - tg.x, ea.y - tg.y) > 0.5 || s.ptr.in;
  }, { autorun: !motion.off });
  s.running = false; // physics steps only while something is moving, so it is safe in reduced motion
  for (const id of ['pt-k', 'pt-d', 'pt-e']) $('#' + id).addEventListener('input', s.kick);
  cv.addEventListener('keydown', (e) => { const m = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] }[e.key]; if (!m) return; e.preventDefault(); s.ptr.x = clamp((s.ptr.in ? s.ptr.x : tg.x) + m[0], 0, s.w); s.ptr.y = clamp((s.ptr.in ? s.ptr.y : tg.y) + m[1], 0, s.h); s.ptr.in = true; s.kick(); setTimeout(() => { s.ptr.in = false; }, 250); });
}

export function init() { outputs(); particles(); gravity(); colours(); pointer(); }
