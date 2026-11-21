// Curious kid: a half-remembered dinner. Your pointer is a lens; questions float up; one button you shouldn't press.
import { h, parse, rnd, pick, loop, fit, TAU, COL, rgb, sparks } from '../kit.js';
const Q = ['why?', 'how does that work?', 'what if I press this?', 'what’s inside?', 'who made this?', 'can I take it apart?', 'why not?'];
const A = ['Because.', 'Good question.', 'Let me find out.', 'Hmm. Interesting.'];
export function mount(root, api) {
  root.classList.add('sc-kid');
  const cv = h('canvas', { class: 'kd-bokeh', 'aria-hidden': 'true' });
  const mem = h('div', { class: 'kd-mem', 'aria-hidden': 'true' });
  mem.append(parse(`<svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-20 110Q200 190 400 130T820 120" stroke="#FFB27A" stroke-opacity=".7" stroke-width="1.5"/>
    ${[40, 130, 220, 310, 400, 490, 580, 670, 760].map((x, i) => `<circle cx="${x}" cy="${[116, 146, 160, 150, 132, 134, 148, 150, 128][i]}" r="6" fill="#FFD6AA"/>`).join('')}
    <path d="M0 260h800" stroke="#FF659D" stroke-opacity=".35"/><path d="M0 268h800" stroke="#FF659D" stroke-opacity=".15"/>
    <path d="M70 320h660l70 130H0z" fill="#111827" stroke="#FF793D" stroke-opacity=".6"/>
    ${[190, 340, 490, 640].map((x) => `<ellipse cx="${x}" cy="372" rx="52" ry="11" stroke="#FF659D" stroke-opacity=".8"/><ellipse cx="${x}" cy="370" rx="30" ry="6" stroke="#FF659D" stroke-opacity=".4"/>`).join('')}
    ${[265, 565].map((x) => `<rect x="${x - 9}" y="288" width="18" height="30" rx="4" stroke="#FFB27A" stroke-opacity=".9"/><path d="M${x} 288v-9" stroke="#FFB27A"/><circle cx="${x}" cy="276" r="5" fill="#FF793D"/>`).join('')}
    <path d="M110 330l-10 40M700 330l10 40" stroke="#FF793D" stroke-opacity=".4"/></svg>`));
  const qs = h('div', { class: 'kd-qs' });
  const prank = h('button', { type: 'button', class: 'kd-prank' }, 'Do not press');
  const copy = h('div', { class: 'ov-copy' }, h('p', { class: 'cp-big' }, 'Quiet kid. ', h('em', {}, 'Mischievous.'), ' Curious about literally everything.'), h('p', {}, 'Tech was already in the picture before I can remember.'),
    h('p', { class: 'cp-note' }, 'Dinner in Sahel, around 2018. Family, food, no idea where exactly: ', h('span', { class: 'kd-blur', 'aria-label': 'forgotten' }, '▒▒▒▒▒▒'), h('br'), h('small', {}, 'An artistic memory, not a photo. Move around to bring it into focus.')));
  root.append(cv, mem, qs, copy, prank);
  const s = fit(cv, 1.25), B = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random() * 0.8, r: rnd(18, 70), a: rnd(0.12, 0.36), c: Math.random() < 0.55 ? COL.or : COL.pk, p: rnd(0, TAU), v: rnd(0.01, 0.03) }));
  const draw = (dt, t) => { const g = s.g; g.clearRect(0, 0, s.w, s.h); g.globalCompositeOperation = 'lighter'; for (const b of B) { const x = (b.x + Math.sin(t * b.v * 4 + b.p) * 0.03) * s.w, y = (b.y + Math.cos(t * b.v * 3 + b.p) * 0.03) * s.h, gr = g.createRadialGradient(x, y, 0, x, y, b.r); gr.addColorStop(0, rgb(b.c, b.a)); gr.addColorStop(0.7, rgb(b.c, b.a * 0.7)); gr.addColorStop(1, rgb(b.c, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, b.r, 0, TAU); g.fill(); } };
  s.draw = () => draw(0, 0); const lp = loop(draw); if (!api.reduced) lp.start();
  root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); mem.style.setProperty('--mx', e.clientX - r.left + 'px'); mem.style.setProperty('--my', e.clientY - r.top + 'px'); });
  mem.style.setProperty('--mx', '50%'); mem.style.setProperty('--my', '45%');
  const ask = () => {
    if (qs.children.length > 7) return; const q = h('button', { type: 'button', class: 'kd-q' }, pick(Q)); q.style.left = rnd(6, 86) + '%'; q.style.setProperty('--dur', rnd(9, 14) + 's');
    q.addEventListener('animationend', () => q.remove());
    q.addEventListener('click', (e) => { const r = q.getBoundingClientRect(), b = root.getBoundingClientRect(); sparks(root, r.left - b.left + r.width / 2, r.top - b.top + r.height / 2, 8); api.sfx('pop'); q.textContent = pick(A); q.disabled = true; setTimeout(() => q.remove(), 700); });
    qs.append(q);
  };
  ask(); const iv = setInterval(ask, api.reduced ? 5000 : 1800);
  prank.addEventListener('click', () => { api.sfx('whoosh'); root.classList.add('is-prank'); api.say('Told you.'); api.secret('prank', 'Told you. Curiosity always wins.'); setTimeout(() => root.classList.remove('is-prank'), 1600); });
  return { destroy() { lp.stop(); s.destroy(); clearInterval(iv); } };
}
