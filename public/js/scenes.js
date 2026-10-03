// 3D scenes. Each one is mounted on a <canvas data-scene="name"> and only runs while visible.
import { Stage, Mesh, PAL, TAU, clamp, lerp, ease, css, mix, circle, latlon, motion } from './gfx.js';
import { siteData, $ } from './util.js';

const inside = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
const follow = (st, dt, ax = 0.5, ay = 0.3, k = 3.5) => { const a = st.amb, e = 1 - Math.exp(-dt * k); st.yaw += (st.ptr.x * ax * a - st.yaw) * e; st.pitch += (st.ptr.y * ay * a - st.pitch) * e; };

export const scenes = {
  // ---- Home hero: a core with the projects orbiting it as clickable nodes ----
  hero(st) {
    const lite = st.lite, N = lite ? 55 : 110, ico = Mesh.ico(), spin = { v: 0 }; let burst = 0, pulse = -1, hover = null;
    const parts = Array.from({ length: N }, () => { const u = Math.random() * 2 - 1, a = Math.random() * TAU, r = 1.9 + Math.random() * 1.6, s = Math.sqrt(1 - u * u); return { p: [r * s * Math.cos(a), r * u, r * s * Math.sin(a)], ph: Math.random() * TAU, sz: 0.012 + Math.random() * 0.02 }; });
    const projs = (siteData().projects || []).map((p, i, all) => ({ ...p, R: 2.35 + (i % 3) * 0.3, ph: (i / all.length) * TAU, sp: 0.16 + (i % 2) * 0.05, tilt: (i % 3 - 1) * 0.5 }));
    let hits = [];
    st.dist = 8.2;
    st.c.addEventListener('click', (e) => {
      const r = st.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const h = hits.filter((n) => Math.hypot(n.x - x, n.y - y) < (n.r + (st.lite ? 20 : 10))).sort((a, b) => a.z - b.z)[0];
      if (h?.href) { location.href = h.href; return; }
      pulse = 0; burst = 1; spin.v += 2.2; st.wake(90);
    });
    st.run((t, dt) => {
      const A = st.amb, sc = clamp(scrollY / Math.max(1, innerHeight), 0, 1.4);
      follow(st, dt, 0.45, 0.28); st.begin(); st.dist = 8.2 + sc * 1.8;
      spin.v *= Math.exp(-dt * 1.6); burst *= Math.exp(-dt * 1.8); if (pulse >= 0) pulse += dt * 1.4; if (pulse > 1) pulse = -1;
      const ry = t * 0.2 * A + spin.v * 0.5 + st.u.y + sc * 1.2, rx = 0.35 + Math.sin(t * 0.3) * 0.1 * A + st.u.x;
      st.glow([0, 0, 0], 3.4 + Math.sin(t * 1.4) * 0.15 * A, PAL.blue, 0.22); st.glow([0, 0, 0], 1.5, PAL.cyan, 0.3 + (pulse >= 0 ? 0.3 * (1 - pulse) : 0));
      const w = st.tf({ ry, rx, s: 1.25 + burst * 0.12 });
      const V = ico.v.map(w);
      for (const [a, b] of ico.e) st.line(V[a], V[b], PAL.cyan, 0.55 * st.fog(st.cam(V[a])[2]), 1.3);
      for (const p of V) st.glowDot(p, 0.045, PAL.cyan, 0.9);
      const wi = st.tf({ ry: -ry * 1.6, rx: -rx, s: 0.62 }), VI = ico.v.map(wi);
      for (const [a, b] of ico.e) st.line(VI[a], VI[b], PAL.blue, 0.4, 1);
      [[2.0, 0.5, 0.15], [2.6, -0.7, -0.1], [3.2, 1.1, 0.06]].forEach(([R, tl, sp], i) => {
        const wr = st.tf({ rx: tl + 1.1, rz: tl, ry: t * sp * A * (i % 2 ? -1 : 1) + st.u.y * 0.5 }), P = circle(R, 56).map(wr);
        for (let k = 0; k < P.length - 1; k++) { const z = st.cam(P[k])[2]; st.line(P[k], P[k + 1], i === 1 ? PAL.blue : PAL.cyan, 0.5 * st.fog(z), 1.1); }
        if (pulse >= 0) { const wp = st.tf({ rx: tl + 1.1, rz: tl }); const Q = circle(R * (0.3 + pulse * 1.0), 40).map(wp); for (let k = 0; k < Q.length - 1; k++) st.line(Q[k], Q[k + 1], PAL.cyan, 0.7 * (1 - pulse), 1.6); }
      });
      const wp = st.tf({ ry: -t * 0.04 * A + st.u.y * 0.4 });
      for (const q of parts) { const p = wp(q.p.map((c) => c * (1 + burst * 0.35))), P = st.cam(p); st.dot(p, q.sz * 1.2, PAL.text, st.fog(P[2]) * (0.35 + 0.35 * Math.sin(t * 1.3 + q.ph) * A + 0.2)); }
      hits = [];
      const wn = st.tf({ ry: ry * 0.35 + st.u.y * 0.5 });
      let hv = null;
      for (const n of projs) {
        const a = n.ph + t * n.sp * A, p = wn([n.R * Math.cos(a), Math.sin(a * 1.3) * n.tilt, n.R * Math.sin(a)]);
        const P = st.cam(p), k = P[3] / (st.f / st.dist), isH = hover === n.slug;
        st.line([0, 0, 0], p, PAL.cyan, 0.14 * st.fog(P[2]), 1);
        st.glowDot(p, isH ? 0.11 : 0.08, PAL.cyan, 0.95 * st.fog(P[2], 0.5, 1.2));
        const fr = st.fog(P[2], 0.6, 0.9);
        st.text(n.name + (n.pending ? ' (soon)' : ''), [p[0], p[1] - 0.3, p[2]], isH ? 0.24 : 0.2, PAL.text, isH ? 1 : 0.35 + 0.6 * fr);
        const h = { x: P[0], y: P[1], r: 0.1 * st.f / P[2] + 8, z: P[2], href: n.href, slug: n.slug }; hits.push(h);
        if (Math.hypot(h.x - st.ptr.sx, h.y - st.ptr.sy) < h.r + 12 && (!hv || h.z < hv.z)) hv = h;
      }
      hover = hv?.slug || null; st.c.style.cursor = hv ? 'pointer' : st.ptr.down ? 'grabbing' : 'grab'; st.flush();
    });
  },

  // ---- TerraView: a small globe ----
  globe(st) {
    const cities = [['Alexandria', 31.2, 29.9], ['London', 51.5, -0.1], ['New York', 40.7, -74], ['Tokyo', 35.7, 139.7], ['Sydney', -33.9, 151.2], ['São Paulo', -23.5, -46.6]];
    st.dist = 4.6; st.pitch = 0.25; let lon = 0.4;
    st.run((t, dt) => {
      st.begin(); lon += dt * 0.25 * st.amb + st.u.vy * 0; const ry = lon + st.u.y, rx = 0.3 + st.u.x * 0.6, w = st.tf({ ry, rx });
      const C = st.cam([0, 0, 0]), R = (st.f / C[2]) * 1.0, g = st.g;
      const atm = g.createRadialGradient(C[0], C[1], R * 0.9, C[0], C[1], R * 1.28); atm.addColorStop(0, css(PAL.cyan, 0.35)); atm.addColorStop(1, css(PAL.cyan, 0));
      g.fillStyle = atm; g.beginPath(); g.arc(C[0], C[1], R * 1.28, 0, TAU); g.fill();
      const body = g.createRadialGradient(C[0] - R * 0.4, C[1] - R * 0.4, R * 0.1, C[0], C[1], R); body.addColorStop(0, '#16345a'); body.addColorStop(0.6, '#0b1b34'); body.addColorStop(1, '#050a13');
      g.fillStyle = body; g.beginPath(); g.arc(C[0], C[1], R, 0, TAU); g.fill();
      const seg = (a, b) => { const A = w(a), B = w(b), z = st.cam([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2])[2]; st.line(A, B, PAL.cyan, z < st.dist ? 0.55 : 0.07, 1); };
      for (let la = -60; la <= 60; la += 30) { let prev = null; for (let lo = 0; lo <= 360; lo += 10) { const p = latlon(la, lo); if (prev) seg(prev, p); prev = p; } }
      for (let lo = 0; lo < 360; lo += 30) { let prev = null; for (let la = -90; la <= 90; la += 10) { const p = latlon(la, lo); if (prev) seg(prev, p); prev = p; } }
      for (const [name, la, lo] of cities) { const p = w(latlon(la, lo, 1.03)), P = st.cam(p); if (P[2] < st.dist - 0.05) { const pu = 0.5 + 0.5 * Math.sin(t * 2 + la) * st.amb; st.glowDot(p, 0.03 + pu * 0.012, PAL.cyan, 0.95); st.text(name, [p[0], p[1] + 0.1, p[2]], 0.085, PAL.text, 0.85); } }
      st.flush();
    });
  },

  // ---- WeLock: a lock that locks, hovers, unlocks ----
  lock(st) {
    let state = 'locked', p = 0, timer = 0; const body = Mesh.box(2.2, 1.7, 1), status = $('#lock-status'), btn = $('#lock-btn');
    st.dist = 6.6;
    const set = (s) => { state = s; clearTimeout(timer); if (s === 'unlocking' || s === 'unlocked') timer = setTimeout(() => set('locking'), 6000); if (btn) { btn.textContent = s === 'locked' || s === 'locking' ? 'Unlock with Touch ID' : 'Lock now'; btn.setAttribute('aria-pressed', String(s === 'unlocked' || s === 'unlocking')); } if (status) status.textContent = { locked: 'Locked', unlocking: 'Unlocking…', unlocked: 'Unlocked. It re-locks after a few seconds.', locking: 'Locking…' }[s]; st.wake(160); };
    const toggle = () => set(state === 'locked' || state === 'locking' ? 'unlocking' : 'locking');
    st.c.addEventListener('click', toggle); btn?.addEventListener('click', toggle); set('locked');
    st.run((t, dt) => {
      follow(st, dt, 0.35, 0.2); st.begin();
      const target = state === 'unlocking' || state === 'unlocked' ? 1 : 0; p = lerp(p, target, 1 - Math.exp(-dt * 4.5));
      if (state === 'unlocking' && p > 0.985) set('unlocked'); if (state === 'locking' && p < 0.015) set('locked');
      const hov = st.ptr.in ? 1 : 0, e = ease(p), wob = Math.sin(t * 22) * 0.012 * hov * (1 - e) * st.amb;
      const w = st.tf({ ry: 0.4 + Math.sin(t * 0.5) * 0.15 * st.amb + st.u.y, rx: -0.12 + st.u.x, ty: -0.2 });
      st.glow(w([0, 0, 0]), 3.2, PAL.blue, 0.2 + 0.2 * e);
      st.mesh(body, w, { base: [72, 92, 128], edge: PAL.cyan, light: [-0.5, 0.8, -0.6] });
      const sh = [], lift = e * 0.42, pivot = -0.7, ang = e * 1.15 + wob;
      for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI, x = -0.7 + 0.7 - 0.7 * Math.cos(a) * 1, y = 0.85 + 0.75 * Math.sin(a); sh.push([x, y]); }
      const leg = (x, y0, y1) => { const q = []; for (let i = 0; i <= 4; i++) q.push([x, lerp(y0, y1, i / 4)]); return q; };
      const shackle = [...leg(-0.7, 0.85 - 0.15, 0.85), ...sh.slice(1, -1).map((s, i, a) => [-0.7 + 0.7 * (1 - Math.cos(((i + 1) / 28) * Math.PI)), 0.85 + 0.75 * Math.sin(((i + 1) / 28) * Math.PI)]), ...leg(0.7, 0.85, 0.85 - 0.15 + 0.1 - lift * 0.0)];
      const pts = shackle.map(([x, y]) => { let px = x - pivot, py = y + lift; const c = Math.cos(ang * 0.8), s = Math.sin(ang * 0.8); const rz = px * s, rx2 = px * c; return [rx2 + pivot, py, rz]; }).map(w);
      for (let i = 0; i < pts.length - 1; i++) st.line(pts[i], pts[i + 1], [190, 205, 225], 1, 10);
      const face = (x, y, z = -0.51) => w([x, y, z]), kh = face(0, -0.1);
      st.dot(kh, 0.1, e > 0.5 ? PAL.cyan : [20, 30, 50], 1);
      const ringN = 28, pr = state === 'unlocking' ? (t * 1.8) % 1 : 0;
      for (let k = 0; k < 3; k++) { const rr = 0.28 + k * 0.17, a0 = e > 0.5 ? 1 : 0.35 + (state === 'unlocking' ? 0.5 : 0); const P = []; for (let i = 0; i <= ringN; i++) P.push(face(Math.cos((i / ringN) * TAU) * rr, -0.1 + Math.sin((i / ringN) * TAU) * rr)); for (let i = 0; i < ringN; i++) st.line(P[i], P[i + 1], PAL.cyan, a0 * (k === Math.floor(pr * 3) ? 1 : 0.5) * 0.7, 1.3); }
      st.flush();
    });
  },

  // ---- OmarLink: phone <-> Mac with packets in flight ----
  link(st) {
    const phone = Mesh.box(0.95, 1.9, 0.12), base = Mesh.box(3.3, 0.1, 2.1), lid = Mesh.box(3.3, 2.05, 0.1), kinds = ['Clipboard', 'Files', 'Screen', 'Notification'];
    let connected = true; const btn = $('#link-btn'), status = $('#link-status'); st.dist = 8;
    const upd = () => { if (btn) { btn.textContent = connected ? 'Disconnect' : 'Connect'; btn.setAttribute('aria-pressed', String(connected)); } if (status) status.textContent = connected ? 'Connected' : 'Disconnected'; st.wake(60); };
    btn?.addEventListener('click', () => { connected = !connected; upd(); }); upd();
    const P0 = [-2.3, -0.3, 0], P1 = [2.2, 0.55, 0], arc = (u) => [lerp(P0[0] + 0.6, P1[0] - 2.2, u), lerp(0.2, 0.8, u) + Math.sin(u * Math.PI) * 1.1, -0.2];
    st.run((t, dt) => {
      follow(st, dt, 0.5, 0.25); st.begin();
      const w = st.tf({ ry: 0.15 + st.u.y, rx: 0.12 + st.u.x });
      st.glow(w([0, 0, 0]), 5.5, PAL.blue, 0.14);
      const wp = st.tf({ ry: 0.35, tx: P0[0], ty: P0[1], tz: 0 }); const wpp = (p) => w(wp(p)); wpp.n = (v) => w.n(wp.n(v));
      st.mesh(phone, wpp, { base: [58, 76, 110], edge: PAL.cyan });
      st.poly([[-0.4, -0.85, -0.07], [0.4, -0.85, -0.07], [0.4, 0.8, -0.07], [-0.4, 0.8, -0.07]].map(wpp), css([8, 18, 36], 1), PAL.cyan, 1, 0.5);
      const wm = st.tf({ tx: P1[0] - 1.25, ty: -0.9, tz: 0.2, ry: -0.3 }); const wmm = (p) => w(wm(p)); wmm.n = (v) => w.n(wm.n(v));
      st.mesh(base, wmm, { base: [66, 84, 118], edge: PAL.cyan });
      const wl = st.tf({ tx: P1[0] - 1.25, ty: 0.15, tz: 1.0, ry: -0.3, rx: -0.12 }); const wll = (p) => w(wl(p)); wll.n = (v) => w.n(wl.n(v));
      st.mesh(lid, wll, { base: [58, 76, 110], edge: PAL.cyan });
      st.poly([[-1.55, -0.92, -0.06], [1.55, -0.92, -0.06], [1.55, 0.92, -0.06], [-1.55, 0.92, -0.06]].map(wll), css([8, 18, 36], 1), PAL.cyan, 1, 0.5);
      for (let i = 0; i < 32; i++) { const u = i / 32, a = w(arc(u)), b = w(arc(u + 1 / 32)); st.line(a, b, PAL.cyan, connected ? 0.28 : 0.08, 1.2); }
      if (connected) kinds.forEach((k, i) => { const dir = i % 2 ? -1 : 1, u0 = (t * 0.22 * st.amb + i / 4 + (st.amb ? 0 : i * 0.2)) % 1, u = dir > 0 ? u0 : 1 - u0, p = w(arc(u)); st.glowDot(p, 0.09, PAL.cyan, 0.95); st.text(k, [p[0], p[1] + 0.32 + (i % 2) * 0.28, p[2]], 0.19, PAL.text, 0.85 * Math.sin(u0 * Math.PI) + 0.1); });
      st.text(connected ? 'Connected' : 'Disconnected', w([0.1, -1.7, 0]), 0.2, connected ? PAL.cyan : PAL.steel, 0.9);
      st.flush();
    });
  },

  // ---- OmniDesk: floating windows and a dock ----
  desk(st) {
    const wins = [['Files', -1.9, 0.55, 0.0, -0.18], ['Notes', 0.4, 1.0, 0.5, 0.12], ['Tasks', 1.9, 0.1, 0.1, 0.2], ['Code', -0.3, -0.35, -0.3, -0.05]].map(([n, x, y, z, r], i) => ({ n, x, y, z, r, tz: z, i, P: null }));
    let top = 3; st.dist = 8;
    st.c.addEventListener('click', () => { const h = [...wins].filter((q) => q.P && inside(q.P, st.ptr.sx, st.ptr.sy)).sort((a, b) => a.P[0][2] - b.P[0][2])[0]; if (h) { top = h.i; wins.forEach((q) => (q.tz = q.i === top ? -0.9 : q.z * 0.6)); st.wake(60); } });
    st.run((t, dt) => {
      follow(st, dt, 0.5, 0.3); st.begin(); const A = st.amb;
      const w = st.tf({ ry: 0.1 + st.u.y, rx: 0.1 + st.u.x }), g = [];
      for (let i = -5; i <= 5; i++) { st.line(w([i * 0.7, -1.5, -2]), w([i * 0.7, -1.5, 3]), PAL.cyan, 0.1, 1); st.line(w([-3.5, -1.5, i * 0.5 + 0.5]), w([3.5, -1.5, i * 0.5 + 0.5]), PAL.cyan, 0.1, 1); }
      for (const q of wins) {
        q.z = lerp(q.z, q.tz, 1 - Math.exp(-dt * 6)); const bob = Math.sin(t * 0.9 + q.i * 1.7) * 0.07 * A, hw = 1.05, hh = 0.72, isTop = q.i === top;
        const m = st.tf({ tx: q.x, ty: q.y + bob, tz: q.z, ry: q.r }); const wm = (p) => w(m(p));
        const quad = [[-hw, -hh, 0], [hw, -hh, 0], [hw, hh, 0], [-hw, hh, 0]].map(wm);
        q.P = st.poly(quad, css([12, 24, 44], 0.94), PAL.cyan, isTop ? 1.8 : 1, isTop ? 0.95 : 0.5);
        st.poly([[-hw, hh - 0.2, 0.001], [hw, hh - 0.2, 0.001], [hw, hh, 0.001], [-hw, hh, 0.001]].map(wm), css(PAL.cyan, 0.16));
        [0, 1, 2].forEach((d) => st.dot(wm([-hw + 0.16 + d * 0.14, hh - 0.1, 0.002]), 0.035, PAL.cyan, 0.6));
        st.text(q.n, wm([0.1, hh - 0.1, 0.002]), 0.13, PAL.text, 0.9);
        for (let l = 0; l < 4; l++) st.line(wm([-hw + 0.2, hh - 0.5 - l * 0.22, 0.002]), wm([-hw + 0.5 + ((l * 37 + q.i * 13) % 100) / 100 * 1.2, hh - 0.5 - l * 0.22, 0.002]), PAL.steel, 0.55, 3);
      }
      const dock = [[-1.5, -1.25, -0.2], [1.5, -1.25, -0.2], [1.5, -1.5, -0.2], [-1.5, -1.5, -0.2]].map(w); st.poly(dock, css([20, 36, 62], 0.9), PAL.cyan, 1, 0.5);
      ['Files', 'Notes', 'Tasks', 'Code'].forEach((n, i) => { const p = w([-0.9 + i * 0.6, -1.37, -0.21]); st.poly([[-0.14, -0.1], [0.14, -0.1], [0.14, 0.12], [-0.14, 0.12]].map(([a, b]) => w([-0.9 + i * 0.6 + a, -1.37 + b + (top === i ? 0.05 : 0), -0.21])), css(PAL.cyan, top === i ? 0.7 : 0.25), PAL.cyan, 1, 0.8); });
      st.c.style.cursor = wins.some((q) => q.P && inside(q.P, st.ptr.sx, st.ptr.sy)) ? 'pointer' : 'grab'; st.flush();
    });
  },

  // ---- Day Frame: a frame around the day ----
  frame(st) {
    st.dist = 7.4;
    st.run((t, dt) => {
      follow(st, dt, 0.55, 0.35); st.begin(); const A = st.amb, now = new Date(), hr = now.getHours() + now.getMinutes() / 60;
      const w = st.tf({ ry: 0.2 + Math.sin(t * 0.4) * 0.12 * A + st.u.y, rx: -0.08 + st.u.x });
      const sky = st.g, C = st.cam(w([0, 0, 0.2])); const hw = 1.9, hh = 1.35;
      const Pq = [[-hw, -hh, 0.1], [hw, -hh, 0.1], [hw, hh, 0.1], [-hw, hh, 0.1]].map(w).map((p) => st.cam(p));
      const day = clamp(Math.sin(((hr - 6) / 24) * TAU) * 0.5 + 0.5, 0, 1);
      const grad = sky.createLinearGradient(0, Pq[3][1], 0, Pq[0][1]); grad.addColorStop(0, css(mix([8, 14, 32], [30, 92, 150], day), 1)); grad.addColorStop(1, css(mix([5, 10, 19], [90, 170, 210], day), 1));
      sky.beginPath(); Pq.forEach((p, i) => (i ? sky.lineTo(p[0], p[1]) : sky.moveTo(p[0], p[1]))); sky.closePath(); sky.fillStyle = grad; sky.fill();
      const sa = ((hr - 6) / 12) * Math.PI, sun = w([Math.cos(sa) * -1.3, Math.sin(sa) * 0.9 - 0.2, 0.05]);
      if (hr >= 6 && hr <= 18) st.glowDot(sun, 0.16, [255, 230, 160], 0.95); else { const ma = ((hr < 6 ? hr + 6 : hr - 18) / 12) * Math.PI; st.glowDot(w([Math.cos(ma) * -1.3, Math.sin(ma) * 0.9 - 0.2, 0.05]), 0.11, [210, 225, 255], 0.9); }
      const bars = [[[-hw - 0.2, -hh - 0.2], [hw + 0.2, -hh - 0.2], [hw, -hh], [-hw, -hh]], [[-hw - 0.2, hh + 0.2], [hw + 0.2, hh + 0.2], [hw, hh], [-hw, hh]], [[-hw - 0.2, -hh - 0.2], [-hw, -hh], [-hw, hh], [-hw - 0.2, hh + 0.2]], [[hw + 0.2, -hh - 0.2], [hw, -hh], [hw, hh], [hw + 0.2, hh + 0.2]]];
      for (const b of bars) { st.poly(b.map(([x, y]) => w([x, y, -0.15])), css([40, 58, 90], 1), PAL.cyan, 1, 0.7); st.poly(b.map(([x, y]) => w([x, y, 0.2])), css([22, 36, 62], 1), PAL.cyan, 1, 0.5); }
      for (let h = 0; h < 24; h++) { const a = (h / 24) * TAU - Math.PI / 2, cur = Math.floor(hr) === h, r0 = 2.55, r1 = cur ? 2.9 : 2.75; st.line(w([Math.cos(a) * r0 * 1.0, -Math.sin(a) * r0 * 0.78, 0]), w([Math.cos(a) * r1, -Math.sin(a) * r1 * 0.78, 0]), PAL.cyan, cur ? 1 : 0.45, cur ? 3 : 1.5); }
      st.text(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), w([0, -1.95, 0]), 0.24, PAL.text, 0.95);
      st.flush();
    });
  },

  // ---- Atlas-AI: layered network (an illustration, not Atlas-AI's architecture) ----
  atlas(st) {
    const layers = [3, 5, 5, 2], L = layers.map((n, i) => Array.from({ length: n }, (_, j) => [(i - 1.5) * 1.5, (j - (n - 1) / 2) * 0.7, Math.sin(i * 2 + j) * 0.4]));
    st.dist = 8;
    st.run((t, dt) => {
      follow(st, dt, 0.6, 0.3); st.begin(); const A = st.amb, w = st.tf({ ry: 0.4 + Math.sin(t * 0.3) * 0.15 * A + st.u.y, rx: 0.12 + st.u.x });
      for (let i = 0; i < L.length - 1; i++) for (const a of L[i]) for (const b of L[i + 1]) { const A1 = w(a), B1 = w(b); st.line(A1, B1, PAL.cyan, 0.13, 1); }
      let c = 0; for (let i = 0; i < L.length - 1; i++) for (const a of L[i]) for (const b of L[i + 1]) { c++; const u = (t * 0.4 * A + c * 0.137) % 1; if (c % 3 === 0) st.dot(w([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]), 0.04, PAL.cyan, 0.9 * Math.sin(u * Math.PI)); }
      L.forEach((l) => l.forEach((p) => st.glowDot(w(p), 0.09, PAL.cyan, 0.85)));
      st.flush();
    });
  },


  // ---- Interests: five interests orbiting a core; click a name to jump to its card ----
  interests(st) {
    const items = [['Tennis', 'tennis'], ['Swimming', 'swimming'], ['Building', 'building'], ['Games', 'games'], ['Maths', 'maths']], ico = Mesh.ico(); let hits = [], hover = null; st.dist = 8;
    const go = (id) => { const el = document.getElementById(id); if (!el) return; el.scrollIntoView({ behavior: motion.off ? 'auto' : 'smooth', block: 'center' }); setTimeout(() => el.querySelector('h3')?.focus({ preventScroll: true }), motion.off ? 0 : 450); };
    st.c.addEventListener('click', (e) => { const r = st.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, h = hits.filter((n) => Math.abs(n.x - x) < n.w && Math.abs(n.y - y) < 22).sort((a, b) => a.z - b.z)[0]; if (h) go(h.id); });
    st.run((t, dt) => {
      follow(st, dt, 0.4, 0.25); st.begin(); const A = st.amb;
      st.glow([0, 0, 0], 3, PAL.blue, 0.25); st.glow([0, 0, 0], 1.2, PAL.cyan, 0.3);
      const w = st.tf({ ry: t * 0.25 * A + st.u.y, rx: 0.3 + st.u.x, s: 0.8 }), V = ico.v.map(w);
      for (const [a, b] of ico.e) st.line(V[a], V[b], PAL.cyan, 0.55, 1.2);
      for (const p of V) st.glowDot(p, 0.04, PAL.cyan, 0.9);
      const wr = st.tf({ rx: 0.2, ry: st.u.y * 0.6 }), ring = circle(3.3, 64).map(wr); for (let k = 0; k < ring.length - 1; k++) st.line(ring[k], ring[k + 1], PAL.cyan, 0.2, 1);
      hits = []; let hv = null;
      items.forEach(([name, id], i) => {
        const a = (i / items.length) * TAU + t * 0.2 * A, p = wr([3.3 * Math.cos(a), 0, 3.3 * Math.sin(a)]), P = st.cam(p), isH = hover === id;
        st.line([0, 0, 0], p, PAL.cyan, 0.12, 1); st.glowDot(p, isH ? 0.14 : 0.1, PAL.cyan, 0.95);
        st.text(name, [p[0], p[1] - 0.38, p[2]], isH ? 0.3 : 0.26, PAL.text, isH ? 1 : 0.75 * st.fog(P[2], 0.6, 0.9) + 0.25);
        const h = { x: P[0], y: P[1] - 0.38 * P[3], w: 44 + name.length * 5, z: P[2], id }; hits.push(h);
        if (Math.abs(h.x - st.ptr.sx) < h.w && Math.abs(h.y - st.ptr.sy) < 22 && (!hv || h.z < hv.z)) hv = h;
      });
      hover = hv?.id || null; st.c.style.cursor = hv ? 'pointer' : st.ptr.down ? 'grabbing' : 'grab'; st.flush();
    });
  },

  // ---- 404: a broken portal that follows the cursor ----
  portal(st) {
    const segs = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * TAU, off: [0, 0, 0], v: [0, 0, 0], ph: Math.random() * TAU, home: 0 })); let mend = 0; st.dist = 7;
    st.c.addEventListener('click', () => { mend = 1; st.wake(120); });
    st.run((t, dt) => {
      follow(st, dt, 0.9, 0.7, 5); st.begin(); const A = st.amb; mend = Math.max(0, mend - dt * 0.35);
      const w = st.tf({ ry: st.u.y + st.ptr.x * 0.3 * A, rx: 0.2 + st.u.x }), R = 1.8;
      st.glow(w([0, 0, 0]), 3, PAL.blue, 0.2 + 0.1 * Math.sin(t * 2) * A);
      segs.forEach((s, i) => {
        const dis = (1 - ease(mend)) * (0.5 + 0.35 * Math.sin(t * 0.8 + s.ph) * A), a0 = s.a + dis * 0.25 * Math.sin(s.ph), a1 = s.a + (TAU / 14) * 0.78;
        const out = dis * (0.5 + 0.3 * Math.cos(s.ph * 3)), pts = [];
        for (let k = 0; k <= 6; k++) { const a = lerp(a0, a1, k / 6); pts.push(w([Math.cos(a) * (R + out), Math.sin(a) * (R + out), Math.sin(s.ph + k) * dis * 0.4])); }
        for (let k = 0; k < 6; k++) st.line(pts[k], pts[k + 1], PAL.cyan, 0.9, 5 - dis * 2);
      });
      for (let i = 0; i < 18; i++) { const a = i * 2.4 + t * 0.2 * A, r = 0.2 + ((i * 0.37 + t * 0.1 * A) % 1) * 1.4; st.dot(w([Math.cos(a) * r, Math.sin(a) * r, 0]), 0.03, PAL.cyan, 0.6 * (1 - r / 1.6)); }
      st.text('404', w([0, 0, 0]), 0.5, PAL.text, 0.9, 'center', 700);
      st.flush();
    });
  },

  // ---- Lab: 3D playground with lights, perspective, environments ----
  playground(st) {
    const meshes = { cube: Mesh.box(1.6, 1.6, 1.6), icosahedron: Mesh.ico(), torus: Mesh.torus(1, 0.38, 28, 14), sphere: Mesh.sphere(10, 18, 1.1) };
    const envs = { midnight: { base: [58, 108, 190], edge: PAL.cyan, bg: ['#0b1b34', '#050a13'] }, dawn: { base: [200, 120, 150], edge: [255, 200, 170], bg: ['#2a1634', '#0d0716'] }, forest: { base: [60, 150, 110], edge: [150, 235, 190], bg: ['#0c2a22', '#04100d'] }, mono: { base: [150, 160, 175], edge: [235, 240, 250], bg: ['#1b2230', '#0a0d13'] } };
    const q = (id) => $('#' + id); let rx = 0.5, ry = 0.7; st.dist = 6;
    $('#pg-reset')?.addEventListener('click', () => { st.u.x = st.u.y = st.u.vx = st.u.vy = 0; rx = 0.5; ry = 0.7; for (const [id, v] of [['pg-light', 45], ['pg-persp', 6], ['pg-obj', 'torus'], ['pg-env', 'midnight']]) q(id).value = v; q('pg-wire').checked = false; st.wake(40); });
    for (const el of document.querySelectorAll('#pg-controls input,#pg-controls select')) el.addEventListener('input', () => st.wake(40));
    st.run((t, dt) => {
      const env = envs[q('pg-env')?.value] || envs.midnight, la = ((+q('pg-light')?.value || 45) / 180) * Math.PI;
      st.dist = +q('pg-persp')?.value || 6; st.begin(); const g = st.g, gr = g.createRadialGradient(st.w / 2, st.h * 0.4, 0, st.w / 2, st.h / 2, st.w * 0.8); gr.addColorStop(0, env.bg[0]); gr.addColorStop(1, env.bg[1]); g.fillStyle = gr; g.fillRect(0, 0, st.w, st.h);
      ry += dt * 0.35 * st.amb; const w = st.tf({ ry: ry + st.u.y, rx: rx + st.u.x });
      const L = [Math.cos(la) * 1.2, 0.5 + Math.sin(la), -0.8], lp = [Math.cos(la) * 2.6, 0.7 + Math.sin(la) * 1.6, -2.2];
      st.glow(lp, 1.1, [255, 244, 210], 0.28); st.glowDot(lp, 0.07, [255, 244, 210], 0.9);
      st.mesh(meshes[q('pg-obj')?.value] || meshes.torus, w, { base: env.base, edge: env.edge, light: L, wire: !!q('pg-wire')?.checked });
      st.flush();
    });
  },
};

