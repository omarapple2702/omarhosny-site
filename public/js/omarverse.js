// Omarverse: loading gate, hub, portals into nine scenes, discovery tracking, optional sound, finale.
// Everything is original and runs in the browser. Nothing is stored or sent. Sound stays off until the visitor turns it on.
import { $, announce } from './util.js';
import { motion } from './gfx.js';
import { found } from './core.js';
import { h, rnd, TAU, COL, rgb, fit, loop } from './ov/kit.js';
import { AREAS } from './ov/areas.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function gateFx(cv) {
  const s = fit(cv, 1.5), P = Array.from({ length: 90 }, () => ({ a: rnd(0, TAU), r: Math.random(), v: rnd(0.15, 0.6), k: Math.random() < 0.5 }));
  const draw = (dt) => {
    const g = s.g, W = s.w, H = s.h, cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2; g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const p of P) { const r0 = p.r; p.r += p.v * dt; if (p.r > 1) { p.r = 0.02; p.a = rnd(0, TAU); } const a = Math.min(1, p.r * 3) * 0.45, x0 = cx + Math.cos(p.a) * R * r0 * r0, y0 = cy + Math.sin(p.a) * R * r0 * r0, x1 = cx + Math.cos(p.a) * R * p.r * p.r, y1 = cy + Math.sin(p.a) * R * p.r * p.r; g.strokeStyle = rgb(p.k ? COL.or : COL.pk, a); g.lineWidth = 0.6 + p.r * 2.4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  };
  s.draw = () => draw(0.5);
  const l = loop(draw); if (!motion.off) l.start();
  return { stop() { l.stop(); s.destroy(); } };
}

