// Arcade: five playable games. Scores live only in this browser (localStorage key "oh:v1").
import { $, $$, store, announce, rnd, pick, shuffle, siteData } from './util.js';
import { motion } from './gfx.js';

const h = (tag, a = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } e.append(...kids.flat().filter((x) => x != null && x !== false)); return e; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const stats = (labels) => { const o = {}, el = h('dl', { class: 'stat-row' }, labels.map((l) => h('div', {}, h('dt', {}, l), (o[l] = h('dd', {}, '—'))))); return { el, set: (l, v) => { o[l].textContent = v; } }; };
const save = (g, fn) => { store.set((d) => { d[g] = d[g] || {}; fn(d[g]); }); refresh(); };
const best = (g, v, low = false) => { let nb = false; save(g, (d) => { d.plays = (d.plays || 0) + 1; if (d.best == null || (low ? v < d.best : v > d.best)) { d.best = v; nb = true; } }); return nb; };

function refresh() {
  const d = store.get(), f = (g, fmt = (v) => v) => (d[g]?.best != null ? fmt(d[g].best) : '—');
  const set = (k, v) => $$(`[data-best="${k}"]`).forEach((e) => { e.textContent = v; });
  set('reaction', f('reaction', (v) => v + ' ms')); set('target', f('target')); set('memory', f('memory')); set('avoid', f('avoid')); set('logic', f('logic'));
  const t = d.reaction?.times || []; set('reaction-avg', t.length ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) + ' ms' : '—');
}

// ---------------- 1. Reaction test ----------------
function reaction(root) {
  const big = h('span', { class: 'pad-big' }, 'Start'), sub = h('span', { class: 'pad-sub' }, 'Press, tap or hit Space. Then wait for the bright signal.');
  const pad = h('button', { type: 'button', class: 'rx-pad', 'data-state': 'idle' }, big, sub), S = stats(['Last', 'Best', 'Average (last 10)', 'Tries']);
  let state = 'idle', t0 = 0, timer = 0, skip = false;
  const show = () => { const d = store.get().reaction || {}, t = d.times || []; S.set('Best', d.best != null ? d.best + ' ms' : '—'); S.set('Average (last 10)', t.length ? Math.round(t.reduce((a, b) => a + b, 0) / t.length) + ' ms' : '—'); S.set('Tries', String(d.plays || 0)); };
  const set = (s, a, b) => { state = s; pad.dataset.state = s; big.textContent = a; sub.textContent = b; };
  const start = () => { set('wait', 'Wait…', 'Press as soon as the pad turns bright.'); announce('Wait for the signal.'); timer = setTimeout(() => { set('go', 'Now!', 'Press!'); t0 = performance.now(); }, rnd(1300, 4200)); };
  const act = () => {
    if (state === 'wait') { clearTimeout(timer); set('early', 'Too early', 'Wait for the bright signal. Press to try again.'); announce('Too early.'); }
    else if (state === 'go') { const ms = Math.round(performance.now() - t0); const nb = best('reaction', ms, true); save('reaction', (d) => { d.times = [...(d.times || []), ms].slice(-10); }); S.set('Last', ms + ' ms'); show(); set('result', ms + ' ms', (nb ? 'New personal best. ' : '') + 'Press to go again.'); announce(`${ms} milliseconds.${nb ? ' New personal best.' : ''}`); }
    else start();
  };
  pad.addEventListener('pointerdown', (e) => { if (e.button > 0) return; skip = true; act(); });
  pad.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); skip = true; act(); } });
  pad.addEventListener('keyup', (e) => { if (e.key === ' ') e.preventDefault(); });
  pad.addEventListener('click', () => { if (skip) { skip = false; return; } act(); });
  const reset = h('button', { type: 'button', class: 'btn', onclick: () => { clearTimeout(timer); save('reaction', (d) => { delete d.best; delete d.times; delete d.plays; }); S.set('Last', '—'); show(); set('idle', 'Start', 'Scores for this game cleared.'); announce('Reaction scores cleared.'); } }, 'Reset reaction scores');
  root.append(pad, S.el, h('div', { class: 'actions' }, reset)); show();
  return () => clearTimeout(timer);
}

