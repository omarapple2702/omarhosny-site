// First lines: drag through time. The "screen" evolves from an idea to bigger things.
import { h, parse, rnd } from '../kit.js';
const STAGES = [['2019', 'Maybe I should learn to code.'], ['2022', 'Started coding. For real.'], ['Late 2023', 'First small website.'], ['Mini-games', 'Lots of tiny games.'], ['Bigger', 'Time to build bigger things.']];
export function mount(root, api) {
  root.classList.add('sc-code');
  const screen = h('div', { class: 'cd-screen' });
  const st = [0, 1, 2, 3, 4].map((i) => h('div', { class: 'cd-st', 'data-i': i, 'aria-hidden': 'true' })); screen.append(...st);
  // 0: an idea
  st[0].append(h('div', { class: 'cd-bulb' }), h('p', { class: 'cd-cursor' }, '> maybe', h('span', { class: 'cd-caret' })));
  // 1: terminal
  const term = h('pre', { class: 'cd-term' }); st[1].append(term);
  // 2: a recreated first website
  const ctr = h('button', { type: 'button', class: 'cd-ctr' }, '000042');
  st[2].append(h('div', { class: 'cd-web' }, h('div', { class: 'cd-bar' }, h('i'), h('i'), h('i'), h('span', {}, 'my-first-website.html')), h('div', { class: 'cd-page' }, h('p', { class: 'cd-tape' }, 'UNDER CONSTRUCTION'), h('h3', {}, 'Welcome to my website!!!'), h('p', {}, 'You are visitor number'), ctr, h('p', { class: 'cd-fine' }, 'A recreation for the vibe. Not the real thing.'))));
  // 3: mini-game
  let score = 0; const dot = h('button', { type: 'button', class: 'cd-dot', tabindex: '-1', 'aria-label': 'Target' }), sc = h('p', { class: 'cd-score' }, 'Hits: 0');
  st[3].append(h('div', { class: 'cd-game' }, sc, dot, h('p', { class: 'cd-fine' }, 'Click the dot. It is a very small game.')));
  const move = () => { dot.style.left = rnd(8, 88) + '%'; dot.style.top = rnd(22, 82) + '%'; };
  dot.addEventListener('click', () => { score++; sc.textContent = 'Hits: ' + score; api.sfx('pop', score); move(); if (score === 10) api.say('Ten. Okay, that was the whole game.'); }); move();
  // 4: bigger
  st[4].append(parse(`<svg class="cd-big" viewBox="0 0 400 220" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="10" width="380" height="200" rx="14" stroke="#FF793D" stroke-opacity=".7"/><path d="M10 40h380M90 40v170" stroke="#FFFFFF" stroke-opacity=".18"/><rect class="cd-card" x="104" y="56" width="130" height="62" rx="8" stroke="#FF659D"/><rect class="cd-card d1" x="248" y="56" width="130" height="62" rx="8" stroke="#FF793D"/><rect class="cd-card d2" x="104" y="132" width="274" height="66" rx="8" stroke="#FFFFFF" stroke-opacity=".4"/><path class="cd-bars" d="M130 180v-14M150 180v-26M170 180v-18M190 180v-34M210 180v-22M230 180v-40" stroke="#FF793D" stroke-width="5"/><path d="M110 82q40-22 80 0t80-8t80 6" stroke="#FF659D" stroke-width="2"/><circle cx="34" cy="74" r="8" stroke="#FF659D"/><path d="M26 108h16M26 128h16M26 148h16" stroke="#FFFFFF" stroke-opacity=".35"/></svg>`), h('p', { class: 'cd-fine' }, 'Not a real product. Just the feeling of building bigger.'));
  const label = h('p', { class: 'cd-label', 'aria-live': 'polite' }), range = h('input', { type: 'range', min: 0, max: 4, step: 1, value: 0, class: 'cd-range', 'aria-label': 'Time' });
  const ticks = h('ol', { class: 'cd-ticks' }, STAGES.map(([t], i) => h('li', {}, h('button', { type: 'button', 'data-i': i, text: t }))));
  const copy = h('div', { class: 'ov-copy ov-copy-low' }, label);
  root.append(screen, copy, h('div', { class: 'cd-ctl' }, range, ticks));
  let cur = -1, typeT = 0;
  const type = () => { clearInterval(typeT); const L = ['> print("hello")', 'hello', '> ok, that works', '> what if I change this?', '> ...it broke. fixing.']; term.textContent = ''; if (api.reduced) { term.textContent = L.join('\n'); return; } let li = 0, ci = 0; typeT = setInterval(() => { const l = L[li]; if (!l) return clearInterval(typeT); term.textContent += l[ci++] ?? ''; if (ci > l.length) { term.textContent += '\n'; li++; ci = 0; } }, 38); };
  const set = (i) => { if (i === cur) return; cur = i; st.forEach((e, k) => { e.classList.toggle('on', k === i); e.setAttribute('aria-hidden', k !== i); }); range.value = i; range.setAttribute('aria-valuetext', STAGES[i][0] + ': ' + STAGES[i][1]); label.innerHTML = ''; label.append(h('b', { text: STAGES[i][0] }), ' ' + STAGES[i][1]); [...ticks.querySelectorAll('button')].forEach((b, k) => b.classList.toggle('on', k === i)); if (i === 1) type(); else clearInterval(typeT); api.sfx('ping', i * 3); };
  range.addEventListener('input', () => set(+range.value)); ticks.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) set(+b.dataset.i); });
  let n = 0; ctr.addEventListener('click', () => { n++; ctr.textContent = String(42 + n).padStart(6, '0'); if (n === 5) api.secret('counter', 'Yes, I clicked it too. Many times.'); });
  set(0);
  return { destroy() { clearInterval(typeT); } };
}