export async function init() {
  const root = $('[data-ov]'); if (!root) return;
  const gate = $('[data-ov-gate]', root), world = $('[data-ov-world]', root), ring = $('[data-ov-prog]', root), msg = $('[data-ov-gate-msg]', root);
  let via = false; try { via = sessionStorage.getItem('ovx') === '1'; sessionStorage.removeItem('ovx'); } catch {}
  if (via) gate.classList.add('is-hot');
  const fx = gateFx($('[data-ov-gate-fx]', root));
  document.documentElement.classList.add('ov-on');

  // Real progress: each step below completes when the thing it names has actually loaded.
  const steps = [['Type ready', document.fonts?.ready], ['World loaded', import('./ov/hub.js')], ['Lights on', new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))]];
  let done = 0; const setP = (v) => ring.style.setProperty('--p', v.toFixed(3));
  setP(0);
  await Promise.all(steps.map(([n, p]) => Promise.resolve(p).catch(() => {}).then(() => { done++; setP(done / steps.length); msg.textContent = n; })));
  const { createHub } = await import('./ov/hub.js');

  const st = { seen: new Set(), secrets: new Set() };
  let cur = null, audio = null, finaleOpen = false, finaleShown = false, toastT = 0;
  const toast = h('p', { class: 'ov-toast', role: 'status' }); document.body.append(toast);
  const say = (m) => { toast.textContent = m; toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 3200); };
  const sfx = (k, p) => audio?.sfx(k, p);

  // ---- sound button (off by default; audio code is only fetched when it is first switched on) ----
  const snd = h('button', { type: 'button', class: 'ov-sound', 'aria-pressed': 'false' }, h('span', { class: 'ov-snd-ic', 'aria-hidden': 'true' }), h('span', { class: 'ov-snd-t', text: 'Sound off' }));
  const syncSnd = () => { const on = !!audio?.isOn(); snd.setAttribute('aria-pressed', on); $('.ov-snd-t', snd).textContent = on ? 'Sound on' : 'Sound off'; };
  const setSound = async (v) => { audio ??= await import('./ov/audio.js'); audio.setOn(v); syncSnd(); if (v) { audio.sfx('chime'); say('Sound on. Original, generated live.'); } };
  snd.addEventListener('click', () => setSound(!audio?.isOn()));
  addEventListener('ov:sound', syncSnd);
  world.append(snd);

  // ---- hub ----
  const hub = createHub(world, AREAS, st, { open: (id) => open(id), core: () => coreClick() });
  let coreHits = 0, coreT = 0;
  const coreClick = () => {
    if (finaleShown && st.seen.size === AREAS.length) return showFinale();
    coreHits++; clearTimeout(coreT); coreT = setTimeout(() => { coreHits = 0; }, 1800); sfx('ping', coreHits * 3); hub.hideHint();
    if (coreHits === 5) { coreHits = 0; hub.flare(1); setTimeout(() => hub.flare(st.seen.size === AREAS.length ? 0.7 : 0), 1600); secret('core', 'That’s the core. Nothing inside. Probably.'); }
  };
  function secret(id, m) { if (st.secrets.has(id)) { if (m) say(m); return; } st.secrets.add(id); found('ov-' + id); say(m || 'Secret found.'); sfx('chime'); hub.refresh(); }

  // ---- finale ----
  const fin = h('div', { class: 'ov-finale', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ov-fin-h', hidden: '' },
    h('div', { class: 'ov-fin-in' }, h('p', { class: 'ov-fin-k', text: 'You found all nine places' }), h('h2', { id: 'ov-fin-h' }, 'Omar', h('span', { class: 'hl', text: '.' })),
      h('p', { class: 'ov-fin-l', text: 'That was a snapshot, not the whole picture.' }), h('p', { class: 'ov-fin-l2', text: 'There’s a lot more ahead.' }), h('p', { class: 'ov-fin-s' }),
      h('div', { class: 'actions' }, h('button', { type: 'button', class: 'btn btn-primary', 'data-fin-close': '', text: 'Keep poking around' }), h('a', { class: 'btn', href: '/contact/', text: 'Say hello' }))));
  world.append(fin);
  function showFinale() {
    finaleShown = true; finaleOpen = true; $('.ov-fin-s', fin).textContent = st.secrets.size >= 5 ? `${st.secrets.size} secrets found too. Show-off.` : (st.secrets.size ? `${st.secrets.size} secret${st.secrets.size > 1 ? 's' : ''} found. Plenty left.` : 'Secrets are still hiding, by the way.');
    fin.hidden = false; requestAnimationFrame(() => fin.classList.add('is-on')); hub.flare(1); sfx('chime'); announce('You found all nine places. That was a snapshot, not the whole picture. There is a lot more ahead.');
    const hd = $('[data-fin-close]', fin); setTimeout(() => hd.focus({ preventScroll: true }), 400);
    for (const e of [world.querySelector('.ov-nodes'), world.querySelector('.ov-corebtn')]) e.inert = true;
  }
  function hideFinale() { if (!finaleOpen) return; finaleOpen = false; fin.classList.remove('is-on'); hub.flare(0.5); setTimeout(() => { fin.hidden = true; }, 500); for (const e of [world.querySelector('.ov-nodes'), world.querySelector('.ov-corebtn')]) e.inert = false; $('.ov-corebtn', world).focus({ preventScroll: true }); }
  $('[data-fin-close]', fin).addEventListener('click', hideFinale);

  // ---- scenes ----
  async function open(id) {
    if (cur || finaleOpen) return; cur = id; hub.hideHint();
    const a = AREAS.find((x) => x.id === id), btn = hub.el(id), r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, Rr = Math.hypot(innerWidth, innerHeight);
    st.seen.add(id); hub.refresh(); sfx('whoosh');
    const back = h('button', { type: 'button', class: 'ov-back' }, h('span', { 'aria-hidden': 'true', text: '←' }), ' Core');
    const slot = h('div', { class: 'ov-sc-slot' }), body = h('div', { class: 'ov-sc-body' });
    const scene = h('div', { class: 'ov-scene', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ov-st', 'data-c': a.c, 'data-s': id }, h('header', { class: 'ov-sc-head' }, back, h('h2', { id: 'ov-st', text: a.title }), slot), body);
    slot.append(snd); document.body.append(scene); document.documentElement.classList.add('ov-lock');
    const others = [...document.body.children].filter((e) => e !== scene && !e.matches('script,#live,.ov-toast')); others.forEach((e) => { e.inert = true; });
    hub.stop();
    const anim = motion.off ? null : scene.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Rr}px at ${x}px ${y}px)` }], { duration: 780, easing: 'cubic-bezier(.7,0,.2,1)' });
    if (!motion.off) { const rip = h('i', { class: 'ov-ripple', 'aria-hidden': 'true' }); rip.style.left = x + 'px'; rip.style.top = y + 'px'; document.body.append(rip); rip.animate([{ transform: 'translate(-50%,-50%) scale(0)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(60)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => rip.remove(); }
    let mod, inst;
    try { mod = await import(`./ov/scenes/${id}.js`); } catch (e) { console.error(e); say('That place failed to load. Try again.'); }
    if (mod) inst = mod.mount(body, { reduced: motion.off, say, secret: (k, m) => secret(id + '-' + k, m), sfx, audio: () => audio, setSound, goto: (t) => { location.href = t; } });
    if (anim) await anim.finished.catch(() => {}); else await wait(0);
    back.focus({ preventScroll: true }); announce(`${a.title}. ${st.seen.size} of ${AREAS.length} places found.`);
    let closing = false;
    const close = async () => {
      if (closing) return; closing = true; removeEventListener('keydown', onKey); sfx('whoosh');
      const r2 = btn.getBoundingClientRect(), x2 = r2.left + r2.width / 2, y2 = r2.top + r2.height / 2;
      inst?.destroy?.(); world.append(snd); slot.remove();
      if (!motion.off) await scene.animate([{ clipPath: `circle(${Rr}px at ${x2}px ${y2}px)` }, { clipPath: `circle(0px at ${x2}px ${y2}px)` }], { duration: 560, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished.catch(() => {});
      scene.remove(); others.forEach((e) => { e.inert = false; }); document.documentElement.classList.remove('ov-lock'); cur = null; hub.resume(); btn.focus({ preventScroll: true });
      if (st.seen.size === AREAS.length && !finaleShown) setTimeout(showFinale, 350);
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    addEventListener('keydown', onKey); back.addEventListener('click', close);
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && finaleOpen && !cur) { e.preventDefault(); hideFinale(); } });
  addEventListener('keydown', (e) => { if (cur || finaleOpen || e.ctrlKey || e.metaKey || e.altKey || !/^[1-9]$/.test(e.key) || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; open(AREAS[+e.key - 1].id); });

  // ---- reveal ----
  hub.layout(); hub.start();
  gate.classList.add('is-open'); world.classList.add('is-live'); sfx('whoosh');
  setTimeout(() => { fx.stop(); gate.remove(); }, motion.off ? 50 : 1900);
  announce('Omarverse is ready. Nine places to explore. Press the number keys 1 to 9, or tab to a place and press Enter.');
}
