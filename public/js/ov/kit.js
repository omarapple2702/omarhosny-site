// Small shared helpers for the Omarverse. No libraries. Never writes style="" attributes (the CSP forbids them): use classes, CSS variables and the CSSOM.
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const smooth = (t) => t * t * (3 - 2 * t);
export const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const COL = { or: [255, 121, 61], pk: [255, 101, 157], bg: [8, 11, 20], mid: [17, 24, 39], warm: [255, 214, 170] };

export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
// Parse trusted SVG/HTML markup (must contain no style attributes).
export const parse = (markup) => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstElementChild; };

// requestAnimationFrame loop with start/stop and a clamped delta.
export function loop(fn) {
  let raf = 0, last = 0, run = false;
  const f = (t) => { raf = 0; if (!run) return; const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; fn(dt, t / 1000); if (run) raf = requestAnimationFrame(f); };
  return { start() { if (run) return; run = true; last = 0; raf = requestAnimationFrame(f); }, stop() { run = false; cancelAnimationFrame(raf); raf = 0; }, get on() { return run; } };
}
// Keeps a canvas sharp at its CSS size. `s.draw` is called after every resize so static frames stay correct.
export function fit(cv, dprMax = 2) {
  const s = { g: cv.getContext('2d'), w: 1, h: 1, dpr: 1, draw: null };
  const f = () => { const r = cv.getBoundingClientRect(); s.dpr = Math.min(devicePixelRatio || 1, dprMax); s.w = Math.max(1, r.width); s.h = Math.max(1, r.height); cv.width = Math.round(s.w * s.dpr); cv.height = Math.round(s.h * s.dpr); s.g.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); s.draw?.(); };
  const ro = new ResizeObserver(f); ro.observe(cv); f(); s.destroy = () => ro.disconnect(); return s;
}
// Normalised pointer inside an element: x,y in 0..1, plus pixel coordinates.
export function pointer(el, cb) {
  const on = (e) => { const r = el.getBoundingClientRect(); cb({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, px: e.clientX - r.left, py: e.clientY - r.top, type: e.type, e }); };
  ['pointermove', 'pointerdown', 'pointerup', 'pointerleave', 'pointercancel'].forEach((t) => el.addEventListener(t, on)); return on;
}
// A tiny burst of sparks (Web Animations API, so it is CSP safe).
export function sparks(host, x, y, n = 10, cols = ['#FF793D', '#FF659D', '#FFD6AA']) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced') return;
  for (let i = 0; i < n; i++) {
    const e = h('i', { class: 'ov-spark', 'aria-hidden': 'true' }); e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.background = cols[i % cols.length]; host.append(e);
    const a = rnd(0, TAU), d = rnd(30, 90);
    e.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d - 3}px,${Math.sin(a) * d - 3}px) scale(0)`, opacity: 0 }], { duration: rnd(500, 900), easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => e.remove();
  }
}
