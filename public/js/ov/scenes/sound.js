// The soundtrack. Sound is OFF until you switch it on. Everything you hear is original and synthesised live.
import { h, TAU, rgb, loop, fit, COL } from '../kit.js';
const L = [['keys', 'Keys'], ['bass', 'Bass'], ['pulse', 'Pulse'], ['sparkle', 'Sparkle']];
export function mount(root, api) {
  root.classList.add('sc-sound');
  const cv = h('canvas', { class: 'sn-cv', 'aria-hidden': 'true' });
  const state = { keys: true, bass: false, pulse: false, sparkle: true };
  const note = h('p', { class: 'sn-note', 'aria-live': 'polite' });
  const mixer = h('div', { class: 'sn-mix', role: 'group', 'aria-label': 'Sound layers' }, L.map(([k, n], i) => h('button', { type: 'button', class: 'sn-l', 'data-k': k, 'data-c': i % 2 ? 'p' : 'o', 'aria-pressed': String(state[k]) }, h('i'), n)));
  const vinyl = h('button', { type: 'button', class: 'sn-center', 'aria-label': 'The middle of the record' });
  const on = h('button', { type: 'button', class: 'btn btn-primary sn-on' }, 'Turn sound on');
  const copy = h('div', { class: 'ov-copy ov-copy-top' }, h('p', { class: 'cp-big' }, 'Music, ', h('em', {}, 'almost everywhere.')), h('p', {}, 'Arabic, English, whatever sounds good.'), h('p', { class: 'cp-note' }, 'Production and atmosphere first. Lyrics close behind.'), note);
  root.append(cv, vinyl, copy, h('div', { class: 'sn-ctl' }, mixer, on));
  const A = () => api.audio(), isOn = () => !!A()?.isOn();
  const sync = () => { on.hidden = isOn(); note.textContent = isOn() ? 'Original, made live in your browser. Mix the layers.' : 'Sound is off by default. Your call. The picture still moves.'; mixer.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.k]))); L.forEach(([k]) => A()?.layer(k, state[k])); };
  mixer.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k; state[k] = !state[k]; A()?.layer(k, state[k]); b.setAttribute('aria-pressed', String(state[k])); api.sfx('ping', L.findIndex(([x]) => x === k) * 3); if (L.every(([x]) => state[x])) api.say('Full band.'); });
  on.addEventListener('click', async () => { await api.setSound(true); sync(); }); addEventListener('ov:sound', sync);
  vinyl.addEventListener('click', () => api.secret('record', 'Side B. It’s the same record, just louder.'));
  const s = fit(cv, 1.5); let phase = 0;
  const draw = (dt, t) => {
    const g = s.g, W = s.w, H = s.h, cx = W / 2, cy = H * 0.46, R = Math.min(W, H) * 0.24, lvl = A()?.level?.() || 0, act = L.filter(([k]) => state[k]).length / 4, amp = isOn() ? 0.04 + lvl * 0.5 : 0.03 + act * 0.05;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; phase += dt * (0.4 + act * 1.2);
    const gg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 3); gg.addColorStop(0, rgb(COL.pk, 0.22)); gg.addColorStop(0.5, rgb(COL.or, 0.08)); gg.addColorStop(1, rgb(COL.or, 0)); g.fillStyle = gg; g.fillRect(0, 0, W, H);
    L.forEach(([k], li) => { if (!state[k]) return; g.strokeStyle = rgb(li % 2 ? COL.pk : COL.or, 0.75); g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= 180; i++) { const a = (i / 180) * TAU, w = Math.sin(a * (3 + li * 2) + phase * (2 + li) + li) * Math.sin(a * 2 - phase) ; const r = R * (1 + li * 0.2) + w * R * amp * (1 + li * 0.5) * 3; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke(); });
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#0d1020'; g.beginPath(); g.arc(cx, cy, R * 0.9, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.08)'; for (let r = R * 0.35; r < R * 0.9; r += 7) { g.beginPath(); g.arc(cx, cy, r, phase, phase + TAU * 0.85); g.stroke(); }
    const lab = g.createLinearGradient(cx - 30, cy - 30, cx + 30, cy + 30); lab.addColorStop(0, '#FF793D'); lab.addColorStop(1, '#FF659D'); g.fillStyle = lab; g.beginPath(); g.arc(cx, cy, R * 0.28, 0, TAU); g.fill(); g.fillStyle = '#080B14'; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill();
    vinyl.style.left = cx + 'px'; vinyl.style.top = cy + 'px'; vinyl.style.setProperty('--r', R * 0.56 + 'px');
  };
  s.draw = () => draw(0, 0); const lp = loop(draw); if (!api.reduced) lp.start(); sync();
  return { destroy() { lp.stop(); s.destroy(); removeEventListener('ov:sound', sync); } };
}