// ---------------- 2. Target hunt ----------------
function target(root) {
  const area = h('div', { class: 'th-area', tabindex: '0', role: 'group', 'aria-label': 'Play area. Press Space or Enter to hit the current target.' });
  const msg = h('p', { class: 'th-msg' }, 'Hit each target before it fades. Combos multiply your points.');
  const startBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Start');
  const over = h('div', { class: 'th-over' }, msg, startBtn); area.append(over);
  const S = stats(['Score', 'Time', 'Combo', 'Level']);
  let run = false, score = 0, left = 30, combo = 0, hits = 0, miss = 0, cur = null, life, spawnT = 0, tick = 0;
  const hud = () => { S.set('Score', score); S.set('Time', Math.ceil(left) + ' s'); S.set('Combo', 'x' + (1 + Math.floor(combo / 5))); S.set('Level', 1 + Math.floor(hits / 5)); };
  const clear = () => { cur?.remove(); cur = null; clearTimeout(life); };
  const hit = () => { if (!cur || !run) return; score += 10 * (1 + Math.floor(combo / 5)); combo++; hits++; clear(); hud(); spawnT = setTimeout(spawn, 90); };
  const lose = () => { if (!cur) return; combo = 0; miss++; clear(); hud(); spawnT = setTimeout(spawn, 90); };
  const spawn = () => {
    if (!run) return; const lvl = 1 + Math.floor(hits / 5), size = clamp(84 - lvl * 4, 46, 84), r = area.getBoundingClientRect(), pad = 6;
    const b = h('button', { type: 'button', class: 'th-target', 'aria-label': 'Target', tabindex: '-1' }); b.style.width = b.style.height = size + 'px';
    b.style.left = rnd(pad, Math.max(pad + 1, r.width - size - pad)) + 'px'; b.style.top = rnd(pad, Math.max(pad + 1, r.height - size - pad)) + 'px';
    const ms = clamp(1500 - lvl * 90, 650, 1500); b.style.animationDuration = ms + 'ms';
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hit(); }); b.addEventListener('click', (e) => { if (e.detail === 0) hit(); });
    area.append(b); cur = b; life = setTimeout(lose, ms);
  };
  const end = () => { run = false; clear(); clearInterval(tick); clearTimeout(spawnT); const nb = best('target', score), acc = hits + miss ? Math.round((hits / (hits + miss)) * 100) : 0; msg.textContent = `Time. Score ${score}, ${hits} hits, ${acc}% accuracy.${nb ? ' New personal best.' : ''}`; startBtn.textContent = 'Play again'; over.hidden = false; announce(msg.textContent); startBtn.focus(); };
  const go = () => {
    over.hidden = true; score = 0; left = 30; combo = 0; hits = 0; miss = 0; hud(); let c = 3; const big = h('div', { class: 'th-count', 'aria-hidden': 'true' }, '3'); area.append(big); announce('Get ready.'); area.focus();
    const cd = setInterval(() => { c--; if (c > 0) big.textContent = c; else { clearInterval(cd); big.remove(); run = true; spawn(); tick = setInterval(() => { left -= 0.1; hud(); if (left <= 0) end(); }, 100); } }, 700);
    cleanup = () => { clearInterval(cd); clearInterval(tick); clearTimeout(life); clearTimeout(spawnT); run = false; };
  };
  let cleanup = () => {};
  startBtn.addEventListener('click', go);
  area.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target === area) { e.preventDefault(); hit(); } });
  area.addEventListener('pointerdown', (e) => { if (run && e.target === area) { combo = 0; miss++; hud(); } });
  root.append(S.el, area, h('p', { class: 'hint' }, 'Keyboard: with the play area focused, press Space or Enter to hit the current target.')); hud();
  return () => cleanup();
}

