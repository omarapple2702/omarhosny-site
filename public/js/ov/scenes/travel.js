// Somewhere new: a route globe. Drag to turn it, pick a place, or let go of the plan entirely.
import { h, TAU, clamp, lerp, rgb, loop, fit, COL, pick } from '../kit.js';
const D = Math.PI / 180;
const PL = [
  { id: 'sahel', n: 'Sahel', lat: 31, lon: 28.2, t: 'Been here. A family dinner, around 2018.', been: true },
  { id: 'sokhna', n: 'Ain El Sokhna', lat: 29.6, lon: 32.35, t: 'Been here too. Atmosphere, scenery, food, people.', been: true },
  { id: 'paris', n: 'Paris', lat: 48.86, lon: 2.35, t: 'Not yet. If I could leave tomorrow, it’s Paris.', been: false },
];
const PARIS = ['Land before sunrise', 'Breakfast with the Eiffel Tower in view', 'Tennis', 'Wander the city', 'Leave at the next sunrise'];
export function mount(root, api) {
  root.classList.add('sc-travel');
  const cv = h('canvas', { class: 'tv-cv', role: 'img', 'aria-label': 'A glowing globe with three marked places: Sahel, Ain El Sokhna and Paris. Drag to turn it.' });
  const card = h('div', { class: 'tv-card', 'aria-live': 'polite' }), seq = h('ol', { class: 'tv-seq' }, PARIS.map((t) => h('li', {}, t)));
  const chips = h('div', { class: 'dy-chips' }, PL.map((p, i) => h('button', { type: 'button', 'data-i': i, text: p.n })), h('button', { type: 'button', class: 'tv-noplan' }, 'No plan'));
  const copy = h('div', { class: 'ov-copy ov-copy-top' }, h('p', { class: 'cp-big' }, 'Somewhere ', h('em', {}, 'new.')), h('p', {}, 'No itinerary. I wing it. Someday: a life in different places, not just one.'), card);
  root.append(cv, copy, h('div', { class: 'tv-ctl' }, seq, chips));
  const s = fit(cv, 1.5); let lam = 25 * D, phi = 28 * D, vl = api.reduced ? 0 : 0.05, vp = 0, sel = -1, spin = 0, spins = 0, goal = null, drag = null, plane = 0; let timers = [];
  const proj = (lat, lon, R, cx, cy) => { const a = lat * D, o = lon * D - lam, x = Math.cos(a) * Math.sin(o), y = Math.cos(phi) * Math.sin(a) - Math.sin(phi) * Math.cos(a) * Math.cos(o), z = Math.sin(phi) * Math.sin(a) + Math.cos(phi) * Math.cos(a) * Math.cos(o); return [cx + x * R, cy - y * R, z]; };
  function draw(dt, t) {
    const g = s.g, W = s.w, H = s.h, cx = W / 2, cy = H * 0.5, R = Math.min(W * 0.4, H * 0.3);
    g.clearRect(0, 0, W, H); if (!drag && !goal) { lam += (spin || vl) * dt; phi = lerp(phi, 28 * D, Math.min(1, dt)); } if (goal) { let d = goal.lam - lam; d = Math.atan2(Math.sin(d), Math.cos(d)); lam += d * Math.min(1, dt * 3); phi = lerp(phi, goal.phi, Math.min(1, dt * 3)); if (Math.abs(d) < 0.01) goal = null; } if (spin) { spin = Math.max(0, spin - dt * 1.4); if (spin < 0.25) { spin = 0; if (spins !== -1) { const p = pick(PL); select(PL.indexOf(p), true); } } }
    g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.9); gl.addColorStop(0, rgb(COL.pk, 0.2)); gl.addColorStop(0.6, rgb(COL.or, 0.06)); gl.addColorStop(1, rgb(COL.or, 0)); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); body.addColorStop(0, '#1d2547'); body.addColorStop(1, '#0a0d1c'); g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.lineWidth = 1; const line = (pts, c, a) => { g.beginPath(); let pen = false; for (const [x, y, z] of pts) { if (z > 0) { pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; } else pen = false; } g.strokeStyle = rgb(c, a); g.stroke(); };
    for (let la = -60; la <= 60; la += 20) line(Array.from({ length: 73 }, (_, i) => proj(la, i * 5, R, cx, cy)), [255, 255, 255], 0.13);
    for (let lo = 0; lo < 360; lo += 20) line(Array.from({ length: 37 }, (_, i) => proj(-90 + i * 5, lo, R, cx, cy)), [255, 255, 255], 0.13);
    // arcs between places
    g.lineWidth = 1.6; for (let i = 0; i < PL.length; i++) for (let j = i + 1; j < PL.length; j++) { const a = PL[i], b = PL[j], pts = []; for (let k = 0; k <= 40; k++) { const f = k / 40, lat = lerp(a.lat, b.lat, f) + Math.sin(f * Math.PI) * 6, lon = lerp(a.lon, b.lon, f); pts.push(proj(lat, lon, R * (1 + Math.sin(f * Math.PI) * 0.12), cx, cy)); } line(pts, a.been && b.been ? COL.or : COL.pk, a.been && b.been ? 0.9 : 0.5); }
    PL.forEach((p, i) => { const [x, y, z] = proj(p.lat, p.lon, R, cx, cy); p.sx = x; p.sy = y; p.z = z; if (z < 0) return; const on = i === sel, c = p.been ? COL.or : COL.pk; g.globalCompositeOperation = 'lighter'; const q = g.createRadialGradient(x, y, 0, x, y, on ? 34 : 20); q.addColorStop(0, rgb(c, 0.9)); q.addColorStop(1, rgb(c, 0)); g.fillStyle = q; g.fillRect(x - 36, y - 36, 72, 72); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff4e6'; g.beginPath(); g.arc(x, y, on ? 5 : 3.5, 0, TAU); g.fill(); if (on) { g.strokeStyle = rgb(c, 0.8); g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 10 + Math.sin(t * 4) * 2, 0, TAU); g.stroke(); } g.fillStyle = 'rgba(246,241,238,.92)'; g.font = '600 13px Inter, system-ui, sans-serif'; g.textAlign = x > cx ? 'left' : 'right'; g.fillText(p.n, x + (x > cx ? 14 : -14), y + 4); });
    plane += dt * 0.35; const [px, py, pz] = proj(lerp(31, 48.86, (plane % 1)) + Math.sin((plane % 1) * Math.PI) * 6, lerp(28.2, 2.35, plane % 1), R * (1 + Math.sin((plane % 1) * Math.PI) * 0.12), cx, cy); p2 = [px, py, pz]; if (pz > 0 && !api.reduced) { g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 2.2, 0, TAU); g.fill(); }
  }
  let p2 = [0, 0, -1];
  const lp = loop(draw); s.draw = () => draw(0, 0); if (!api.reduced) lp.start();
  function select(i, rand) {
    sel = i; const p = PL[i]; goal = { lam: p.lon * D, phi: p.lat * D * 0.7 }; card.innerHTML = ''; card.append(h('b', { text: p.n }), ' ' + p.t); if (rand) card.append(h('i', {}, ' Didn’t plan that. That’s the point.'));
    [...chips.children].forEach((c, k) => c.classList.toggle('on', k === i)); api.sfx('ping', i * 4); timers.forEach(clearTimeout); timers = []; [...seq.children].forEach((li) => li.classList.remove('on'));
    seq.classList.toggle('on', p.id === 'paris'); if (p.id === 'paris') [...seq.children].forEach((li, k) => timers.push(setTimeout(() => li.classList.add('on'), api.reduced ? 0 : 500 + k * 650)));
    if (api.reduced) { goal = null; lam = p.lon * D; phi = p.lat * D * 0.7; s.draw(); }
  }
  chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('tv-noplan')) { spins++; spin = 7; goal = null; api.sfx('whoosh'); if (spins === 3) api.secret('spin', 'Three spins. You travel like me.'); if (api.reduced) { select(Math.floor(Math.random() * 3), true); } return; } select(+b.dataset.i); });
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); goal = null; spin = 0; });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); lam -= dx * 0.006; phi = clamp(phi + dy * 0.006, -1.1, 1.1); vl = -dx * 0.002; if (api.reduced) s.draw(); });
  cv.addEventListener('pointerup', (e) => { const d = drag; drag = null; if (d && d.moved < 6) { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let hit = -1; PL.forEach((p, i) => { if (p.z > 0 && Math.hypot(p.sx - x, p.sy - y) < 28) hit = i; }); if (hit >= 0) select(hit); else if (!api.reduced && p2[2] > 0 && Math.hypot(p2[0] - x, p2[1] - y) < 22) api.secret('plane', 'Spotted. Window seat, always.'); } vl = Math.max(-0.4, Math.min(0.4, vl)) || 0.05; });
  card.textContent = 'Pick a place. Or don’t.';
  return { destroy() { lp.stop(); s.destroy(); timers.forEach(clearTimeout); } };
}
