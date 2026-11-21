// An ideal day (imagined, not a routine). Drag the sun across the sky.
import { h, TAU, clamp, lerp, smooth, mixc, rgb, rnd, loop, fit, COL } from '../kit.js';
const STOPS = [['Sunrise ride', 'A cycle by the sea at sunrise.'], ['Tennis', 'Tennis. For the breeze and the running around, not the trophy.'], ['The ocean', 'Just standing by the ocean for a while.'], ['Food', 'Eating with people I like.'], ['Good talk', 'An interesting conversation. Ideally with a weird tangent.']];
const SKY = [[[22, 18, 58], [255, 101, 157], [255, 160, 90]], [[70, 120, 200], [255, 190, 140], [255, 225, 190]], [[28, 110, 190], [90, 190, 220], [200, 240, 245]], [[60, 30, 90], [255, 101, 157], [255, 121, 61]], [[8, 11, 28], [30, 24, 70], [120, 50, 100]]];
export function mount(root, api) {
  root.classList.add('sc-day');
  const cv = h('canvas', { class: 'dy-cv', 'aria-label': 'A sea view. Drag sideways to move the sun through an imagined ideal day.', role: 'img' });
  const cap = h('p', { class: 'dy-cap', 'aria-live': 'polite' });
  const range = h('input', { type: 'range', min: 0, max: 1, step: 0.001, value: 0, class: 'cd-range', 'aria-label': 'Time of day' });
  const chips = h('div', { class: 'dy-chips' }, STOPS.map(([n], i) => h('button', { type: 'button', 'data-i': i, text: n })));
  const copy = h('div', { class: 'ov-copy ov-copy-top' }, h('p', { class: 'cp-big' }, 'My ideal day. ', h('em', {}, 'Imagined,'), ' not a routine.'), cap);
  root.append(cv, copy, h('div', { class: 'dy-ctl' }, range, chips));
  const s = fit(cv, 1.5); let t = 0, target = 0, ball = { x: 0, y: 0, hit: false }, stars = Array.from({ length: 60 }, () => [Math.random(), Math.random() * 0.55, Math.random()]);
  const idx = () => clamp(Math.round(t * 4), 0, 4);
  const sky = () => { const f = t * 4, i = Math.min(3, Math.floor(f)), k = smooth(f - i); return [0, 1, 2].map((j) => mixc(SKY[i][j], SKY[i + 1][j], k)); };
  function draw(dt, tm) {
    const g = s.g, W = s.w, H = s.h, hor = H * 0.58; g.globalCompositeOperation = 'source-over';
    const [a, b, c] = sky(), gr = g.createLinearGradient(0, 0, 0, hor); gr.addColorStop(0, rgb(a)); gr.addColorStop(0.65, rgb(b)); gr.addColorStop(1, rgb(c)); g.fillStyle = gr; g.fillRect(0, 0, W, hor + 1);
    const night = clamp((t - 0.78) / 0.22, 0, 1) + clamp(0.1 - t, 0, 0.1) * 6; for (const [x, y, z] of stars) { g.fillStyle = rgb([255, 240, 230], clamp(night, 0, 1) * (0.3 + z * 0.6)); g.fillRect(x * W, y * hor, 1.4, 1.4); }
    const sx = lerp(W * 0.1, W * 0.9, t), sy = hor - Math.sin(Math.PI * clamp(t * 1.04 - 0.02, 0, 1)) * hor * 0.78 + (t > 0.97 ? (t - 0.97) * 600 : 0), sr = Math.min(W, H) * 0.075;
    g.globalCompositeOperation = 'lighter'; let sg = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 5); sg.addColorStop(0, rgb(COL.warm, 0.9)); sg.addColorStop(0.2, rgb(COL.or, 0.5)); sg.addColorStop(1, rgb(COL.or, 0)); g.fillStyle = sg; g.fillRect(0, 0, W, hor + 1); g.globalCompositeOperation = 'source-over';
    g.save(); g.beginPath(); g.rect(0, 0, W, hor); g.clip(); g.fillStyle = rgb([255, 236, 210]); g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill(); g.restore();
    const sea = g.createLinearGradient(0, hor, 0, H); sea.addColorStop(0, rgb(mixc(c, [10, 30, 60], 0.45))); sea.addColorStop(1, rgb(mixc(a, [6, 10, 24], 0.7))); g.fillStyle = sea; g.fillRect(0, hor, W, H - hor);
    for (let i = 0; i < 46; i++) { const y = hor + 4 + Math.pow(i / 46, 1.6) * (H - hor - 4), w = 6 + i * 3.2, wob = Math.sin(tm * 0.8 + i * 1.7) * (4 + i * 0.5), glow = Math.max(0, 1 - Math.abs((sx - W / 2) / W * 0 + 0)) * 0.7; g.fillStyle = rgb(COL.warm, (0.5 - i / 100) * (sy < hor + 10 ? 1 : 0) * 0.9); g.fillRect(sx + wob - w / 2, y, w, 1.6); g.fillStyle = rgb([255, 255, 255], 0.05); g.fillRect(0, y + 6, W, 1); }
    // props
    const base = hor + (H - hor) * 0.5, fadeFor = (i) => clamp(1 - Math.abs(t * 4 - i) * 1.6, 0, 1);
    let f = fadeFor(0); if (f > 0) { const x = lerp(W * 0.2, W * 0.8, (tm * 0.08) % 1); g.strokeStyle = rgb([14, 16, 32], f); g.lineWidth = 2.4; g.fillStyle = g.strokeStyle; const r = 11; g.beginPath(); g.arc(x - 18, base, r, 0, TAU); g.arc(x + 18, base, r, 0, TAU); g.moveTo(x - 18, base); g.lineTo(x - 4, base - 16); g.lineTo(x + 18, base); g.moveTo(x - 4, base - 16); g.lineTo(x + 8, base - 16); g.lineTo(x + 18, base); g.stroke(); g.beginPath(); g.arc(x, base - 32, 5, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x, base - 26); g.lineTo(x - 4, base - 16); g.stroke(); }
    f = fadeFor(1); if (f > 0) { g.strokeStyle = rgb([255, 255, 255], 0.5 * f); g.lineWidth = 1.5; const cx = W / 2, gy = base + 16; g.beginPath(); g.moveTo(cx - 150, gy); g.lineTo(cx + 150, gy); g.moveTo(cx, gy - 40); g.lineTo(cx, gy); g.stroke(); ball.x = cx + Math.sin(tm * 1.8) * 120; ball.y = gy - Math.abs(Math.cos(tm * 1.8)) * 70 - 6; g.fillStyle = rgb(COL.or, f); g.beginPath(); g.arc(ball.x, ball.y, 8, 0, TAU); g.fill(); g.strokeStyle = rgb([14, 16, 32], 0.5 * f); g.beginPath(); g.arc(ball.x, ball.y, 8, 0.6, 2.4); g.stroke(); } else ball.x = -99;
    f = fadeFor(3); if (f > 0) { const cx = W / 2, gy = base + 12; g.fillStyle = rgb([18, 14, 30], 0.85 * f); g.fillRect(cx - 120, gy, 240, 6); for (const dx of [-70, 70]) { g.fillStyle = rgb([255, 236, 210], f); g.beginPath(); g.ellipse(cx + dx, gy - 3, 28, 6, 0, 0, TAU); g.fill(); } g.globalCompositeOperation = 'lighter'; const cg = g.createRadialGradient(cx, gy - 14, 0, cx, gy - 14, 60); cg.addColorStop(0, rgb(COL.or, 0.7 * f)); cg.addColorStop(1, rgb(COL.or, 0)); g.fillStyle = cg; g.fillRect(cx - 60, gy - 74, 120, 120); g.globalCompositeOperation = 'source-over'; g.fillStyle = rgb(COL.warm, f); g.fillRect(cx - 2, gy - 22, 4, 14); }
    f = fadeFor(4); if (f > 0) { const cx = W / 2, gy = base - 4; [[-70, COL.or, 0], [70, COL.pk, 1]].forEach(([dx, c, k]) => { const bob = Math.sin(tm * 1.6 + k * 2) * 3, x = cx + dx, y = gy + bob; g.fillStyle = rgb(c, 0.9 * f); g.beginPath(); g.roundRect(x - 52, y - 24, 104, 44, 14); g.fill(); g.beginPath(); g.moveTo(x + (k ? 18 : -18), y + 20); g.lineTo(x + (k ? 28 : -28), y + 34); g.lineTo(x + (k ? 4 : -4), y + 20); g.fill(); g.fillStyle = rgb([14, 16, 32], 0.8 * f); for (let d = 0; d < 3; d++) { g.beginPath(); g.arc(x - 16 + d * 16, y - 2, 3.5 + Math.max(0, Math.sin(tm * 4 - d)) * 1.5, 0, TAU); g.fill(); } }); }
  }
  const lp = loop((dt, tm) => { t = lerp(t, target, Math.min(1, dt * 5)); range.value = t; const i = idx(); if (cap.dataset.i !== String(i)) { cap.dataset.i = i; cap.textContent = STOPS[i][1]; [...chips.children].forEach((c, k) => c.classList.toggle('on', k === i)); } draw(dt, tm); });
  s.draw = () => draw(0, 1); const go = (v) => { target = clamp(v, 0, 1); if (api.reduced) { t = target; range.value = t; s.draw(); const i = idx(); cap.dataset.i = i; cap.textContent = STOPS[i][1]; [...chips.children].forEach((c, k) => c.classList.toggle('on', k === i)); } };
  if (!api.reduced) lp.start(); go(0); t = 0; cap.dataset.i = ''; if (api.reduced) go(0);
  let drag = false; cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; if (ball.x > 0 && Math.hypot(e.clientX - r.left - ball.x, e.clientY - r.top - ball.y) < 26) { api.secret('ball', 'Breeze over score. Always.'); api.sfx('pop'); } go((x - 0.1) / 0.8); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const r = cv.getBoundingClientRect(); go(((e.clientX - r.left) / r.width - 0.1) / 0.8); }); addEventListener('pointerup', () => { drag = false; });
  range.addEventListener('input', () => { go(+range.value); }); chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { go(+b.dataset.i / 4); api.sfx('ping', +b.dataset.i * 2); } });
  return { destroy() { lp.stop(); s.destroy(); } };
}
