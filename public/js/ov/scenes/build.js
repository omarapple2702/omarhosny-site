// Bigger things: hold to build. Block by block, something stands up.
import { h, parse, sparks } from '../kit.js';
const N = 6;
export function mount(root, api) {
  root.classList.add('sc-build');
  const stage = h('div', { class: 'bd-stage', 'aria-hidden': 'true' });
  const web = parse(`<svg class="bd-net" viewBox="0 0 400 300" fill="none" aria-hidden="true"><g class="bd-lines" stroke="#FF659D" stroke-opacity=".7" stroke-width="1.2"><path d="M200 70L90 40M200 70L310 40M200 70L60 110M200 70L340 110M200 70L200 14"/></g>${[[90, 40], [310, 40], [60, 110], [340, 110], [200, 14]].map(([x, y], i) => `<circle class="bd-n" cx="${x}" cy="${y}" r="5" fill="#FF793D"/>`).join('')}</svg>`);
  const tower = h('div', { class: 'bd-tower' }); stage.append(web, tower);
  const spark = h('button', { type: 'button', class: 'bd-spark', 'aria-label': 'A small spark', tabindex: '-1' }); stage.append(spark);
  const plate = h('div', { class: 'bd-plate' }, h('b', {}, 'Atlas AI'), h('a', { class: 'btn btn-primary', href: '/projects/atlas-ai/' }, 'See the project'));
  const meter = h('div', { class: 'bd-meter', 'aria-hidden': 'true' }, h('i'));
  const btn = h('button', { type: 'button', class: 'bd-hold' }, h('span', { class: 'bd-ring', 'aria-hidden': 'true' }), h('span', { class: 'bd-t' }, 'Hold to build'));
  const copy = h('div', { class: 'ov-copy' }, h('p', { class: 'cp-big' }, '2026: the ', h('em', {}, 'bigger'), ' stuff started.'), h('p', {}, 'First big one: Atlas AI.'), h('p', { class: 'cp-note' }, 'I like making things someone might actually use. And I like proving what I can do.'));
  root.append(stage, copy, plate, btn);
  let charge = 0, holding = false, blocks = 0, t0 = 0, raf = 0, last = 0;
  const setC = () => btn.style.setProperty('--c', charge.toFixed(3));
  const place = () => {
    blocks++; charge = 0; setC(); const w = 220 - blocks * 22;
    const b = h('div', { class: 'bd-block', 'data-k': blocks }); b.style.width = w + 'px'; tower.append(b); api.sfx('ping', blocks * 2); sparks(stage, stage.clientWidth / 2, stage.clientHeight - 30 - blocks * 34, 8);
    if (blocks >= N) { stage.classList.add('is-lit'); plate.classList.add('on'); btn.hidden = true; api.sfx('chime'); api.say('Okay. That’s standing.'); }
    else btn.querySelector('.bd-t').textContent = `Block ${blocks + 1} of ${N}`;
  };
  const tick = (t) => { raf = 0; const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; if (holding) charge += dt / 0.8; else charge = Math.max(0, charge - dt * 0.6); setC(); if (charge >= 1) place(); if (holding || charge > 0) raf = requestAnimationFrame(tick); else last = 0; };
  const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const down = (e) => { if (blocks >= N) return; holding = true; t0 = performance.now(); wake(); };
  const up = () => { if (!holding) return; holding = false; if (performance.now() - t0 < 220) charge = Math.min(0.999, charge + 0.34); wake(); };
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); down(); }); addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(); } }); btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  spark.addEventListener('click', () => api.secret('spark', 'More is coming. I’m not saying what.'));
  const lit = new MutationObserver(() => { spark.tabIndex = stage.classList.contains('is-lit') ? 0 : -1; }); lit.observe(stage, { attributes: true });
  return { destroy() { cancelAnimationFrame(raf); lit.disconnect(); removeEventListener('pointerup', up); } };
}
