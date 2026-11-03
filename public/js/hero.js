// Home hero: the buddy's pupils follow a mouse pointer, clamped to the eye. Touch and pen input are ignored.
import { $ } from './util.js';
import { motion } from './gfx.js';

export function init() {
  const buddy = $('[data-buddy]'); if (!buddy) return;
  const MAX = 5; // furthest a pupil may move, in SVG units
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || motion.off) return;
    const r = buddy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.5);
    const d = Math.hypot(dx, dy) || 1, k = Math.min(MAX, d / 40) / d;
    buddy.style.setProperty('--ex', (dx * k).toFixed(2) + 'px');
    buddy.style.setProperty('--ey', (dy * k).toFixed(2) + 'px');
  }, { passive: true });
  document.addEventListener('pointerleave', () => { buddy.style.setProperty('--ex', '0px'); buddy.style.setProperty('--ey', '0px'); });
}
