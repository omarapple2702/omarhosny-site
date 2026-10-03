// Tiny software 3D renderer on Canvas 2D. No dependencies, same-origin only.
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const PAL = { cyan: [82, 217, 234], blue: [74, 124, 255], navy: [14, 25, 43], ink: [5, 10, 19], text: [232, 238, 247], steel: [96, 118, 150] };
export const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const setAccent = (c) => { PAL.cyan = c; };

// Motion preference: the OS setting or the footer switch.
export const motion = { off: matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced' };
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => { motion.off = e.matches; window.dispatchEvent(new Event('oh:motion')); });
export const setMotion = (off) => { motion.off = off; document.documentElement.dataset.motion = off ? 'reduced' : 'full'; window.dispatchEvent(new Event('oh:motion')); };
export const isLite = () => matchMedia('(max-width: 46rem), (pointer: coarse)').matches;

export class Stage {
  constructor(canvas, o = {}) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.dist = o.dist ?? 7; this.fovK = o.fov ?? 1;
    this.lite = isLite(); this.dprMax = o.dpr ?? (this.lite ? 1.25 : 2); this.q = []; this.w = 1; this.h = 1;
    this.yaw = 0; this.pitch = 0; this.ox = 0; this.oy = 0; this.kicks = 0; this.wake = () => {};
    this.ptr = { x: 0, y: 0, sx: -999, sy: -999, in: false, down: false, vx: 0, vy: 0 };
    this.u = { x: 0, y: 0, vx: 0, vy: 0 }; // user drag rotation + inertia
    this.resize(); new ResizeObserver(() => { this.resize(); this.wake(2); }).observe(canvas);
    const local = (e) => { const r = canvas.getBoundingClientRect(); this.ptr.sx = e.clientX - r.left; this.ptr.sy = e.clientY - r.top; };
    window.addEventListener('pointermove', (e) => { this.ptr.x = (e.clientX / innerWidth) * 2 - 1; this.ptr.y = (e.clientY / innerHeight) * 2 - 1; if (this.ptr.down) { this.u.vy = (e.movementX || 0) * 0.006; this.u.vx = (e.movementY || 0) * 0.006; this.u.y += this.u.vy; this.u.x += this.u.vx; } if (this.ptr.in) { local(e); this.wake?.(30); } }, { passive: true });
    canvas.addEventListener('pointerenter', (e) => { this.ptr.in = true; local(e); });
    canvas.addEventListener('pointerleave', () => { this.ptr.in = false; this.ptr.sx = this.ptr.sy = -999; this.wake?.(30); });
    canvas.addEventListener('pointerdown', (e) => { this.ptr.down = true; this.ptr.in = true; local(e); canvas.setPointerCapture?.(e.pointerId); this.wake?.(30); });
    const up = () => { this.ptr.down = false; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  }
  get amb() { return motion.off ? 0 : 1; }
  resize() {
    const r = this.c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, this.dprMax);
    this.w = Math.max(1, Math.round(r.width)); this.h = Math.max(1, Math.round(r.height));
    this.c.width = Math.round(this.w * d); this.c.height = Math.round(this.h * d); this.g.setTransform(d, 0, 0, d, 0, 0);
  }
  // Frame loop: only runs while visible; in reduced motion it renders on demand.
  run(frame) {
    let raf = 0, last = 0, vis = false;
    const tick = (t) => {
      raf = 0; if (!vis || document.hidden) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      this.u.x += this.u.vx; this.u.y += this.u.vy; if (!this.ptr.down) { this.u.vx *= 0.94; this.u.vy *= 0.94; }
      frame(t / 1000, dt);
      if (this.amb || this.kicks-- > 0 || Math.abs(this.u.vx) + Math.abs(this.u.vy) > 0.0004) raf = requestAnimationFrame(tick);
    };
    this.wake = (n = 40) => { this.kicks = Math.max(this.kicks, n); if (vis && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) this.wake(3); }, { rootMargin: '100px' }).observe(this.c);
    document.addEventListener('visibilitychange', () => !document.hidden && this.wake(3));
    window.addEventListener('oh:motion', () => this.wake(3));
    return this;
  }
  begin() {
    this.g.clearRect(0, 0, this.w, this.h); this.q.length = 0;
    this.f = this.fovK * 0.15 * Math.min(this.w, this.h) * this.dist;
    this._cyc = Math.cos(this.yaw); this._cys = Math.sin(this.yaw); this._cxc = Math.cos(this.pitch); this._cxs = Math.sin(this.pitch);
  }
  // Model transform → returns fn(point) giving a world point; fn.n(vec) rotates a normal.
  tf(m = {}) {
    const s = m.s ?? 1, cz = Math.cos(m.rz || 0), sz = Math.sin(m.rz || 0), cx = Math.cos(m.rx || 0), sx = Math.sin(m.rx || 0), cy = Math.cos(m.ry || 0), sy = Math.sin(m.ry || 0), tx = m.tx || 0, ty = m.ty || 0, tz = m.tz || 0;
    const rot = (p) => { let x = p[0], y = p[1], z = p[2], t; t = x * cz - y * sz; y = x * sz + y * cz; x = t; t = y * cx - z * sx; z = y * sx + z * cx; y = t; t = x * cy + z * sy; z = -x * sy + z * cy; x = t; return [x, y, z]; };
    const w = (p) => { const r = rot([p[0] * s, p[1] * s, p[2] * s]); return [r[0] + tx, r[1] + ty, r[2] + tz]; };
    w.n = rot; return w;
  }
  cam(p) {
    let x = p[0], y = p[1], z = p[2], t;
    t = x * this._cyc + z * this._cys; z = -x * this._cys + z * this._cyc; x = t;
    t = y * this._cxc - z * this._cxs; z = y * this._cxs + z * this._cxc; y = t;
    z += this.dist; const k = this.f / Math.max(0.3, z);
    return [this.w / 2 + x * k + this.ox, this.h / 2 - y * k + this.oy, z, k];
  }
  fog(z, near = 0.55, far = 1.6) { return clamp(1 - (z - this.dist * near) / (this.dist * far), 0.08, 1); }
  push(z, d) { this.q.push({ z, d }); }
  line(a, b, col, al = 1, wid = 1) {
    const A = this.cam(a), B = this.cam(b), k = (A[3] + B[3]) / 2 / (this.f / this.dist);
    this.push((A[2] + B[2]) / 2, (g) => { g.strokeStyle = css(col, al); g.lineWidth = Math.max(0.5, wid * k); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); });
  }
  dot(p, r, col, al = 1) {
    const P = this.cam(p), rr = Math.max(0.6, r * P[3]);
    this.push(P[2], (g) => { g.fillStyle = css(col, al); g.beginPath(); g.arc(P[0], P[1], rr, 0, TAU); g.fill(); });
    return P;
  }
  glowDot(p, r, col, al = 1) {
    const P = this.cam(p), rr = Math.max(1.2, r * P[3]);
    this.push(P[2], (g) => { const gr = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], rr * 3.2); gr.addColorStop(0, css(col, al)); gr.addColorStop(0.3, css(col, al * 0.35)); gr.addColorStop(1, css(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(P[0], P[1], rr * 3.2, 0, TAU); g.fill(); g.fillStyle = css([255, 255, 255], al * 0.9); g.beginPath(); g.arc(P[0], P[1], Math.max(0.8, rr * 0.45), 0, TAU); g.fill(); });
    return P;
  }
  poly(pts, fill, stroke, wid = 1, strokeA = 1) {
    const P = pts.map((p) => this.cam(p)); let z = 0; for (const p of P) z += p[2]; z /= P.length;
    this.push(z, (g) => { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = css(stroke, strokeA); g.lineWidth = wid; g.lineJoin = 'round'; g.stroke(); } });
    return P;
  }
  text(str, p, size, col, al = 1, align = 'center', weight = 600) {
    const P = this.cam(p), k = P[3];
    this.push(P[2] - 0.01, (g) => { g.font = `${weight} ${Math.max(9, size * k)}px "Hanken Grotesk", system-ui, sans-serif`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = css(col, al); g.fillText(str, P[0], P[1]); });
    return P;
  }
  // Shaded mesh. opt: {light:[x,y,z], base, edge, fillA, wire, lit}
  mesh(m, w, o = {}) {
    const L = o.light || [-0.4, 0.7, -0.6], ll = Math.hypot(...L), base = o.base || PAL.blue, edge = o.edge || PAL.cyan;
    const W = m.v.map(w);
    for (const f of m.f) {
      const n = w.n(f.n), d = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / ll, shade = clamp(0.25 + 0.75 * Math.max(0, d), 0, 1);
      const pts = f.i.map((i) => W[i]);
      const c = mix([base[0] * 0.25, base[1] * 0.25, base[2] * 0.3], base, shade);
      this.poly(pts, o.wire ? null : css(c, o.fillA ?? 1), edge, o.wire ? 1.2 : 0.8, o.wire ? 0.9 : 0.35);
    }
  }
  // Immediate (behind-everything) radial glow
  glow(p, r, col, al = 1) {
    const P = this.cam(p), g = this.g, rr = r * P[3];
    const gr = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], rr); gr.addColorStop(0, css(col, al)); gr.addColorStop(1, css(col, 0));
    g.fillStyle = gr; g.fillRect(P[0] - rr, P[1] - rr, rr * 2, rr * 2); return P;
  }
  flush() { this.q.sort((a, b) => b.z - a.z); for (const o of this.q) o.d(this.g); this.q.length = 0; }
}