// ---------------- 3. Memory grid ----------------
function memory(root) {
  const grid = h('div', { class: 'mg-grid', role: 'group', 'aria-label': 'Memory grid' }), status = h('p', { class: 'mg-status', 'aria-live': 'polite' }, 'Watch the pattern, then repeat it.');
  const S = stats(['Level', 'Score', 'Mistakes left']); const startBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Start');
  let n = 3, cells = [], seq = [], pos = 0, level = 1, score = 0, lives = 3, phase = 'idle', timers = [];
  const hud = () => { S.set('Level', level); S.set('Score', score); S.set('Mistakes left', lives); };
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const build = () => { grid.textContent = ''; grid.dataset.n = n; cells = Array.from({ length: n * n }, (_, i) => { const b = h('button', { type: 'button', class: 'mg-cell', 'aria-label': `Row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}` }); b.addEventListener('click', () => press(i)); grid.append(b); return b; }); };
  const flash = (i, ms) => { cells[i].classList.add('lit'); later(() => cells[i].classList.remove('lit'), ms); };
  const show = () => {
    phase = 'show'; pos = 0; status.textContent = `Level ${level}. Watch the pattern.`; const gap = clamp(620 - level * 22, 280, 620);
    seq.forEach((c, k) => { later(() => { flash(c, gap * 0.7); status.textContent = `Watch: row ${Math.floor(c / n) + 1}, column ${(c % n) + 1}`; }, 700 + k * gap); });
    later(() => { phase = 'input'; status.textContent = `Your turn. Repeat ${seq.length} cells.`; }, 700 + seq.length * gap);
  };
  const next = () => { const want = level >= 6 ? 4 : 3; if (want !== n) { n = want; build(); } seq = Array.from({ length: 2 + level }, () => Math.floor(Math.random() * n * n)); show(); };
  const press = (i) => {
    if (phase !== 'input') return; flash(i, 160);
    if (i === seq[pos]) { pos++; if (pos === seq.length) { score += level * 10; level++; phase = 'wait'; hud(); status.textContent = 'Correct. Next level…'; later(next, 900); } }
    else { lives--; hud(); cells[i].classList.add('bad'); later(() => cells[i].classList.remove('bad'), 350);
      if (lives <= 0) { phase = 'over'; const nb = best('memory', score); status.textContent = `Game over. Score ${score}, reached level ${level}.${nb ? ' New personal best.' : ''}`; startBtn.textContent = 'Play again'; startBtn.hidden = false; announce(status.textContent); }
      else { phase = 'wait'; status.textContent = `Wrong cell. ${lives} mistake${lives > 1 ? 's' : ''} left. Watch again.`; later(show, 1100); } }
  };
  startBtn.addEventListener('click', () => { timers.forEach(clearTimeout); n = 3; build(); level = 1; score = 0; lives = 3; hud(); startBtn.hidden = true; next(); });
  root.append(S.el, status, grid, h('div', { class: 'actions' }, startBtn)); build(); hud();
  return () => timers.forEach(clearTimeout);
}

