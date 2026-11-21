// The hub: a living night sky, a glowing core, and nine places orbiting it. Canvas draws the atmosphere; real buttons carry the interaction.
import { TAU, clamp, lerp, smooth, h, loop, fit, COL, rgb } from './kit.js';
import { motion, isLite } from '../gfx.js';

export function createHub(world, areas, st, cb) {
  const lite = isLite();
  const cv = h('canvas', { class: 'ov-sky', 'aria-hidden': 'true' });
  const list = h('ul', { class: 'ov-nodes' });
  const core = h('button', { type: 'button', class: 'ov-corebtn', 'aria-label': 'The core' });
  const status = h('p', { class: 'ov-status' }), hint = h('p', { class: 'ov-hint', text: 'Nothing here is in order. Poke things.' });
  const nodes = {}, pos = {};
  areas.forEach((a, i) => {
    const pic = h('span', { class: 'ov-pic' }); pic.innerHTML = a.icon;
    const b = h('button', { type: 'button', class: 'ov-node', 'data-id': a.id, 'data-c': a.c }, h('span', { class: 'ov-portal' }, pic), h('span', { class: 'ov-nlabel', text: a.label }), h('span', { class: 'sr-only', 'data-state': '' }, ', not visited yet'));
    b.style.setProperty('--i', i); b.style.setProperty('--d', (6 + (i % 3) * 5) + ''); b.addEventListener('click', () => cb.open(a.id));
    nodes[a.id] = b; list.append(h('li', { class: 'ov-pt' }, b));
  });
  core.addEventListener('click', () => cb.core());
  world.append(cv, list, core, hint, status);

  const s = fit(cv, lite ? 1.25 : 2);
  const stars = Array.from({ length: lite ? 70 : 150 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1, t: Math.random() * TAU, o: Math.random() < 0.18 }));
  const blobs = [{ c: COL.or, x: 0.2, y: 0.3, r: 0.55, a: 0.16, p: 0 }, { c: COL.pk, x: 0.8, y: 0.72, r: 0.6, a: 0.13, p: 2 }, { c: [90, 70, 190], x: 0.55, y: 0.12, r: 0.5, a: 0.12, p: 4 }];
  const ptr = { x: 0, y: 0, tx: 0, ty: 0, px: -999, py: -999 };
  let intro = motion.off ? 1 : 0, flare = 0, flareT = 0, cx = 0, cy = 0, R = 40;

  function layout() {
    const W = s.w, H = s.h; cx = W / 2; cy = H * 0.52; R = clamp(Math.min(W, H) * 0.085, 34, 66);
    const rx = Math.min(W * 0.4, 560), ry = Math.min(H * 0.33, 310);
    areas.forEach((a, i) => { const ang = -Math.PI / 2 + (i * TAU) / areas.length, k = i % 2 ? 0.84 : 1, x = cx + Math.cos(ang) * rx * k, y = cy + Math.sin(ang) * ry * k; pos[a.id] = { x, y }; const n = nodes[a.id].parentElement; n.style.left = x + 'px'; n.style.top = y + 'px'; });
    core.style.left = cx + 'px'; core.style.top = cy + 'px'; core.style.setProperty('--r', R * 2 + 'px');
  }
  s.draw = () => { layout(); frame(0, performance.now() / 1000); };
  world.addEventListener('pointermove', (e) => { const r = world.getBoundingClientRect(); ptr.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ptr.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; ptr.px = e.clientX - r.left; ptr.py = e.clientY - r.top; });
  world.addEventListener('pointerleave', () => { ptr.tx = ptr.ty = 0; ptr.px = ptr.py = -999; });

  const curve = (a, t) => { const p = pos[a.id], mx = (cx + p.x) / 2 + (p.y - cy) * 0.18, my = (cy + p.y) / 2 - (p.x - cx) * 0.18; const u = 1 - t; return [u * u * cx + 2 * u * t * mx + t * t * p.x, u * u * cy + 2 * u * t * my + t * t * p.y, mx, my]; };

  function frame(dt, t) {
    const g = s.g, W = s.w, H = s.h; if (intro < 1) intro = Math.min(1, intro + dt / 1.6); const I = smooth(intro);
    ptr.x = lerp(ptr.x, ptr.tx, Math.min(1, dt * 3 + 0.001)); ptr.y = lerp(ptr.y, ptr.ty, Math.min(1, dt * 3 + 0.001));
    world.style.setProperty('--px', ptr.x.toFixed(3)); world.style.setProperty('--py', ptr.y.toFixed(3));
    flare = lerp(flare, flareT, Math.min(1, dt * 1.5 + 0.001));
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    for (const b of blobs) { const x = (b.x + Math.sin(t * 0.05 + b.p) * 0.05 - ptr.x * 0.02) * W, y = (b.y + Math.cos(t * 0.04 + b.p) * 0.05) * H, r = b.r * Math.max(W, H), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgb(b.c, b.a * I)); gr.addColorStop(1, rgb(b.c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    for (const st2 of stars) {
      const x = (((st2.x * W + ptr.x * st2.z * -26) % W) + W) % W, y = (((st2.y * H + ptr.y * st2.z * -18 + t * st2.z * 2) % H) + H) % H;
      const near = Math.max(0, 1 - Math.hypot(x - ptr.px, y - ptr.py) / 160), a = (0.2 + 0.5 * st2.z) * (0.7 + 0.3 * Math.sin(t * 1.4 + st2.t)) + near * 0.5;
      g.fillStyle = st2.o ? rgb(COL.or, a * I) : rgb([220, 225, 255], a * I); g.beginPath(); g.arc(x, y, 0.5 + st2.z * 1.3 + near, 0, TAU); g.fill();
    }
    if (ptr.px > -900) { const gr = g.createRadialGradient(ptr.px, ptr.py, 0, ptr.px, ptr.py, 240); gr.addColorStop(0, rgb(COL.or, 0.09)); gr.addColorStop(1, rgb(COL.or, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    // paths from the core to each place
    areas.forEach((a, i) => {
      const p = pos[a.id], on = st.seen.has(a.id), [, , mx, my] = curve(a, 0.5);
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(mx, my, p.x, p.y);
      if (on) { const gr = g.createLinearGradient(cx, cy, p.x, p.y); gr.addColorStop(0, rgb(COL.pk, 0.9)); gr.addColorStop(1, rgb(COL.or, 0.9)); g.strokeStyle = gr; g.lineWidth = 1.8; g.setLineDash([]); }
      else { g.strokeStyle = rgb([255, 255, 255], 0.1 * I); g.lineWidth = 1; g.setLineDash([2, 7]); }
      g.stroke(); g.setLineDash([]);
      if (on && !motion.off) { const [x, y] = curve(a, (t * 0.22 + i * 0.13) % 1); const gr = g.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, rgb(COL.warm, 1)); gr.addColorStop(1, rgb(COL.or, 0)); g.fillStyle = gr; g.fillRect(x - 9, y - 9, 18, 18); }
    });
    // the core
    const pu = 1 + 0.045 * Math.sin(t * 1.6) + flare * 0.25, r = R * I * pu, gl = r * (3.4 + flare * 2.2);
    let gr = g.createRadialGradient(cx, cy, 0, cx, cy, gl); gr.addColorStop(0, rgb(COL.warm, 0.95)); gr.addColorStop(0.18, rgb(COL.or, 0.75)); gr.addColorStop(0.5, rgb(COL.pk, 0.22 + flare * 0.2)); gr.addColorStop(1, rgb(COL.pk, 0)); g.fillStyle = gr; g.fillRect(cx - gl, cy - gl, gl * 2, gl * 2);
    g.globalCompositeOperation = 'source-over';
    gr = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); gr.addColorStop(0, '#FFF3E6'); gr.addColorStop(0.35, '#FF9A5C'); gr.addColorStop(0.75, '#FF659D'); gr.addColorStop(1, '#C23A78'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.lineWidth = 1.2; for (let k = 0; k < 2; k++) { g.strokeStyle = rgb(k ? COL.pk : COL.or, 0.45 * I); g.beginPath(); g.ellipse(cx, cy, r * (1.9 + k * 0.5), r * (0.55 + k * 0.2), t * (k ? -0.12 : 0.1) + k, 0, TAU); g.stroke(); }
    const n = areas.length; for (let k = 0; k < n; k++) { const a0 = -Math.PI / 2 + (k * TAU) / n + 0.08, a1 = a0 + TAU / n - 0.16, on = k < st.seen.size; g.strokeStyle = on ? rgb(k % 2 ? COL.pk : COL.or, 1) : rgb([255, 255, 255], 0.14); g.lineWidth = on ? 3 : 1.5; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r * 3.0, a0, a1); g.stroke(); }
  }
  const lp = loop((dt, t) => frame(dt, t));
  const api = {
    layout, start() { layout(); if (motion.off) { frame(0, 0); return; } lp.start(); }, stop() { lp.stop(); }, resume() { if (!motion.off) lp.start(); },
    flare(v = 1) { flareT = v; if (motion.off) { flare = v; frame(0, 0); } },
    el: (id) => nodes[id], center: (id) => pos[id],
    refresh() {
      const n = st.seen.size, sec = st.secrets.size;
      areas.forEach((a) => { const on = st.seen.has(a.id); nodes[a.id].classList.toggle('is-seen', on); nodes[a.id].querySelector('[data-state]').textContent = on ? ', visited' : ', not visited yet'; });
      status.textContent = `${n} / ${areas.length} places${sec ? ` · ${sec} secret${sec > 1 ? 's' : ''}` : ''}`;
      if (n) hint.classList.add('is-gone'); if (motion.off) frame(0, 0);
    },
    hideHint() { hint.classList.add('is-gone'); },
  };
  layout(); api.refresh(); return api;
}
