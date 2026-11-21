// What's next: walk toward a horizon that keeps moving. Nothing is promised. That's the point.
import { h, TAU, clamp, lerp, rgb, rnd, loop, fit, COL } from '../kit.js';
const LINES = ['More building.', 'More learning.', 'More places. More people.', 'Mostly solo. If there’s ever a team: small, close, supportive.', 'I’d rather be known as Omar than as a job title.'];
export function mount(root, api) {
  root.classList.add('sc-next');
  const cv = h('canvas', { class: 'nx-cv', role: 'img', 'aria-label': 'A glowing path leading toward a horizon. Hold to keep walking.' });
  const list = h('ul', { class: 'nx-lines', 'aria-live': 'polite' }, LINES.map((t) => h('li', { text: t })));
  const go = h('button', { type: 'button', class: 'btn btn-primary nx-go' }, 'Keep going');
  const big = h('p', { class: 'nx-big' }, 'Just Omar.');
  const sun = h('button', { type: 'button', class: 'nx-sun', 'aria-label': 'The sun, low on the horizon', tabindex: '-1' });
  root.append(cv, sun, h('div', { class: 'ov-copy ov-copy-top' }, h('p', { class: 'cp-big' }, 'What’s ', h('em', {}, 'next?'), ' Don’t know. That’s the fun part.'), list, big), h('div', { class: 'nx-ctl' }, go));
  const s = fit(cv, 1.5); let dist = 0, walking = false, auto = false, shown = 0; const lights = Array.from({ length: 28 }, () => ({ x: rnd(-1, 1), at: rnd(0.04, 1), c: Math.random() < 0.55 ? COL.or : COL.pk, r: rnd(1.5, 3.4) }));
  const prog = () => 1 - Math.exp(-dist / 14);
  function draw(dt, t) {
    const g = s.g, W = s.w, H = s.h, hor = H * 0.5, p = prog(); const q = g.createLinearGradient(0, 0, 0, hor); q.addColorStop(0, '#080B14'); q.addColorStop(0.55, rgb(lerp(26, 70, p) > 0 ? [30 + p * 40, 16, 60] : [30, 16, 60])); q.addColorStop(1, rgb([255, 121 - p * 20, 61 + p * 50], 0.55 + p * 0.35)); g.fillStyle = q; g.fillRect(0, 0, W, hor + 1);
    g.fillStyle = '#080B14'; g.fillRect(0, hor, W, H - hor); g.globalCompositeOperation = 'lighter'; const sr = 80 + p * 190, sg = g.createRadialGradient(W / 2, hor, 0, W / 2, hor, sr); sg.addColorStop(0, rgb(COL.warm, 0.9)); sg.addColorStop(0.2, rgb(COL.or, 0.5)); sg.addColorStop(0.6, rgb(COL.pk, 0.16)); sg.addColorStop(1, rgb(COL.pk, 0)); g.fillStyle = sg; g.fillRect(0, hor - sr, W, sr * 1.1);
    g.strokeStyle = rgb(COL.pk, 0.5); g.lineWidth = 1; for (let i = 0; i < 18; i++) { const f = ((i + dist * 0.35) % 18) / 18, y = hor + f * f * (H - hor); g.globalAlpha = 0.2 + f * 0.6; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } for (let i = -9; i <= 9; i++) { g.globalAlpha = 0.35; g.beginPath(); g.moveTo(W / 2 + i * 12, hor); g.lineTo(W / 2 + i * W * 0.13, H); g.stroke(); } g.globalAlpha = 1;
    for (const l of lights) { if (p < l.at * 0.9) continue; const a = clamp((p - l.at * 0.9) * 8, 0, 1) * (0.5 + 0.5 * Math.sin(t * 2 + l.at * 9)), x = W / 2 + l.x * W * 0.45 * (0.3 + l.at * 0.7), y = hor - 6 - l.at * 14; const gl = g.createRadialGradient(x, y, 0, x, y, 14 * l.r); gl.addColorStop(0, rgb(l.c, a)); gl.addColorStop(1, rgb(l.c, 0)); g.fillStyle = gl; g.fillRect(x - 40, y - 40, 80, 80); }
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#080B14'; g.fillRect(0, hor - 2, W, 3);
    sun.style.left = W / 2 + 'px'; sun.style.top = hor + 'px';
  }
  const lp = loop((dt, t) => { if (walking || auto) dist += dt * 3; const p = prog(), n = Math.min(LINES.length, Math.floor(p * 6.2)); if (n !== shown) { shown = n; [...list.children].forEach((li, k) => li.classList.toggle('on', k < n)); if (n) api.sfx('ping', n * 2); if (n === LINES.length) { big.classList.add('on'); sun.tabIndex = 0; api.say('There’s always more road.'); } } draw(dt, t); });
  s.draw = () => draw(0, 0); if (!api.reduced) lp.start();
  const stepR = () => { dist += 5; const p = prog(), n = Math.min(LINES.length, Math.floor(p * 6.2)); [...list.children].forEach((li, k) => li.classList.toggle('on', k < n)); if (n === LINES.length) { big.classList.add('on'); sun.tabIndex = 0; } s.draw(); };
  const start = () => { walking = true; }, stop = () => { walking = false; };
  go.addEventListener('pointerdown', (e) => { e.preventDefault(); start(); }); addEventListener('pointerup', stop); go.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start(); } }); go.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  cv.addEventListener('pointerdown', start); cv.addEventListener('wheel', (e) => { dist += Math.max(0, e.deltaY) * 0.03; }, { passive: true });
  addEventListener('keydown', (e) => { if (e.key === 'ArrowUp' || e.key === 'w') start(); }); addEventListener('keyup', (e) => { if (e.key === 'ArrowUp' || e.key === 'w') stop(); });
  if (api.reduced) go.addEventListener('click', stepR);
  go.addEventListener('click', () => { if (!api.reduced && !walking) { dist += 1.2; } });
  sun.addEventListener('click', () => api.secret('sun', 'Not a job title. Just Omar.'));
  return { destroy() { lp.stop(); s.destroy(); removeEventListener('pointerup', stop); } };
}