// ---------------- 4. Avoid (pseudo-3D runner) ----------------
function avoid(root) {
  const W = 800, H = 520, cv = h('canvas', { width: W, height: H, class: 'av-canvas', role: 'img', 'aria-label': 'Avoid game board. Dodge the blocks coming toward you. Move with the arrow keys, A and D, the buttons below, or by dragging.' }), g = cv.getContext('2d');
  const msg = h('p', { class: 'th-msg' }, 'Dodge the blocks. They get faster.'), startBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Start'), over = h('div', { class: 'th-over' }, msg, startBtn);
  const S = stats(['Score', 'Best']); const keys = { l: false, r: false };
  const mk = (label, k) => { const b = h('button', { type: 'button', class: 'btn av-btn', 'aria-label': label }, label); const on = (v) => (e) => { e.preventDefault(); keys[k] = v; }; b.addEventListener('pointerdown', on(true)); b.addEventListener('pointerup', on(false)); b.addEventListener('pointerleave', on(false)); b.addEventListener('pointercancel', on(false)); b.addEventListener('contextmenu', (e) => e.preventDefault()); return b; };
  const wrap = h('div', { class: 'av-wrap' }, cv, over); const pad = h('div', { class: 'av-pad' }, mk('Left', 'l'), mk('Right', 'r'));
  let mode = 'ready', px = 0, tx = null, obs = [], t = 0, spawn = 0, off = 0, raf = 0, last = 0, vis = true, shake = 0;
  const hor = H * 0.34, floor = H * 0.9;
  const P = (x, d) => { const sc = 1 / (1 + d * 9), n = (sc - 0.1) / 0.9; return { x: W / 2 + x * W * 0.44 * sc, y: hor + (floor - hor) * n, s: sc }; };
  const showBest = () => S.set('Best', store.get().avoid?.best ?? '—');
  const begin = () => { obs = []; t = 0; spawn = 0.4; px = 0; tx = null; mode = 'run'; over.hidden = true; last = performance.now(); announce('Go.'); loop(); wrap.focus?.(); };
  const finish = () => { mode = 'over'; const sc = Math.floor(t * 10), nb = best('avoid', sc); shake = 0.3; msg.textContent = `Hit. You survived ${t.toFixed(1)} seconds. Score ${sc}.${nb ? ' New personal best.' : ''}`; startBtn.textContent = 'Play again'; over.hidden = false; announce(msg.textContent); showBest(); draw(); startBtn.focus(); };
  const pause = (p) => { if (mode === 'run' && p) { mode = 'pause'; msg.textContent = 'Paused.'; startBtn.textContent = 'Resume'; over.hidden = false; } else if (mode === 'pause' && !p) { mode = 'run'; over.hidden = true; last = performance.now(); loop(); } };
  startBtn.addEventListener('click', () => (mode === 'pause' ? pause(false) : begin()));
  const step = (dt) => {
    t += dt; const lvl = t, sp = Math.min(1.15, 0.38 + lvl * 0.012);
    const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); if (dir) { px += dir * 2.0 * dt; tx = null; } else if (tx != null) px += (tx - px) * Math.min(1, dt * 12); px = clamp(px, -0.95, 0.95);
    spawn -= dt; if (spawn <= 0) { spawn = Math.max(0.3, 0.85 - lvl * 0.012); const w = rnd(0.1, 0.21);
      if (lvl > 12 && Math.random() < 0.3) { const gx = rnd(-0.6, 0.6), gap = 0.34; obs.push({ x: (-1 + gx - gap) / 2, w: (gx - gap + 1) / 2, d: 1 }, { x: (1 + gx + gap) / 2, w: (1 - gx - gap) / 2, d: 1 }); } else obs.push({ x: rnd(-0.85, 0.85), w, d: 1 }); }
    for (const o of obs) { o.d -= sp * dt; if (o.d < 0.09 && o.d > -0.02 && Math.abs(o.x - px) < o.w + 0.07) { finish(); return; } }
    obs = obs.filter((o) => o.d > -0.06); off = (off + sp * dt * 1.2) % 1;
  };
  const draw = () => {
    g.save(); if (shake > 0 && !motion.off) g.translate(rnd(-5, 5) * shake * 3, rnd(-5, 5) * shake * 3); g.clearRect(-10, -10, W + 20, H + 20);
    const sky = g.createLinearGradient(0, 0, 0, hor); sky.addColorStop(0, '#050a13'); sky.addColorStop(1, '#10284a'); g.fillStyle = sky; g.fillRect(0, 0, W, hor + 1);
    const glow = g.createRadialGradient(W / 2, hor, 0, W / 2, hor, W * 0.5); glow.addColorStop(0, 'rgba(82,217,234,.35)'); glow.addColorStop(1, 'rgba(82,217,234,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, hor + 2);
    g.fillStyle = '#08111f'; g.fillRect(0, hor, W, H - hor);
    const a = P(-1, 1), b = P(1, 1), c = P(1, 0), d = P(-1, 0); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath(); g.fillStyle = '#0c1a30'; g.fill(); g.strokeStyle = 'rgba(82,217,234,.6)'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(82,217,234,.16)'; g.lineWidth = 1; for (let k = 0; k < 12; k++) { const dd = ((k + off) / 12) ** 1.5, l = P(-1, dd), r = P(1, dd); g.beginPath(); g.moveTo(l.x, l.y); g.lineTo(r.x, r.y); g.stroke(); }
    for (const x of [-0.33, 0.33]) for (let k = 0; k < 10; k++) { const d0 = (k + off) / 10, d1 = d0 + 0.045; if (d1 > 1) continue; const p0 = P(x, d0), p1 = P(x, d1); g.strokeStyle = 'rgba(232,238,247,.3)'; g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); }
    for (const o of [...obs].sort((p, q) => q.d - p.d)) { const p = P(o.x, Math.max(0, o.d)), w = o.w * W * 0.44 * p.s * 2, hh = Math.max(6, w * 0.55);
      g.fillStyle = 'rgba(30,60,110,.95)'; g.fillRect(p.x - w / 2, p.y - hh, w, hh); g.fillStyle = 'rgba(82,217,234,.35)'; g.fillRect(p.x - w / 2, p.y - hh, w, hh * 0.22); g.strokeStyle = '#52d9ea'; g.lineWidth = 1.5; g.strokeRect(p.x - w / 2, p.y - hh, w, hh); }
    const p = P(px, 0.02), s = 22; g.fillStyle = 'rgba(82,217,234,.25)'; g.beginPath(); g.ellipse(p.x, p.y + 4, s * 1.5, s * 0.4, 0, 0, 7); g.fill();
    g.fillStyle = '#52d9ea'; g.beginPath(); g.moveTo(p.x, p.y - s * 1.3); g.lineTo(p.x + s, p.y + 2); g.lineTo(p.x, p.y - s * 0.3); g.lineTo(p.x - s, p.y + 2); g.closePath(); g.fill(); g.strokeStyle = '#e8eef7'; g.lineWidth = 1.5; g.stroke();
    g.restore(); S.set('Score', Math.floor(t * 10));
  };
  const loop = () => { cancelAnimationFrame(raf); const f = (now) => { if (mode !== 'run') return; const dt = Math.min(0.05, (now - last) / 1000); last = now; shake = Math.max(0, shake - dt); step(dt); if (mode === 'run') { draw(); raf = requestAnimationFrame(f); } }; raf = requestAnimationFrame(f); };
  const kd = (e) => { if (mode === 'ready' || !root.isConnected) return; const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') { keys.l = true; if (mode === 'run') e.preventDefault(); } else if (k === 'arrowright' || k === 'd') { keys.r = true; if (mode === 'run') e.preventDefault(); } else if ((k === 'escape' || k === 'p') && (mode === 'run' || mode === 'pause') && !e.target.closest?.('dialog')) pause(mode === 'run'); };
  const ku = (e) => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') keys.l = false; else if (k === 'arrowright' || k === 'd') keys.r = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku); const bl = () => pause(true); addEventListener('blur', bl);
  const mv = (e) => { if (mode !== 'run' || (e.pointerType === 'mouse' && e.buttons === 0 && false)) return; const r = cv.getBoundingClientRect(); tx = clamp(((e.clientX - r.left) / r.width * 2 - 1) / 0.9, -0.95, 0.95); };
  cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' ? e.buttons === 1 : true) mv(e); }); cv.addEventListener('pointerdown', (e) => { mv(e); cv.setPointerCapture?.(e.pointerId); });
  cv.style.touchAction = 'none';
  const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (!vis) pause(true); }); io.observe(cv);
  root.append(S.el, wrap, pad, h('p', { class: 'hint' }, 'Move: arrow keys or A and D, the Left and Right buttons, or drag on the board. Esc or P pauses.')); showBest(); draw();
  return () => { mode = 'ready'; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('blur', bl); io.disconnect(); };
}

