// Original generative audio, synthesised live with the Web Audio API. No recordings, no samples, no copyrighted material.
// Nothing here is loaded or started until the visitor turns sound on.
let ctx, master, verb, an, on = false;
const layers = {}, N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CH = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 66]]; // Am7, Fmaj7, Cmaj7, G6-ish
let step = 0, timers = [];

function env(g, t, a, d, peak) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function out(node, wet = 0.3) { node.connect(master); const w = ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(verb); }
function layerGain(name, v) { const g = ctx.createGain(); g.gain.value = v ? 1 : 0; layers[name] = { g, on: v }; return g; }

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; an = ctx.createAnalyser(); an.fftSize = 128; an.smoothingTimeConstant = 0.8;
  master.connect(an); an.connect(ctx.destination);
  const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  verb = ctx.createConvolver(); verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.5; verb.connect(vg); vg.connect(master);
  // keys: a slow pad
  const pad = layerGain('keys', true), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
  const oscs = CH[0].flatMap((n) => [-7, 7].map((c) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = N(n); o.detune.value = c; const g = ctx.createGain(); g.gain.value = 0.045; o.connect(g); g.connect(lp); o.start(); return o; }));
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 350; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  lp.connect(pad); out(pad, 0.55);
  // bass
  const bass = layerGain('bass', false), bo = ctx.createOscillator(), bg = ctx.createGain(); bo.type = 'sine'; bo.frequency.value = N(33); bg.gain.value = 0.16; bo.connect(bg); bg.connect(bass); bo.start(); out(bass, 0.05);
  const pulse = layerGain('pulse', false); out(pulse, 0.25);
  const spark = layerGain('sparkle', true); out(spark, 0.8);
  // chord progression
  timers.push(setInterval(() => {
    step = (step + 1) % CH.length; const t = ctx.currentTime;
    oscs.forEach((o, i) => o.frequency.setTargetAtTime(N(CH[step][i >> 1]), t, 1.2));
    bo.frequency.setTargetAtTime(N(CH[step][0] - 24), t, 0.4);
  }, 8000));
  // plucky pulse (8th notes) and sparkles
  let k = 0;
  timers.push(setInterval(() => {
    if (!layers.pulse.on || ctx.state !== 'running') return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'square'; o.frequency.value = N(CH[step][[0, 2, 1, 3, 2, 1, 3, 2][k++ % 8]] + 12); f.type = 'lowpass'; f.frequency.value = 1400; env(g, t, 0.005, 0.22, 0.05); o.connect(f); f.connect(g); g.connect(pulse); o.start(t); o.stop(t + 0.3);
  }, 260));
  const sp = () => { if (layers.sparkle.on && ctx.state === 'running') { const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = N(CH[step][Math.floor(Math.random() * 4)] + 24); env(g, t, 0.01, 1.6, 0.05); o.connect(g); g.connect(spark); o.start(t); o.stop(t + 1.8); } timers.push(setTimeout(sp, 900 + Math.random() * 2200)); };
  sp();
}
export const ready = () => !!ctx;
export const isOn = () => on;
export function setOn(v) {
  if (v && !ctx) build();
  if (!ctx) return; on = v;
  if (v) ctx.resume(); master.gain.setTargetAtTime(v ? 0.7 : 0, ctx.currentTime, 0.25);
  if (!v) setTimeout(() => { if (!on && ctx.state === 'running') ctx.suspend(); }, 900);
  dispatchEvent(new CustomEvent('ov:sound', { detail: v }));
}
export function layer(name, v) { if (!ctx || !layers[name]) return; layers[name].on = v; layers[name].g.gain.setTargetAtTime(v ? 1 : 0, ctx.currentTime, 0.12); }
export const layerOn = (name) => !!layers[name]?.on;
export function level() { if (!an || !on) return 0; const d = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(d); let s = 0; for (let i = 0; i < d.length; i++) s += d[i]; return s / d.length / 255; }
// Little sound effects. All silent unless sound is on.
export function sfx(kind, p = 0) {
  if (!on || !ctx) return; const t = ctx.currentTime, g = ctx.createGain(), o = ctx.createOscillator();
  if (kind === 'ping') { o.type = 'sine'; o.frequency.value = N(76 + p); env(g, t, 0.005, 0.6, 0.12); o.connect(g); out(g, 0.5); o.start(t); o.stop(t + 0.7); }
  else if (kind === 'pop') { o.type = 'triangle'; o.frequency.setValueAtTime(520 + p * 40, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.12); env(g, t, 0.003, 0.14, 0.14); o.connect(g); out(g, 0.1); o.start(t); o.stop(t + 0.2); }
  else if (kind === 'whoosh') { const b = ctx.createBuffer(1, ctx.sampleRate * 0.9, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(); s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.5); env(g, t, 0.25, 0.5, 0.18); s.connect(f); f.connect(g); out(g, 0.35); s.start(t); }
  else if (kind === 'chime') { [0, 4, 7, 12].forEach((n, i) => { const oo = ctx.createOscillator(), gg = ctx.createGain(); oo.type = 'sine'; oo.frequency.value = N(72 + n); env(gg, t + i * 0.09, 0.01, 1.4, 0.09); oo.connect(gg); out(gg, 0.7); oo.start(t + i * 0.09); oo.stop(t + 1.6 + i * 0.09); }); }
  else if (kind === 'click') { o.type = 'square'; o.frequency.value = 900; env(g, t, 0.001, 0.04, 0.04); o.connect(g); out(g, 0); o.start(t); o.stop(t + 0.06); }
}