// ---- Site background: sparse depth layers + floor grid. Always subtle. ----
export function background(canvas) {
  const st = new Stage(canvas, { dist: 6, dpr: 1 }), N = st.lite ? 26 : 60, pts = Array.from({ length: N }, () => [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, Math.random() * 9 - 3]);
  st.run((t, dt) => {
    st.begin(); const A = st.amb, sc = scrollY * 0.0006; st.yaw += (st.ptr.x * 0.16 * A - st.yaw) * 0.04; st.pitch += (st.ptr.y * 0.08 * A - st.pitch) * 0.04;
    const w = st.tf({ ry: sc * A, ty: -sc * 2 * A });
    for (const p of pts) { const q = w([p[0], p[1], ((p[2] + t * 0.12 * A + 3) % 9) - 3]), P = st.cam(q); if (P[2] > 0.8) st.dot(q, 0.011, PAL.cyan, 0.5 * st.fog(P[2], 0.3, 1.8)); }
    for (let i = -8; i <= 8; i++) { const a = w([i * 1.1, -3.2, -2]), b = w([i * 1.1, -3.2, 10]); st.line(a, b, PAL.blue, 0.07, 1); }
    for (let k = 0; k < 8; k++) { const z = ((k + t * 0.1 * A) % 8) * 1.3 - 1; st.line(w([-9, -3.2, z]), w([9, -3.2, z]), PAL.blue, 0.06, 1); }
    st.flush();
  });
}

const FOV = { hero: 0.92, globe: 2.5, lock: 1.65, link: 1.08, desk: 1.15, frame: 1.2, atlas: 1.15, portal: 1.7, playground: 2.0, interests: 1.75 };
export function mountScenes() {
  for (const c of document.querySelectorAll('canvas[data-scene]')) {
    const f = scenes[c.dataset.scene]; if (!f) continue;
    try { f(new Stage(c, { dist: 7, fov: FOV[c.dataset.scene] || 1 })); c.dataset.ready = '1'; } catch (e) { c.dataset.failed = '1'; console.error(e); }
  }
}