// ---------------- 5. Logic challenge (generated locally) ----------------
const gens = [
  () => { const a = Math.floor(rnd(2, 20)), d = Math.floor(rnd(2, 9)), s = [0, 1, 2, 3].map((i) => a + d * i); return { q: `${s.join(', ')}, ?`, a: String(a + d * 4), w: [a + d * 4 + d, a + d * 4 - 1, a + d * 5 + 1] }; },
  () => { const a = Math.floor(rnd(1, 5)), r = pick([2, 3]), s = [0, 1, 2, 3].map((i) => a * r ** i), n = a * r ** 4; return { q: `${s.join(', ')}, ?`, a: String(n), w: [n + a, n - r, n * 2] }; },
  () => { const a = Math.floor(rnd(1, 9)), s = [0, 1, 2, 3].map((i) => a + (i * (i + 1)) / 2), n = a + 10; return { q: `${s.join(', ')}, ?`, a: String(n), w: [n + 1, n - 1, n + 3] }; },
  () => { const a = Math.floor(rnd(1, 6)), b = Math.floor(rnd(2, 8)), s = [a, b, a + b, a + 2 * b, 2 * a + 3 * b], n = 3 * a + 5 * b; return { q: `${s.join(', ')}, ?`, a: String(n), w: [n + 2, n - 3, n + a] }; },
  () => { const a = Math.floor(rnd(3, 12)), b = Math.floor(rnd(3, 12)), op = pick(['×', '+']); return op === '×' ? { q: `${a} × ? = ${a * b}`, a: String(b), w: [b + 1, b - 1, b + 2] } : { q: `${a} + ? = ${a + b}`, a: String(b), w: [b + 1, b - 2, b + 3] }; },
  () => { const st = Math.floor(rnd(1, 4)), s0 = Math.floor(rnd(0, 8)), L = (i) => String.fromCharCode(65 + s0 + st * i), n = L(4); return { q: `${[0, 1, 2, 3].map(L).join(', ')}, ?`, a: n, w: [L(5), L(3) + '', String.fromCharCode(n.charCodeAt(0) - 1)] }; },
  () => { const valid = Math.random() < 0.5; return valid ? { q: 'All bloops are razzies. All razzies are lazzies. Must all bloops be lazzies?', a: 'Yes', w: ['No', 'Only some'] } : { q: 'Some bloops are razzies. Some razzies are lazzies. Must some bloops be lazzies?', a: 'No', w: ['Yes', 'All of them'] }; },
  () => { const v = shuffle([7, 12, 31, 18, 25, 40, 9, 36]).slice(0, 4), big = Math.max(...v); return { q: `Which is the largest: ${v.join(', ')}?`, a: String(big), w: v.filter((x) => x !== big).map(String) }; },
  () => { const a = Math.floor(rnd(2, 9)), b = Math.floor(rnd(2, 9)), c = Math.floor(rnd(2, 9)), r = a * b + c; return { q: `${a} × ${b} + ${c} = ?`, a: String(r), w: [r + b, r - c, a + b * c] }; },
];
function logic(root) {
  const TOTAL = 10, LIM = 12; const S = stats(['Question', 'Score', 'Streak']), q = h('p', { class: 'lg-q', 'aria-live': 'polite' }, 'Ten quick questions: sequences, arithmetic, patterns and logic. 12 seconds each.'), opts = h('div', { class: 'lg-opts' }), bar = h('div', { class: 'lg-bar', 'aria-hidden': 'true' }, h('span', {})), fb = h('p', { class: 'lg-fb', 'aria-live': 'polite' }), startBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Start');
  let i = 0, score = 0, streak = 0, cur = null, t0 = 0, raf = 0, locked = true;
  const hud = () => { S.set('Question', `${Math.min(i + 1, TOTAL)} of ${TOTAL}`); S.set('Score', score); S.set('Streak', streak); };
  const ask = () => {
    if (i >= TOTAL) { const nb = best('logic', score); q.textContent = `Done. Score ${score} out of a possible ${TOTAL * 160}.${nb ? ' New personal best.' : ''}`; opts.textContent = ''; fb.textContent = ''; startBtn.textContent = 'Play again'; startBtn.hidden = false; bar.firstChild.style.width = '0%'; announce(q.textContent); return; }
    const g = pick(gens)(), all = shuffle([g.a, ...[...new Set(g.w.map(String))].filter((x) => x !== g.a).slice(0, 3)]); cur = g; q.textContent = g.q; fb.textContent = ''; opts.textContent = ''; locked = false; t0 = performance.now(); hud();
    all.forEach((o, k) => opts.append(h('button', { type: 'button', class: 'btn lg-opt', 'data-k': k + 1, onclick: () => pickAns(o, g) }, h('span', { class: 'lg-key', 'aria-hidden': 'true' }, k + 1), o)));
    cancelAnimationFrame(raf); const f = () => { const el = (performance.now() - t0) / 1000; bar.firstChild.style.width = clamp(100 - (el / LIM) * 100, 0, 100) + '%'; if (el >= LIM && !locked) { pickAns(null, g); return; } if (!locked) raf = requestAnimationFrame(f); }; f();
  };
  const pickAns = (o, g) => {
    if (locked) return; locked = true; cancelAnimationFrame(raf); const el = (performance.now() - t0) / 1000, ok = o === g.a;
    if (ok) { const pts = 100 + Math.round(Math.max(0, LIM - el) * 5) + Math.min(streak, 3) * 10; score += pts; streak++; fb.textContent = `Correct. +${pts}`; } else { streak = 0; fb.textContent = o == null ? `Time. The answer was ${g.a}.` : `Not quite. The answer was ${g.a}.`; }
    opts.querySelectorAll('button').forEach((b) => { b.disabled = true; if (b.textContent.slice(1) === g.a) b.classList.add('ok'); }); i++; hud(); announce(fb.textContent); setTimeout(ask, 1100);
  };
  startBtn.addEventListener('click', () => { i = 0; score = 0; streak = 0; startBtn.hidden = true; ask(); });
  const kd = (e) => { if (locked || !root.isConnected || e.ctrlKey || e.metaKey) return; const b = opts.querySelector(`[data-k="${e.key}"]`); if (b) b.click(); }; addEventListener('keydown', kd);
  root.append(S.el, bar, q, opts, fb, h('div', { class: 'actions' }, startBtn), h('p', { class: 'hint' }, 'Tap an answer or press 1 to 4.')); hud();
  return () => { cancelAnimationFrame(raf); locked = true; removeEventListener('keydown', kd); };
}


