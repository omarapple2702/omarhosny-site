export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let sd; export const siteData = () => (sd ??= JSON.parse(document.getElementById('site-data')?.textContent || '{}'));
// Local-only storage. Everything lives under one key; falls back to memory if storage is blocked.
const KEY = 'oh:v1', mem = {};
export const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return { ...mem }; } },
  set(fn) { const d = this.get(); fn(d); try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { Object.assign(mem, d); } return d; },
  clear() { try { localStorage.removeItem(KEY); } catch {} for (const k in mem) delete mem[k]; },
};
export function announce(msg) { const l = $('#live'); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 30); }
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