// ---- mesh generators (faces carry outward normals for lighting) ----
const unit = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cent = (v, idx) => idx.reduce((a, i) => [a[0] + v[i][0] / idx.length, a[1] + v[i][1] / idx.length, a[2] + v[i][2] / idx.length], [0, 0, 0]);
export function edgesOf(f) { const s = new Set(), e = []; for (const q of f) for (let i = 0; i < q.i.length; i++) { const a = q.i[i], b = q.i[(i + 1) % q.i.length], k = a < b ? a + '_' + b : b + '_' + a; if (!s.has(k)) { s.add(k); e.push([a, b]); } } return e; }
export const Mesh = {
  box(w = 1, h = 1, d = 1) {
    const x = w / 2, y = h / 2, z = d / 2, v = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
    const f = [{ i: [0, 1, 2, 3], n: [0, 0, -1] }, { i: [5, 4, 7, 6], n: [0, 0, 1] }, { i: [4, 0, 3, 7], n: [-1, 0, 0] }, { i: [1, 5, 6, 2], n: [1, 0, 0] }, { i: [3, 2, 6, 7], n: [0, 1, 0] }, { i: [4, 5, 1, 0], n: [0, -1, 0] }];
    return { v, f, e: edgesOf(f) };
  },
  ico() {
    const t = (1 + Math.sqrt(5)) / 2, v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(unit);
    const idx = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const f = idx.map((i) => ({ i, n: unit(cent(v, i)) }));
    return { v, f, e: edgesOf(f) };
  },
  torus(R = 1, r = 0.38, a = 24, b = 12) {
    const v = [], f = [];
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) { const u = (i / a) * TAU, t = (j / b) * TAU; v.push([(R + r * Math.cos(t)) * Math.cos(u), r * Math.sin(t), (R + r * Math.cos(t)) * Math.sin(u)]); }
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) {
      const i2 = (i + 1) % a, j2 = (j + 1) % b, q = [i * b + j, i2 * b + j, i2 * b + j2, i * b + j2], c = cent(v, q), u = Math.atan2(c[2], c[0]);
      f.push({ i: q, n: unit([c[0] - R * Math.cos(u), c[1], c[2] - R * Math.sin(u)]) });
    }
    return { v, f, e: edgesOf(f) };
  },
  sphere(lat = 10, lon = 16, r = 1) {
    const v = [], f = [];
    for (let i = 0; i <= lat; i++) for (let j = 0; j < lon; j++) { const p = (i / lat) * Math.PI, t = (j / lon) * TAU; v.push([r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)]); }
    for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) { const j2 = (j + 1) % lon, q = [i * lon + j, (i + 1) * lon + j, (i + 1) * lon + j2, i * lon + j2]; f.push({ i: q, n: unit(cent(v, q)) }); }
    return { v, f, e: edgesOf(f) };
  },
};
export const circle = (r, n = 48, y = 0) => Array.from({ length: n + 1 }, (_, i) => [r * Math.cos((i / n) * TAU), y, r * Math.sin((i / n) * TAU)]);
export const latlon = (lat, lon, r = 1) => { const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180; return [r * Math.cos(a) * Math.sin(b), r * Math.sin(a), -r * Math.cos(a) * Math.cos(b)]; };