// ---------------- Existing Omar games (hosted elsewhere): detail dialog, then launch in a new tab ----------------
const EXT_ICON = '<svg class="ext" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11l6-6M6 5h5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function externalGames() {
  const list = siteData().extGames || [], byId = Object.fromEntries(list.map((g) => [g.id, g])); let dlg = null, opener = null;
  const build = () => {
    dlg = h('dialog', { class: 'gdlg', 'aria-labelledby': 'gdlg-title' }); document.body.append(dlg);
    dlg.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  };
  const open = (id, from) => {
    const g = byId[id]; if (!g) return; if (!dlg) build(); opener = from; dlg.textContent = '';
    const src = document.querySelector(`[data-ext-game="${id}"] .card-art`), art = h('div', { class: 'gdlg-art', 'aria-hidden': 'true' }); if (src) art.innerHTML = src.innerHTML;
    const link = h('a', { class: 'btn btn-primary', href: g.url, target: '_blank', rel: 'noopener noreferrer' }, `Play ${g.name}`); link.insertAdjacentHTML('beforeend', EXT_ICON); link.append(h('span', { class: 'sr-only' }, ' (opens in a new tab)'));
    const close = h('button', { type: 'button', class: 'btn gdlg-x', onclick: () => dlg.close() }, 'Close', h('span', { class: 'sr-only' }, ` ${g.name} details`));
    dlg.append(h('div', { class: 'gdlg-box' }, close, art, h('span', { class: 'chip' }, g.category), h('h2', { id: 'gdlg-title' }, g.name), h('p', { class: 'gdlg-sum' }, g.summary),
      h('h3', {}, 'What its page shows'), h('ul', { class: 'gdlg-list' }, g.shows.map((x) => h('li', {}, x))),
      h('p', { class: 'ext-note' }, `Its page title is “${g.siteTitle}”. Playing opens ${g.host} in a new tab. It is the original project on its own website, not hosted on this site.`),
      h('div', { class: 'actions' }, link)));
    dlg.showModal(); announce(`${g.name} details opened.`);
  };
  for (const card of $$('[data-ext-game]')) {
    const btn = $('.details', card), id = card.dataset.extGame; btn?.addEventListener('click', () => open(id, btn));
    card.addEventListener('click', (e) => { if (!e.target.closest('a,button')) open(id, btn); });
  }
}

