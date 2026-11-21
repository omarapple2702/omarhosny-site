// The fun guy: a field of bubbles (lots of friends) and a small, warm inner circle (the ones I trust).
import { h, rnd, pick, TAU, loop, sparks } from '../kit.js';
const OUT = ['Making people laugh over absolutely nothing is a skill.', 'Playful, sarcastic, random. In no particular order.', 'I start conversations. Strangers included. Sorry, not sorry.', 'Laughed at something dumb? Mission accomplished.', 'People call me “the fun guy”. They said it first, so it counts.', 'I’ll turn almost anything into a bit.', 'Random will always beat planned.', 'Comfortable around me = funnier me. Fair warning.', 'Certified fun guy. (There’s no certificate. See Omar™ Terms.)'];
const IN = ['My inner circle: small on purpose.', 'Own personality? Instant points.', 'Humble beats impressive.', 'Acting superior? Hard pass.', 'Trust is earned, one bad joke at a time.'];
export function mount(root, api) {
  root.classList.add('sc-fun');
  const field = h('div', { class: 'fn-field' }), says = h('p', { class: 'fn-says', 'aria-live': 'polite' }, 'Pop something.');
  const copy = h('div', { class: 'ov-copy ov-copy-top' }, h('p', { class: 'cp-big' }, 'The ', h('em', {}, 'fun guy.'), ' Apparently.'), says);
  root.append(field, copy);
  const left = [...OUT].sort(() => Math.random() - 0.5); let pops = 0, gold = null;
  const B = []; const mk = (cls, label, fn, o) => { const b = h('button', { type: 'button', class: 'fn-b ' + cls, 'aria-label': label }); const e = { b, ...o }; b.addEventListener('click', () => fn(e)); field.append(b); B.push(e); return e; };
  const W = () => field.clientWidth, H = () => field.clientHeight;
  for (let i = 0; i < 16; i++) mk('out', 'Bubble', (e) => {
    const r = e.b.getBoundingClientRect(), f = field.getBoundingClientRect(); sparks(field, r.left - f.left + r.width / 2, r.top - f.top + r.height / 2, 12); api.sfx('pop', i % 5);
    say(left.length ? left.pop() : 'That’s all I’ve got. For now.'); e.b.classList.add('is-pop'); pops++; setTimeout(() => { e.x = rnd(0, 1); e.y = 1.1; e.b.classList.remove('is-pop'); }, 900);
    if (pops === 6 && !gold) { gold = mk('gold', 'A golden bubble', () => { say('You’re still here. Respect.'); api.secret('gold', 'You’re still here. Respect.'); gold.b.remove(); B.splice(B.indexOf(gold), 1); sparks(field, W() / 2, H() / 2, 24); }, { x: rnd(0.2, 0.8), y: 1.1, vx: 0, vy: -0.05, r: 30, a: 0 }); }
  }, { x: Math.random(), y: Math.random(), vx: rnd(-0.02, 0.02), vy: rnd(-0.07, -0.025), r: rnd(14, 40), a: rnd(0, TAU) });
  const ring = IN.map((t, i) => mk('in', 'Inner circle bubble ' + (i + 1), () => { say(t); api.sfx('ping', i * 2); if (!ring.seen) ring.seen = new Set(); ring.seen.add(i); if (ring.seen.size === IN.length) api.secret('circle', 'The inner circle. Small, and it stays that way.'); }, { ring: i, r: 26 }));
  const say = (t) => { says.textContent = t; says.classList.remove('is-in'); void says.offsetWidth; says.classList.add('is-in'); };
  const place = (e, t) => { const w = W(), hh = H(); let x, y; if (e.ring != null) { const a = (e.ring / IN.length) * TAU + t * 0.25, rr = Math.min(w, hh) * 0.2; x = w / 2 + Math.cos(a) * rr; y = hh * 0.55 + Math.sin(a) * rr * 0.8; } else { x = e.x * w; y = e.y * hh; } e.b.style.setProperty('--x', x.toFixed(1) + 'px'); e.b.style.setProperty('--y', y.toFixed(1) + 'px'); e.b.style.setProperty('--s', (e.r * 2 / 10).toFixed(2) + 'rem'); };
  const lp = loop((dt, t) => { for (const e of B) { if (e.ring == null) { e.x += e.vx * dt + Math.sin(t + (e.a || 0)) * 0.0006; e.y += e.vy * dt; if (e.y < -0.12) { e.y = 1.1; e.x = Math.random(); } if (e.x < 0) e.x = 1; if (e.x > 1) e.x = 0; } place(e, t); } });
  for (const e of B) place(e, 0); if (!api.reduced) lp.start();
  const ro = new ResizeObserver(() => { for (const e of B) place(e, 0); }); ro.observe(field);
  return { destroy() { lp.stop(); ro.disconnect(); } };
}