// ---------------- Hub ----------------
const GAME = { reaction, target, memory, avoid, logic };
const TITLES = { reaction: 'Reaction test', target: 'Target hunt', memory: 'Memory grid', avoid: 'Avoid', logic: 'Logic challenge' };
const HOW = { reaction: 'Press when the pad turns bright. Too early and it counts as a false start.', target: 'Thirty seconds. Hit each target before it fades. Targets shrink and speed up.', memory: 'Watch the pattern, repeat it. Three mistakes ends the run.', avoid: 'Steer left and right and dodge the blocks. It speeds up the longer you last.', logic: 'Ten generated questions. Faster answers and streaks score more.' };
export function init() {
  refresh(); externalGames(); const cards = $$('[data-game]'), host = $('#game-stage'); let cleanup = null, cur = null;
  const open = (g, focus = true) => {
    if (!GAME[g]) return; cleanup?.(); host.textContent = ''; cur = g;
    const hd = h('h2', { tabindex: '-1', id: 'game-title' }, TITLES[g]); host.append(hd, h('p', { class: 'game-how' }, HOW[g])); const box = h('div', { class: 'game-box' }); host.append(box); host.hidden = false;
    cleanup = GAME[g](box); cards.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.game === g))); history.replaceState(null, '', '#' + g);
    if (focus) { host.scrollIntoView({ behavior: motion.off ? 'auto' : 'smooth', block: 'start' }); hd.focus({ preventScroll: true }); }
  };
  cards.forEach((c) => c.addEventListener('click', () => open(c.dataset.game)));
  const rb = $('#reset-scores'); let armed = 0;
  rb?.addEventListener('click', () => { if (!armed) { rb.textContent = 'Press again to confirm'; armed = setTimeout(() => { armed = 0; rb.textContent = 'Reset scores'; }, 5000); return; } clearTimeout(armed); armed = 0; store.set((d) => { for (const k of Object.keys(GAME)) delete d[k]; }); rb.textContent = 'Reset scores'; refresh(); announce('All arcade scores cleared from this browser.'); if (cur) open(cur, false); });
  const hash = location.hash.slice(1); if (GAME[hash]) open(hash, false);
}
