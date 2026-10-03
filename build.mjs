// Zero-dependency static site generator. Run: node build.mjs  →  dist/
import { mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { SITE, PROJECTS, SOCIALS, ABOUT } from './src/data.mjs';
import { EXTERNAL_GAMES, hostOf } from './src/games.mjs';

const OUT = 'dist';
const LIVE = PROJECTS.filter((p) => !p.pending);
const PENDING = PROJECTS.filter((p) => p.pending);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path) => SITE.url + path;
const PERSON_ID = abs('/#person');
const SITE_ID = abs('/#website');

const chev = '<svg class="chev" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const NAV = [
  ['/projects/', 'Projects'],
  ['/interests/', 'Interests'],
  ['/learning/', 'Learning'],
  ['/arcade/', 'Arcade'],
  ['/lab/', 'Lab'],
  ['/random/', 'Random'],
  ['/about/', 'About'],
  ['/contact/', 'Contact'],
];

const pages = [];
function page(path, { title, description, body, schema = [], crumbs = [], noindex = false, section = '' }) {
  const id = path === '/' ? 'home' : path === '/404.html' ? 'notfound' : path.split('/').filter(Boolean).join('-');
  pages.push({ path, title, description, body, schema, crumbs, noindex, section, id });
}

const ext = '<svg class="ext" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11l6-6M6 5h5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const POLICY_DATE = '3 October 2026';
const NEWTAB = '<span class="sr-only"> (opens in a new tab)</span>';
const dot = (status) => `<span class="dot dot-${status}" aria-hidden="true"></span>`;


// ---------- Original artwork (inline SVG, no external assets) ----------
const A = (inner, vb = '0 0 160 80') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const grid3 = (x0, y0, dx, dy, w, h) => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${x0 + c * dx}" y="${y0 + r * dy}" width="${w}" height="${h}" rx="2.5" stroke-opacity=".6"/>`)).join('');
const net = (() => { const L = [[40, [22, 40, 58]], [80, [14, 30, 50, 66]], [120, [28, 52]]]; let l = '', n = ''; for (let i = 0; i < L.length - 1; i++) for (const a of L[i][1]) for (const b of L[i + 1][1]) l += `<path d="M${L[i][0]} ${a}L${L[i + 1][0]} ${b}"/>`; for (const [x, ys] of L) for (const y of ys) n += `<circle cx="${x}" cy="${y}" r="3.4" fill="currentColor" class="art-pulse"/>`; return `<g stroke-opacity=".4" class="art-line">${l}</g>${n}`; })();
const ART = {
  'omar-calculator': A(`<g class="art-float"><rect x="52" y="6" width="56" height="68" rx="9" fill="#0b1830"/><rect x="58" y="12" width="44" height="14" rx="4" stroke-opacity=".55"/><path d="M62 19h14" stroke-width="2.4"/>${grid3(58, 31, 15, 12, 12, 9)}<rect x="88" y="55" width="12" height="9" rx="2.5" fill="currentColor" fill-opacity=".55" class="art-pulse"/></g>`),
  omnidesk: A('<g class="art-float"><rect x="22" y="14" width="64" height="44" rx="5" fill="#0b1830" stroke-opacity=".5"/><rect x="62" y="10" width="76" height="46" rx="5" fill="#0d1d38"/><path d="M62 20h76" stroke-opacity=".6"/><circle cx="68" cy="15" r="1.6" fill="currentColor"/><circle cx="74" cy="15" r="1.6" fill="currentColor"/><path d="M70 30h40M70 38h28M70 46h34" stroke-opacity=".5"/></g><rect x="46" y="64" width="68" height="10" rx="5" fill="#0b1830"/><circle cx="62" cy="69" r="2.6" fill="currentColor"/><circle cx="74" cy="69" r="2.6"/><circle cx="86" cy="69" r="2.6"/><circle cx="98" cy="69" r="2.6"/>'),
  'day-frame': A('<rect x="42" y="6" width="76" height="68" rx="4" fill="#0b1830"/><rect x="50" y="14" width="60" height="52" rx="2" stroke-opacity=".5"/><path d="M54 58a26 26 0 0 1 52 0" stroke-opacity=".6"/><circle class="art-pulse" cx="80" cy="32" r="6" fill="currentColor" fill-opacity=".85"/><path d="M50 58h60" stroke-opacity=".5"/>'),
  welock: A('<g class="art-float"><rect x="56" y="34" width="48" height="36" rx="7" fill="#0b1830"/><path class="art-pulse" d="M66 34V26a14 14 0 0 1 28 0v8"/><circle cx="80" cy="50" r="4.5" fill="currentColor"/><path d="M80 54v7"/></g>'),
  'terra-view': A('<g class="art-spin"><circle cx="80" cy="40" r="30" fill="#0b1830"/><ellipse cx="80" cy="40" rx="12" ry="30" stroke-opacity=".6"/><path d="M50 40h60M54 26h52M54 54h52" stroke-opacity=".5"/></g><circle class="art-pulse" cx="98" cy="28" r="2.6" fill="currentColor"/>'),
  'atlas-ai': A(net),
  omarlink: A('<rect x="22" y="16" width="26" height="48" rx="5" fill="#0b1830"/><rect x="64" y="26" width="78" height="34" rx="3" fill="#0b1830"/><path d="M58 64h92" stroke-opacity=".5"/><path class="art-line" d="M50 40q14-18 28-8" /><circle class="art-pulse" cx="66" cy="33" r="2.6" fill="currentColor"/>'),
};
const T = (inner) => A(inner, '0 0 64 64');
const TILE = {
  arcade: T('<circle cx="32" cy="32" r="24" stroke-opacity=".5"/><circle cx="32" cy="32" r="15"/><circle cx="32" cy="32" r="6" fill="currentColor"/>'),
  lab: T('<ellipse cx="32" cy="32" rx="26" ry="10" stroke-opacity=".5"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(60 32 32)" stroke-opacity=".5"/><ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(120 32 32)" stroke-opacity=".5"/><circle cx="32" cy="32" r="5" fill="currentColor"/>'),
  random: T('<rect x="10" y="10" width="44" height="44" rx="10"/><circle cx="22" cy="22" r="3" fill="currentColor"/><circle cx="42" cy="22" r="3" fill="currentColor"/><circle cx="32" cy="32" r="3" fill="currentColor"/><circle cx="22" cy="42" r="3" fill="currentColor"/><circle cx="42" cy="42" r="3" fill="currentColor"/>'),
};
const GAMEART = {
  reaction: A('<rect x="30" y="12" width="100" height="56" rx="12" fill="#0b1830"/><circle class="art-pulse" cx="80" cy="40" r="13" fill="currentColor" fill-opacity=".85"/><path d="M48 40h10M102 40h10" stroke-opacity=".5"/>'),
  target: A('<circle cx="80" cy="40" r="30" stroke-opacity=".5"/><circle cx="80" cy="40" r="20"/><circle class="art-pulse" cx="80" cy="40" r="8" fill="currentColor"/><path d="M80 4v14M80 62v14M44 40h14M102 40h14" stroke-opacity=".6"/>'),
  memory: A(`<g>${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => { const on = (r * 3 + c) % 4 === 1; return `<rect x="${52 + c * 20}" y="${10 + r * 20}" width="16" height="16" rx="4" ${on ? 'fill="currentColor" class="art-pulse"' : 'stroke-opacity=".55"'}/>`; })).join('')}</g>`),
  avoid: A('<path d="M70 14h20L132 74H28z" fill="#0b1830" stroke-opacity=".6"/><path d="M80 14v60" stroke-opacity=".3" class="art-line"/><rect x="72" y="22" width="9" height="7" rx="1.5" fill="currentColor" fill-opacity=".5"/><rect x="92" y="38" width="14" height="10" rx="2" fill="currentColor" fill-opacity=".7"/><path class="art-float" d="M80 52l9 18H71z" fill="currentColor"/>'),
  logic: A('<g fill="currentColor" stroke="none" font-size="17" font-weight="700" text-anchor="middle"><text x="34" y="46">2</text><text x="62" y="46">4</text><text x="90" y="46">8</text><text class="art-pulse" x="122" y="46">?</text></g><path d="M20 58h120" stroke-opacity=".4"/>'),
};
const SCENES = {
  'terra-view': { scene: 'globe', label: 'A small interactive 3D globe with a latitude and longitude grid. Drag to rotate it.', cap: 'Visual demo only. The real TerraView is on its own website.' },
  welock: { scene: 'lock', label: 'A 3D padlock that locks and unlocks. Click it or use the button below.', cap: 'Visual demonstration. WeLock itself is a macOS app.', ctl: '<button type="button" class="btn" id="lock-btn" aria-pressed="false">Unlock with Touch ID</button><span class="status-chip" id="lock-status" role="status">Locked</span>' },
  omarlink: { scene: 'link', label: 'A 3D phone and Mac linked by a curved line, with labelled items travelling between them: clipboard, files, screen and notifications.', cap: 'Concept visual. There is no public OmarLink release yet.', ctl: '<button type="button" class="btn" id="link-btn" aria-pressed="true">Disconnect</button><span class="status-chip" id="link-status" role="status">Connected</span>' },
  omnidesk: { scene: 'desk', label: 'A miniature 3D desktop with floating Files, Notes, Tasks and Code windows and a dock. Click a window to bring it forward.', cap: 'Visual demo only. The real OmniDesk is on its own website.' },
  'day-frame': { scene: 'frame', label: 'A 3D frame showing the sky for your current local time, ringed by 24 hour marks.', cap: 'Visual only. It shows your device’s current time and nothing else.' },
  'atlas-ai': { scene: 'atlas', label: 'An abstract 3D network of layered nodes with pulses travelling between them.', cap: 'An illustration of a network, not Atlas-AI’s actual design.' },
};
const CALC_KEYS = [['C', 'Clear', 'op'], ['(', 'Open bracket', 'op'], [')', 'Close bracket', 'op'], ['÷', 'Divide', 'op'], ['7'], ['8'], ['9'], ['×', 'Multiply', 'op'], ['4'], ['5'], ['6'], ['−', 'Minus', 'op'], ['1'], ['2'], ['3'], ['+', 'Plus', 'op'], ['0'], ['.', 'Point'], ['⌫', 'Backspace', 'op'], ['=', 'Equals', 'eq']];
const calcMarkup = (p) => `<div class="scene-wrap"><div class="calc3d" role="group" aria-label="Basic calculator demo">
  <div class="calc-screen"><div class="calc-expr">0</div><div class="calc-res" role="status"></div></div>
  <div class="calc-keys">${CALC_KEYS.map(([k, l, c]) => `<button type="button" data-k="${k}"${l ? ` aria-label="${l}"` : ''}${c ? ` class="${c}"` : ''}>${k}</button>`).join('')}</div>
</div><p class="calc-note">A basic calculator for this page. It also works with your keyboard. The real Omar Calc solves equations and shows the working.</p></div>`;
const sceneMarkup = (sc) => `<div class="scene-wrap"><figure class="stage"><canvas data-scene="${sc.scene}" role="img" aria-label="${esc(sc.label)}"></canvas><figcaption class="stage-cap">${esc(sc.cap)}</figcaption></figure>${sc.ctl ? `<div class="stage-ctl">${sc.ctl}</div>` : ''}</div>`;

// ---------- Original launcher artwork for the external games (decorative; not screenshots, not the games' own assets) ----------
const chessSVG = (() => {
  const P = (c, r) => { const f = r / 8, w = 5.4 + f * 5.2; return [80 + (c - 4) * w, 12 + 66 * f]; };
  let sq = '', pcs = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const a = P(c, r), b = P(c + 1, r), d = P(c + 1, r + 1), e = P(c, r + 1); sq += `<path d="M${a.map((v) => v.toFixed(1)).join(' ')}L${b.map((v) => v.toFixed(1)).join(' ')}L${d.map((v) => v.toFixed(1)).join(' ')}L${e.map((v) => v.toFixed(1)).join(' ')}Z" ${(r + c) % 2 ? 'fill="#0b1830"' : 'class="a" fill="currentColor" fill-opacity=".28"'} stroke-opacity=".25" stroke-width=".6"/>`; }
  const pawn = (c, r, k = 1) => { const [x, y] = P(c + 0.5, r + 0.6), s = (0.6 + r / 12) * k; return `<g class="art-float"><ellipse cx="${x.toFixed(1)}" cy="${(y + 2 * s).toFixed(1)}" rx="${(5 * s).toFixed(1)}" ry="${(1.8 * s).toFixed(1)}" fill="#e8eef7" fill-opacity=".9" stroke="none"/><path d="M${(x - 3.2 * s).toFixed(1)} ${(y + 2 * s).toFixed(1)}L${(x - 1.4 * s).toFixed(1)} ${(y - 4 * s).toFixed(1)}H${(x + 1.4 * s).toFixed(1)}L${(x + 3.2 * s).toFixed(1)} ${(y + 2 * s).toFixed(1)}Z" fill="#e8eef7" fill-opacity=".9" stroke="none"/><circle cx="${x.toFixed(1)}" cy="${(y - 6 * s).toFixed(1)}" r="${(2.6 * s).toFixed(1)}" fill="#e8eef7" fill-opacity=".95" stroke="none"/></g>`; };
  pcs = pawn(2, 4) + pawn(4, 5) + pawn(6, 4) + `<g class="a"><circle cx="${P(3.5, 3.6)[0].toFixed(1)}" cy="${(P(3.5, 3.6)[1] - 7).toFixed(1)}" r="3" fill="currentColor" stroke="none"/><path d="M${(P(3.5, 3.6)[0] - 3).toFixed(1)} ${(P(3.5, 3.6)[1] + 1).toFixed(1)}L${(P(3.5, 3.6)[0] - 1).toFixed(1)} ${(P(3.5, 3.6)[1] - 5).toFixed(1)}H${(P(3.5, 3.6)[0] + 1).toFixed(1)}L${(P(3.5, 3.6)[0] + 3).toFixed(1)} ${(P(3.5, 3.6)[1] + 1).toFixed(1)}Z" fill="currentColor" stroke="none"/></g>`;
  return A(sq + pcs, '0 0 160 90');
})();
const tunnelSVG = (() => {
  let r = ''; for (let i = 0; i < 7; i++) { const s = 1 - i * 0.135, w = 150 * s, h = 80 * s; r += `<rect class="${i % 2 ? '' : 'a'}" x="${(80 - w / 2).toFixed(1)}" y="${(45 - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(3 * s).toFixed(1)}" stroke-opacity="${(0.25 + i * 0.1).toFixed(2)}"/>`; }
  let l = ''; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; l += `<path d="M${(80 + Math.cos(a) * 10).toFixed(1)} ${(45 + Math.sin(a) * 6).toFixed(1)}L${(80 + Math.cos(a) * 90).toFixed(1)} ${(45 + Math.sin(a) * 54).toFixed(1)}" stroke-opacity=".3"/>`; }
  return A(`<g class="art-line">${l}</g>${r}<path class="a art-pulse" d="M74 62l6-14 6 14-6-4z" fill="currentColor" stroke="none"/>`, '0 0 160 90');
})();
const hazardSVG = (() => {
  const H = [[22, 14], [48, 30], [70, 10], [96, 26], [126, 12], [140, 36], [34, 52], [108, 48], [58, 62], [128, 62], [14, 70]]; let h = '';
  H.forEach(([x, y], i) => { h += i % 3 === 0 ? `<rect class="art-float" x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1.5" fill="#0b1830" stroke-opacity=".7"/>` : `<circle class="art-pulse" cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="currentColor" fill-opacity=".5" stroke="none"/>`; });
  return A(`${h}<path class="a art-float" d="M80 58l9 18H71z" fill="currentColor" stroke="none"/><path d="M80 20v30" class="art-line" stroke-opacity=".3"/>`, '0 0 160 90');
})();
const EXTART = {
  click: A('<circle cx="80" cy="45" r="40" stroke-opacity=".18"/><circle cx="80" cy="45" r="32" stroke-opacity=".35"/><circle cx="80" cy="45" r="24" fill="#0b1830"/><circle class="a art-pulse" cx="80" cy="45" r="16" fill="currentColor" fill-opacity=".9" stroke="none"/><path d="M104 20l4-9M112 28l8-5M110 40l9 1" stroke-opacity=".6"/><path d="M60 64l-6 9" stroke-opacity=".6"/>', '0 0 160 90'),
  tiles: A('<g font-family="Bricolage Grotesque, sans-serif" font-weight="700" text-anchor="middle" stroke="none"><g><rect x="30" y="58" width="26" height="26" rx="5" fill="#0b1830" stroke="currentColor" stroke-opacity=".5"/><text x="43" y="76" font-size="14" fill="#e8eef7">2</text></g><g><rect x="60" y="58" width="26" height="26" rx="5" fill="#0b1830" stroke="currentColor" stroke-opacity=".5"/><text x="73" y="76" font-size="14" fill="#e8eef7">4</text></g><g><rect x="90" y="58" width="26" height="26" rx="5" fill="#0b1830" stroke="currentColor" stroke-opacity=".5"/><text x="103" y="76" font-size="14" fill="#e8eef7">4</text></g><g class="art-float"><rect class="a" x="48" y="28" width="26" height="26" rx="5" fill="currentColor" fill-opacity=".85"/><text x="61" y="46" font-size="14" fill="#06101c">8</text></g><g class="art-float"><rect x="116" y="12" width="26" height="26" rx="5" fill="#0d1d38" stroke="currentColor"/><text x="129" y="30" font-size="12" fill="#e8eef7">16</text></g></g><path class="art-line" d="M73 4v18" stroke-opacity=".5"/>', '0 0 160 90'),
  tunnel: tunnelSVG, hazards: hazardSVG, chess: chessSVG,
  sky: A('<rect x="0" y="0" width="160" height="90" fill="#0d2a55" fill-opacity=".55" stroke="none"/><path d="M14 22q6-8 14-3q6-6 13 2" stroke-opacity=".4"/><path d="M110 16q6-8 14-3q6-6 13 2" stroke-opacity=".4"/><g><rect x="92" y="0" width="20" height="30" rx="2" fill="#0b1830" stroke-opacity=".7"/><rect x="88" y="26" width="28" height="9" rx="2" fill="#0b1830" stroke-opacity=".7"/><rect x="88" y="58" width="28" height="9" rx="2" fill="#0b1830" stroke-opacity=".7"/><rect x="92" y="64" width="20" height="26" rx="2" fill="#0b1830" stroke-opacity=".7"/></g><g class="art-float"><circle class="a" cx="46" cy="46" r="9" fill="currentColor" fill-opacity=".9" stroke="none"/><circle cx="49" cy="43" r="2" fill="#06101c" stroke="none"/><path d="M54 47l7 2-7 3z" fill="#e8eef7" stroke="none"/><path d="M38 48q4 6 10 2" stroke="#06101c" stroke-opacity=".6"/></g>', '0 0 160 90'),
  dodge: A('<g class="art-dodge"><rect class="a" x="52" y="32" width="56" height="26" rx="13" fill="currentColor" fill-opacity=".9" stroke="none"/><text x="80" y="49" text-anchor="middle" font-size="11" font-weight="700" fill="#06101c" stroke="none" font-family="Hanken Grotesk, sans-serif">CLICK</text></g><path class="art-line" d="M20 80Q40 70 58 62" stroke-opacity=".6"/><path d="M58 62l9 3-4 3 4 6-3 2-4-6-4 3z" fill="#e8eef7" stroke="none"/>', '0 0 160 90'),
  quiz: A('<rect x="44" y="16" width="76" height="52" rx="8" fill="#0b1830" stroke-opacity=".3" transform="rotate(-8 80 45)"/><rect x="40" y="14" width="76" height="52" rx="8" fill="#0b1830" stroke-opacity=".5" transform="rotate(-3 80 45)"/><g class="art-float"><rect x="42" y="12" width="76" height="52" rx="8" fill="#0d1d38"/><text x="80" y="50" text-anchor="middle" font-size="34" font-weight="700" class="a" fill="currentColor" stroke="none" font-family="Bricolage Grotesque, sans-serif">?</text></g><g class="art-line" stroke-opacity=".35"><path d="M122 20l22-8M122 62l24 10M40 40L14 40"/></g><circle class="a art-pulse" cx="146" cy="11" r="3.2" fill="currentColor"/><circle class="a art-pulse" cx="148" cy="73" r="3.2" fill="currentColor"/><circle class="a art-pulse" cx="12" cy="40" r="3.2" fill="currentColor"/>', '0 0 160 90'),
};
const INTART = {
  tennis: A('<ellipse cx="56" cy="46" rx="18" ry="22" transform="rotate(-25 56 46)" fill="#0b1830"/><path d="M42 36q14 10 28 8M40 50q14 8 28 6" stroke-opacity=".45" transform="rotate(-25 56 46) translate(2 -2)"/><path d="M68 66l16 18" stroke-width="3"/><g class="art-ball"><circle class="a" cx="112" cy="40" r="9" fill="currentColor" fill-opacity=".9" stroke="none"/><path d="M104 36q8 4 16 0" stroke="#06101c" stroke-opacity=".5"/></g><path d="M20 82h120" stroke-opacity=".35"/>', '0 0 160 90'),
  swimming: A('<path class="art-wave" d="M0 44q10-9 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke-opacity=".6"/><path class="art-wave2" d="M0 58q10-9 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke-opacity=".4"/><path class="art-wave" d="M0 72q10-9 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke-opacity=".25"/><g class="a" fill="currentColor" stroke="none">' + [0, 1, 2, 3, 4].map((i) => `<path d="M${40 + i * 20} 10l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9z"/>`).join('') + '</g>', '0 0 160 90'),
  building: A('<rect x="26" y="14" width="108" height="62" rx="6" fill="#0b1830"/><path d="M26 28h108" stroke-opacity=".5"/><circle cx="35" cy="21" r="1.8" fill="currentColor" stroke="none"/><circle cx="42" cy="21" r="1.8" fill="currentColor" stroke="none"/><path class="a" d="M52 44l-9 8 9 8M108 44l9 8-9 8" stroke-width="2.4"/><path class="a art-pulse" d="M86 38l-10 28" stroke-width="2.4"/>', '0 0 160 90'),
  games: EXTART.tiles,
  maths: A('<rect x="48" y="8" width="64" height="74" rx="9" fill="#0b1830"/><rect x="55" y="15" width="50" height="16" rx="4" stroke-opacity=".55"/><path class="a" d="M60 23h18M88 20v6M85 23h6" stroke-width="2.2"/>' + [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${55 + c * 17}" y="${38 + r * 14}" width="14" height="10" rx="2.5" stroke-opacity=".6"/>`)).join(''), '0 0 160 90'),
};

// Shared interactive 'constellation' (About + Learning). Falls back to a plain chip list on small screens and without JS.
const constMarkup = (nodes, core) => {
  const all = [core, ...nodes], pos = all.map((n) => [parseFloat(n.x) * 8, parseFloat(n.y) * 4.5]);
  return `<div class="const"><div class="const-plane"><svg viewBox="0 0 800 450" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.2" class="const-lines">${all.slice(1).map((n, i) => `<path d="M${pos[i + 1][0]} ${pos[i + 1][1]}L${pos[0][0]} ${pos[0][1]}" stroke-opacity=".35"/>`).join('')}</svg><ul>${all.map((n, i) => `<li><button type="button" class="cn${i ? '' : ' cn-core'}${n.cls ? ' ' + n.cls : ''}" data-x="${n.x}" data-y="${n.y}" data-z="${n.z}" data-text="${esc(n.text)}" aria-pressed="false">${esc(n.short || n.name)}</button></li>`).join('')}</ul></div></div>`;
};

const projHref = (p) => `/projects/${p.slug}/`;
const siteData = {
  host: 'www.omarhosny.work.gd', email: SITE.email,
  projects: PROJECTS.map((p) => ({ name: p.name, slug: p.slug, href: projHref(p), summary: p.summary || '', statusLabel: p.statusLabel, pending: !!p.pending, lines: (p.features || []).filter((f) => f.length > 20).slice(0, 3) })),
  socials: SOCIALS.map((s) => ({ name: s.name, handle: s.handle, url: s.url })),
  about: ['Born in Alexandria, Egypt.', 'Builds websites and software.', `Certificates: ${ABOUT.certificates.join(', ')}.`, `Sports: ${ABOUT.sports.join(', ')}.`],
  games: ['Reaction test', 'Target hunt', 'Memory grid', 'Avoid', 'Logic challenge'],
  extGames: EXTERNAL_GAMES.map((g) => ({ id: g.id, name: g.name, url: g.url, host: hostOf(g.url), category: g.quiz ? 'Quiz project' : g.category, summary: g.summary, shows: g.shows, siteTitle: g.siteTitle, quiz: !!g.quiz, visual: g.visual })),
  interests: ['Tennis', 'Swimming (5 stars)', 'Building websites and software', 'Making games', 'Maths'],
  learning: ['Certificates: Cambridge Lower Secondary, Cambridge Primary, UCMAS', 'Swift and SwiftUI (WeLock)', 'Websites and web apps', 'Maths (Omar Calc)', 'Study planning (Day Frame)', 'Omar Quiz'],
  lab: ['Particle playground', 'Gravity playground', 'Colour lab', 'Pointer physics', '3D playground'],
};

function card(p) {
  const art = ART[p.slug] || '';
  return `<li><a class="card tilt rv${p.pending ? ' card-pending' : ''}" href="${projHref(p)}">
  <div class="card-art">${art}</div>
  <div class="card-body"><span class="card-name">${esc(p.name)}</span><span class="card-sum">${esc(p.summary || '')}</span><span class="row-status">${dot(p.status || 'none')}${esc(p.statusLabel)}</span></div>
</a></li>`;
}
const tile = (href, name, text, key) => `<li><a class="tile tilt rv" href="${href}"><span><span class="card-name">${name}</span><span class="card-sum">${text}</span></span>${TILE[key]}</a></li>`;

// ---------- Home ----------
page('/', {
  title: 'Omar Hosny — Websites, software and projects',
  description: 'The personal website of Omar Hosny: websites and software he has built, including Omar Calc, Day Frame, WeLock, TerraView and Atlas-AI, plus an arcade and a lab to play in.',
  section: 'home',
  body: `
<section class="hero3 wrap">
  <div class="intro">
    <h1>Omar Hosny</h1>
    <p class="lede">I build websites and software. This is where the projects live, and a few things to play with.</p>
    <div class="actions"><a class="btn btn-primary" href="/projects/">Explore projects</a><a class="btn" href="/arcade/">Enter Arcade</a><a class="btn" href="/about/">About Omar</a></div>
    <p class="hero-hint">The core is made of my projects. Drag it, click it, or click a project name to open it.</p>
  </div>
  <figure class="stage stage-bare hero-visual"><canvas data-scene="hero" role="img" aria-label="Interactive 3D model: a glowing core with the projects orbiting it. Drag to spin it. Click a project name to open that project. All projects are also listed below."></canvas></figure>
</section>
<section class="section wrap" aria-labelledby="work-h">
  <div class="section-head"><h2 id="work-h">Projects</h2><p>Live websites, apps and work in progress.</p></div>
  <ul class="cards">${LIVE.filter((p) => p.featured).map(card).join('')}</ul>
  <p class="more-link"><a href="/projects/">All ${LIVE.length} projects</a></p>
</section>
<section class="section wrap" aria-labelledby="play-h">
  <div class="section-head"><h2 id="play-h">Play</h2><p>Real games and small experiments. Nothing is tracked and scores stay on your device.</p></div>
  <ul class="playband">${tile('/arcade/', 'Arcade', 'Five games to play here, and eight more I have built on their own sites.', 'arcade')}${tile('/lab/', 'Lab', 'Particles, gravity, colours, spring physics and a 3D object to rotate.', 'lab')}${tile('/random/', 'Random', 'A random project, challenge, colour or site mode.', 'random')}</ul>
</section>
<section class="section wrap" aria-labelledby="more-h">
  <div class="section-head"><h2 id="more-h">Elsewhere on this site</h2></div>
  <ul class="link-list">
    <li><a href="/interests/"><span class="li-name">Interests</span><span class="li-desc">Tennis, swimming, building, games and maths.</span>${chev}</a></li>
    <li><a href="/learning/"><span class="li-name">Learning</span><span class="li-desc">Certificates, and what I have built with them.</span>${chev}</a></li>
    <li><a href="/about/"><span class="li-name">About</span><span class="li-desc">Background, certificates and sports.</span>${chev}</a></li>
    <li><a href="/contact/"><span class="li-name">Contact</span><span class="li-desc">Email and social accounts.</span>${chev}</a></li>
  </ul>
</section>`,
});

// ---------- Projects index ----------
page('/projects/', {
  title: 'Projects — Omar Hosny',
  description: 'Websites and software by Omar Hosny: Omar Calc, OmniDesk, Day Frame, WeLock, TerraView and Atlas-AI, with OmarLink coming soon.',
  section: 'projects',
  crumbs: [['Projects', '/projects/']],
  schema: [{
    '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': abs('/projects/#page'), url: abs('/projects/'),
    name: 'Projects by Omar Hosny', isPartOf: { '@id': SITE_ID }, about: { '@id': PERSON_ID },
    mainEntity: { '@type': 'ItemList', itemListElement: LIVE.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/projects/${p.slug}/`), name: p.name })) },
  }],
  body: `
<header class="page-head wrap"><h1>Projects</h1><p class="lede">Things I have built, from live websites to a native Mac app. Each page has a small visual demo and a link to the real thing.</p></header>
<section class="wrap" aria-labelledby="available-h">
  <h2 class="sr-only" id="available-h">Available projects</h2>
  <ul class="cards">${LIVE.map(card).join('')}</ul>
</section>
<section class="section wrap" aria-labelledby="gq-h">
  <div class="section-head"><h2 id="gq-h">Games and quizzes</h2><p>Everything playable lives in the Game Archive. My quiz project is here too.</p></div>
  <ul class="cards">
    <li><a class="card tilt rv" href="/arcade/"><div class="card-art">${GAMEART.target}</div><div class="card-body"><span class="card-name">Game Archive</span><span class="card-sum">Five games on this site and eight on their own websites.</span><span class="row-status">${dot('live')}Live</span></div></a></li>
    <li><a class="card tilt rv" href="${esc(EXTERNAL_GAMES.find((g) => g.quiz).url)}" target="_blank" rel="noopener noreferrer"><div class="card-art">${EXTART.quiz}</div><div class="card-body"><span class="card-name">${esc(EXTERNAL_GAMES.find((g) => g.quiz).name)}</span><span class="card-sum">${esc(EXTERNAL_GAMES.find((g) => g.quiz).summary)}</span><span class="row-status">${dot('live')}Live, opens on its own site${ext}${NEWTAB}</span></div></a></li>
  </ul>
</section>
<section class="section wrap" aria-labelledby="soon-h">
  <div class="section-head"><h2 id="soon-h">Coming soon</h2><p>OmarLink does not have a public link yet.</p></div>
  <ul class="cards">${PENDING.map(card).join('')}</ul>
</section>`,
});

// ---------- Project pages ----------
const projectPage = (p, { live }) => {
  const external = live && p.url?.startsWith('http');
  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const sc = SCENES[p.slug], visual = p.slug === 'omar-calculator' ? calcMarkup(p) : sc ? sceneMarkup(sc) : '';
  const actions = live
    ? `<a class="btn btn-primary" href="${esc(p.url)}" rel="noopener noreferrer" target="_blank">${esc(p.urlLabel)}${ext}${NEWTAB}</a>${(p.links || []).map((l) => `<a class="btn" href="${esc(l.url)}" rel="noopener noreferrer" target="_blank">${esc(l.label)}${ext}${NEWTAB}</a>`).join('')}<a class="btn" href="/projects/">All projects</a>`
    : '<a class="btn" href="/projects/">All projects</a><a class="btn" href="/contact/">Contact Omar</a>';
  return `
<header class="detail-head wrap">
  <div>
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/projects/">Projects</a></li><li><span aria-current="page">${esc(p.name)}</span></li></ol></nav>
    <p class="row-status status-line">${dot(p.status || 'none')}${esc(p.statusLabel)}</p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(p.summary)}</p>
    <div class="actions">${actions}</div>
  </div>
  ${visual}
</header>
<div class="wrap cols">
  <div class="prose">
    <p>${esc(p.intro)}</p>
    ${live ? `<h2>What it does</h2>${list(p.features)}` : ''}
    ${live && p.limits.length ? `<h2>Good to know</h2>${list(p.limits)}` : ''}
    ${(p.notes || []).map((n) => `<p>${esc(n)}</p>`).join('')}
  </div>
  <aside aria-label="Project details"><dl class="facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></aside>
</div>`;
};
for (const p of LIVE) {
  const app = {
    '@context': 'https://schema.org', '@type': p.schema, '@id': abs(`/projects/${p.slug}/#app`), name: p.name,
    description: p.summary, url: p.url, applicationCategory: p.category,
    author: { '@id': PERSON_ID }, creator: { '@id': PERSON_ID },
    ...(p.os ? { operatingSystem: p.os } : { operatingSystem: 'Any (web browser)' }),
    mainEntityOfPage: abs(`/projects/${p.slug}/`),
  };
  page(`/projects/${p.slug}/`, {
    title: `${p.name} — ${p.kind} by Omar Hosny`,
    description: `${p.summary} ${p.name} is a ${p.kind.toLowerCase()} by Omar Hosny.`,
    section: 'projects',
    crumbs: [['Projects', '/projects/'], [p.name, `/projects/${p.slug}/`]],
    schema: [app],
    body: projectPage(p, { live: true }),
  });
}
for (const p of PENDING) {
  page(`/projects/${p.slug}/`, {
    title: `${p.name} — coming soon, by Omar Hosny`,
    description: `${p.name} by Omar Hosny links a phone and a Mac. It has no public release yet.`,
    section: 'projects',
    crumbs: [['Projects', '/projects/'], [p.name, `/projects/${p.slug}/`]],
    body: projectPage({ ...p, intro: p.intro, facts: p.facts }, { live: false }),
  });
}

// ---------- About ----------
const CN = [
  ['Omar', '50%', '50%', '40px', 'cn-core', 'Omar Hosny, born in Alexandria, Egypt. Builds websites and software.'],
  ['Omar Calc', '20%', '22%', '10px', 'cn-projects', PROJECTS[0].summary], ['Day Frame', '38%', '14%', '60px', 'cn-projects', PROJECTS[2].summary],
  ['WeLock', '78%', '20%', '20px', 'cn-projects', PROJECTS[3].summary.replace('\u00a0', ' ')], ['TerraView', '86%', '48%', '-20px', 'cn-projects', PROJECTS[4].summary],
  ['Atlas-AI', '70%', '78%', '30px', 'cn-projects', PROJECTS[5].summary], ['OmniDesk', '30%', '80%', '0px', 'cn-projects', PROJECTS[1].summary],
  ['Certificates', '10%', '52%', '-30px', '', `${ABOUT.certificates.join(', ')}.`], ['Sports', '60%', '90%', '-10px', '', `${ABOUT.sports.join(' and ')}.`],
];
const CLINES = [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0]];
const CPOS = CN.map((n) => [parseFloat(n[1]) * 8, parseFloat(n[2]) * 4.5]);
page('/about/', {
  title: 'About Omar Hosny',
  description: 'About Omar Hosny: born in Alexandria, Egypt, he builds websites and software, holds Cambridge and UCMAS certificates, and plays tennis and swims.',
  section: 'about',
  crumbs: [['About', '/about/']],
  schema: [{
    '@context': 'https://schema.org', '@type': 'AboutPage', '@id': abs('/about/#page'), url: abs('/about/'),
    name: 'About Omar Hosny', isPartOf: { '@id': SITE_ID }, about: { '@id': PERSON_ID }, mainEntity: { '@id': PERSON_ID },
  }],
  body: `
<header class="page-head wrap"><h1>About</h1><p class="lede">I build websites and software, and I play tennis and swim.</p></header>
<section class="wrap" aria-labelledby="map-h">
  <h2 class="sr-only" id="map-h">Map of Omar’s work and background</h2>
  <p class="hint">Hover, tap or focus a node to read about it. The same facts are listed below.</p>
  ${constMarkup(CN.slice(1).map(([name, x, y, z, cls, text]) => ({ name, x, y, z, cls, text })), { name: CN[0][0], x: CN[0][1], y: CN[0][2], z: CN[0][3], text: CN[0][5] })}
  <p id="const-detail" aria-live="polite">${esc(CN[0][5])}</p>
</section>
<div class="wrap cols">
  <div class="prose">
    <p>I’m Omar Hosny. I was born in Alexandria, Egypt, and I build websites and software: calculators, a personal workspace, a Mac app and a chat assistant. Each project page links to the live website or the source.</p>
    <h2>Certificates</h2>
    <p>I hold Cambridge Lower Secondary and Cambridge Primary certificates, and a UCMAS certificate.</p>
    <h2>Sports</h2>
    <p>Away from the screen I play tennis and swim. In swimming I have achieved 5 stars.</p>
    <h2>Projects</h2>
    <p>Start with <a href="/projects/omar-calculator/">Omar Calc</a>, <a href="/projects/day-frame/">Day Frame</a> or <a href="/projects/welock/">WeLock</a>, or browse <a href="/projects/">all projects</a>. To get in touch, see the <a href="/contact/">contact page</a>. There is also an <a href="/arcade/">arcade</a> and a <a href="/lab/">lab</a> on this site.</p>
  </div>
  <aside aria-label="Details"><dl class="facts">
    <div><dt>Full name</dt><dd>${esc(ABOUT.fullName)}</dd></div>
    <div><dt>Born in</dt><dd>${esc(ABOUT.birthplace)}</dd></div>
    <div><dt>Certificates</dt><dd>${ABOUT.certificates.map(esc).join('<br>')}</dd></div>
    <div><dt>Sports</dt><dd>${ABOUT.sports.map(esc).join('<br>')}</dd></div>
  </dl></aside>
</div>`,
});

// ---------- Contact ----------
const hubNodes = ['Email', ...SOCIALS.map((s) => s.name)];
page('/contact/', {
  title: 'Contact Omar Hosny',
  description: 'Contact Omar Hosny by email, and find his accounts on Instagram, TikTok, X, Snapchat, Threads, Facebook and WhatsApp.',
  section: 'contact',
  crumbs: [['Contact', '/contact/']],
  schema: [{
    '@context': 'https://schema.org', '@type': 'ContactPage', '@id': abs('/contact/#page'), url: abs('/contact/'),
    name: 'Contact Omar Hosny', isPartOf: { '@id': SITE_ID }, about: { '@id': PERSON_ID },
  }],
  body: `
<header class="page-head wrap"><h1>Contact</h1><p class="lede">Email is the best way to reach me. You can also find me on social media.</p></header>
<div class="wrap"><div class="hub" aria-hidden="true">
  <svg viewBox="0 0 800 280" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4">
    <g class="layer">${hubNodes.map((n, i) => { const a = (i / hubNodes.length) * Math.PI * 2 - Math.PI / 2, x = 400 + Math.cos(a) * 270, y = 140 + Math.sin(a) * 100; return `<path class="flow" d="M400 140L${x.toFixed(0)} ${y.toFixed(0)}" stroke-opacity=".45"/>`; }).join('')}</g>
    ${hubNodes.map((n, i) => { const a = (i / hubNodes.length) * Math.PI * 2 - Math.PI / 2, x = 400 + Math.cos(a) * 270, y = 140 + Math.sin(a) * 100, d = 8 + (i % 3) * 10; return `<g class="layer" data-d="${d}"><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="5" fill="currentColor"/><text x="${x.toFixed(0)}" y="${(y + (y > 140 ? 24 : -14)).toFixed(0)}" text-anchor="middle" fill="#e8eef7" stroke="none" font-size="15" font-family="Hanken Grotesk, sans-serif">${esc(n)}</text></g>`; }).join('')}
    <circle cx="400" cy="140" r="26" fill="#0b1830"/><circle cx="400" cy="140" r="9" fill="currentColor"/>
  </svg>
</div></div>
<section class="wrap section" aria-labelledby="email-h">
  <h2 id="email-h" class="sr-only">Email</h2>
  <ul class="link-list"><li><a href="mailto:${SITE.email}"><span class="li-name">Send email</span><span class="li-desc">${SITE.email}</span>${chev}</a></li></ul>
</section>
<section class="wrap section" aria-labelledby="social-h">
  <div class="section-head"><h2 id="social-h">Social accounts</h2></div>
  <ul class="link-list">${SOCIALS.map((s) => `<li><a href="${esc(s.url)}" rel="me noopener noreferrer" target="_blank"><span class="li-name">${esc(s.name)}</span><span class="li-desc">${esc(s.handle)}<span class="sr-only"> ${esc(s.name)} profile (opens in a new tab)</span></span>${ext.replace('class="ext"', 'class="chev"')}</a></li>`).join('')}</ul>
</section>`,
});

// ---------- Arcade / Omar Game Archive ----------
const GAMES5 = [['reaction', 'Reaction test', 'How fast can you react?'], ['target', 'Target hunt', 'Thirty seconds of shrinking targets.'], ['memory', 'Memory grid', 'Repeat the pattern. Levels get longer.'], ['avoid', 'Avoid', 'Dodge the blocks coming down the track.'], ['logic', 'Logic challenge', 'Ten generated puzzles against the clock.']];
const bestLine = { reaction: ['Best', 'reaction'], target: ['Best score', 'target'], memory: ['Best score', 'memory'], avoid: ['Best score', 'avoid'], logic: ['Best score', 'logic'] };
const playLink = (g, cls = 'btn btn-primary') => `<a class="${cls}" href="${esc(g.url)}" target="_blank" rel="noopener noreferrer">Play ${esc(g.name)}${ext}${NEWTAB}</a>`;
const extCard = (g) => `<li${g.quiz ? ' class="ext-wide"' : ''}><article class="card tilt ext-card${g.quiz ? ' ext-quiz' : ''} rv" data-ext-game="${g.id}" aria-labelledby="eg-${g.id}">
  <div class="card-art" aria-hidden="true">${EXTART[g.visual] || ''}</div>
  <div class="card-body"><span class="chip">${g.quiz ? 'Quiz project' : esc(g.category)}</span><h3 class="card-name" id="eg-${g.id}">${esc(g.name)}</h3><p class="card-sum">${esc(g.summary)}</p><p class="ext-host"><span class="sr-only">Hosted at </span>${esc(hostOf(g.url))}</p>
  <div class="ext-actions">${playLink(g)}<button type="button" class="btn details" aria-haspopup="dialog" aria-label="Details: ${esc(g.name)}">Details</button></div></div>
</article></li>`;
page('/arcade/', {
  title: 'Arcade and Game Archive — Omar Hosny',
  description: 'Omar Hosny’s Game Archive: five games to play on this site, plus Omar Click, 2048 Omar, Neon Rush, Survival Dodging, Chess Omar, Flappy Bird Omar, Click the Button and Omar Quiz.',
  section: 'arcade',
  crumbs: [['Arcade', '/arcade/']],
  body: `
<header class="page-head wrap"><h1>Arcade</h1><p class="lede">The Omar Game Archive: five games to play right here, and eight more I have built that live on their own sites.</p>
  <nav aria-label="On this page" class="jump"><a href="#play-here">Play here</a><a href="#more-games">More Omar games</a><a href="#local-scores">Local scores</a></nav></header>
<section class="wrap" aria-labelledby="pick-h">
  <div class="section-head"><h2 id="pick-h">Play here</h2><p>Five games built into this site. Scores are saved only in this browser.</p></div>
  <span id="play-here" class="anchor"></span>
  <ul class="game-cards">${GAMES5.map(([id, n, d]) => `<li><button type="button" class="card tilt game-card rv" data-game="${id}" aria-pressed="false"><span class="card-art">${GAMEART[id]}</span><span class="card-body"><span class="card-name">${n}</span><span class="card-sum">${d}</span><span class="game-best"><span>${bestLine[id][0]}</span><b data-best="${bestLine[id][1]}">—</b></span></span></button></li>`).join('')}</ul>
  <div id="game-stage" hidden aria-live="off"></div>
  <noscript><p class="hint">The games on this site need JavaScript.</p></noscript>
</section>
<section class="wrap section" aria-labelledby="more-h2">
  <span id="more-games" class="anchor"></span>
  <div class="section-head"><h2 id="more-h2">More Omar games</h2><p>Eight projects I made earlier. Each one opens on its own website in a new tab. They are not hosted here, and each site has its own rules for any data it keeps.</p></div>
  <ul class="cards ext-grid">${EXTERNAL_GAMES.filter((g) => g.quiz).map(extCard).join('')}${EXTERNAL_GAMES.filter((g) => !g.quiz).map(extCard).join('')}</ul>
</section>
<section class="wrap section" aria-labelledby="scores-h">
  <span id="local-scores" class="anchor"></span>
  <div class="scoreboard"><h2 id="scores-h">Local scores</h2>
    <dl><div><dt>Reaction best</dt><dd data-best="reaction">—</dd></div><div><dt>Reaction average (last 10)</dt><dd data-best="reaction-avg">—</dd></div><div><dt>Target hunt best</dt><dd data-best="target">—</dd></div><div><dt>Memory grid best</dt><dd data-best="memory">—</dd></div><div><dt>Avoid best</dt><dd data-best="avoid">—</dd></div><div><dt>Logic best</dt><dd data-best="logic">—</dd></div></dl>
    <p class="hint">These are the five games on this site. They are stored in your browser’s local storage on this device and nothing is sent anywhere. The eight games above keep their own scores, if any, on their own sites.</p>
    <div class="actions"><button type="button" class="btn" id="reset-scores">Reset scores</button></div>
  </div>
</section>`,
});

// ---------- Interests ----------
const INTERESTS = [
  { id: 'tennis', name: 'Tennis', art: 'tennis', text: 'A sport I play.', links: [['/about/', 'See it on About']] },
  { id: 'swimming', name: 'Swimming', art: 'swimming', text: 'I swim, and I have achieved 5 stars in it.', links: [['/about/', 'See it on About']] },
  { id: 'building', name: 'Building', art: 'building', text: 'Websites and software: a calculator, a browser desktop, a personal workspace, a Mac app, an Earth explorer and a chat assistant.', links: [['/projects/', 'Browse projects']] },
  { id: 'games', name: 'Games', art: 'games', text: 'I make games. Five run on this site and eight more live on their own websites, including a chess game and a quiz.', links: [['/arcade/', 'Open the Arcade']] },
  { id: 'maths', name: 'Maths', art: 'maths', text: 'I built Omar Calc to solve everyday maths, linear equations and quadratic equations and to show the working. I also hold a UCMAS certificate.', links: [['/projects/omar-calculator/', 'See Omar Calc'], ['/about/', 'Certificates on About']] },
];
page('/interests/', {
  title: 'Interests — Omar Hosny',
  description: 'Omar Hosny’s interests as they show up on this site: tennis, swimming, building websites and software, making games, and maths.',
  section: 'interests',
  crumbs: [['Interests', '/interests/']],
  body: `
<header class="page-head wrap"><h1>Interests</h1><p class="lede">Sport, building, games and maths. These are the things that show up in my projects and on my About page.</p></header>
<section class="wrap" aria-labelledby="orbit-h"><h2 class="sr-only" id="orbit-h">Interactive orbit of my interests</h2>
  <figure class="stage orbit"><canvas data-scene="interests" role="img" aria-label="An interactive 3D orbit of five interests: Tennis, Swimming, Building, Games and Maths. Click a name to jump to its card. The same cards are listed below."></canvas><figcaption class="stage-cap">Drag to spin. Click a name to jump to it.</figcaption></figure>
</section>
<section class="wrap section" aria-labelledby="cards-h"><h2 class="sr-only" id="cards-h">The five interests</h2>
  <ul class="cards int-grid">${INTERESTS.map((i) => `<li id="${i.id}"><article class="card tilt int-card rv" aria-labelledby="ih-${i.id}"><div class="card-art" aria-hidden="true">${INTART[i.art]}</div><div class="card-body"><h3 class="card-name" id="ih-${i.id}" tabindex="-1">${i.name}</h3><p class="card-sum">${i.text}</p><p class="int-links">${i.links.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</p></div></article></li>`).join('')}</ul>
</section>
<section class="wrap section" aria-labelledby="int-next"><div class="section-head"><h2 id="int-next">Related</h2></div>
  <ul class="link-list"><li><a href="/learning/"><span class="li-name">Learning</span><span class="li-desc">Certificates, and what I have built with what I know.</span>${chev}</a></li><li><a href="/arcade/"><span class="li-name">Arcade</span><span class="li-desc">Play the games.</span>${chev}</a></li></ul>
</section>`,
});

// ---------- Learning ----------
const LEARN = [
  { id: 'certs', name: 'Certificates', short: 'Certificates', x: '16%', y: '30%', z: '30px', text: 'Cambridge Lower Secondary, Cambridge Primary and UCMAS.', body: 'Three certificates I hold: Cambridge Lower Secondary, Cambridge Primary and UCMAS.', links: [['/about/', 'Listed on About']] },
  { id: 'swift', name: 'Swift and SwiftUI', short: 'Swift', x: '82%', y: '26%', z: '20px', text: 'I wrote WeLock, a macOS app, in Swift and SwiftUI.', body: 'WeLock is a native macOS app written in Swift and SwiftUI. It protects chosen apps with Touch ID or your Mac login password.', links: [['/projects/welock/', 'See WeLock']] },
  { id: 'web', name: 'Websites', short: 'Websites', x: '80%', y: '74%', z: '-20px', text: 'Five websites and web apps, from a calculator to a chat assistant.', body: 'Omar Calc, OmniDesk, Day Frame, TerraView and Atlas-AI are websites or web apps I built. They open in your browser.', links: [['/projects/', 'Browse projects']] },
  { id: 'maths', name: 'Maths', short: 'Maths', x: '18%', y: '74%', z: '40px', text: 'Omar Calc solves everyday maths, linear equations and quadratic equations, and shows the working.', body: 'Omar Calc solves everyday maths, linear equations and quadratic equations, and shows the working behind each answer.', links: [['/projects/omar-calculator/', 'See Omar Calc']] },
  { id: 'study', name: 'Planning study', short: 'Study', x: '50%', y: '12%', z: '50px', text: 'Day Frame sorts a day’s tasks into Study, Projects and Life.', body: 'Day Frame is a personal workspace with tasks, a focus timer and notes. Its tasks are sorted into Study, Projects and Life.', links: [['/projects/day-frame/', 'See Day Frame']] },
  { id: 'quiz', name: 'Omar Quiz', short: 'Quiz', x: '50%', y: '88%', z: '10px', text: 'A quiz project: Omar’s Ultimate Quiz.', body: 'Omar’s Ultimate Quiz is a quiz project I made. It has a Quiz Finished screen with a Restart Quiz button. It opens on its own website.', quiz: true },
];
const quizG = EXTERNAL_GAMES.find((g) => g.quiz);
page('/learning/', {
  title: 'Learning — Omar Hosny',
  description: 'What Omar Hosny has learned and built with it: Cambridge and UCMAS certificates, Swift and SwiftUI, websites, maths tools, study planning and a quiz project.',
  section: 'learning',
  crumbs: [['Learning', '/learning/']],
  body: `
<header class="page-head wrap"><h1>Learning</h1><p class="lede">Certificates I hold, and the things I have built with what I know. Each point links to something you can open.</p></header>
<section class="wrap" aria-labelledby="map-h2"><h2 class="sr-only" id="map-h2">Map of what I am learning</h2>
  <p class="hint">Hover, tap or focus a node to read about it. The same points are listed below.</p>
  ${constMarkup(LEARN, { name: 'Omar', short: 'Learning', x: '50%', y: '50%', z: '40px', text: 'Learning, in a map: certificates I hold, and projects where I use what I know.' })}
  <p id="const-detail" aria-live="polite">Learning, in a map: certificates I hold, and projects where I use what I know.</p>
</section>
<section class="wrap section" aria-labelledby="det-h"><div class="section-head"><h2 id="det-h">The details</h2><p>Open a section to read more.</p></div>
  <div class="learn-list">${LEARN.map((l) => `<details class="learn tilt rv" id="l-${l.id}"><summary><span class="learn-name">${esc(l.name)}</span><span class="learn-sum">${esc(l.text)}</span></summary><div class="learn-body"><p>${esc(l.body)}</p>${l.quiz ? `<p>${playLink(quizG, 'btn')} <a href="/arcade/#more-games">See it in the Game Archive</a></p>` : `<p>${(l.links || []).map(([h, t]) => `<a href="${h}">${esc(t)}</a>`).join(' · ')}</p>`}</div></details>`).join('')}</div>
</section>`,
});

// ---------- Lab ----------
const rng = (id, label, min, max, val, step = 1) => `<div class="ctl"><label for="${id}">${label} <output data-for="${id}">${val}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
const sel = (id, label, opts) => `<div class="ctl"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`;
page('/lab/', {
  title: 'Lab — Omar Hosny',
  description: 'Interactive experiments by Omar Hosny: a particle playground, gravity, colour generator, pointer physics and a 3D object you can rotate and light.',
  section: 'lab',
  crumbs: [['Lab', '/lab/']],
  body: `
<header class="page-head wrap"><h1>Lab</h1><p class="lede">Small experiments. Poke them. Nothing here saves or sends anything.</p></header>
<div class="wrap lab-grid">
<section class="lab-card" aria-labelledby="l3d"><h2 id="l3d">3D playground</h2><p>Drag the object to rotate it. Change the light, perspective and environment.</p>
  <div class="lab-split"><figure class="stage"><canvas data-scene="playground" role="img" aria-label="An interactive 3D object. Drag to rotate it. Use the controls beside it to change shape, lighting, perspective, environment and wireframe."></canvas></figure>
  <div class="ctls" id="pg-controls">${sel('pg-obj', 'Object', [['torus', 'Torus'], ['cube', 'Cube'], ['icosahedron', 'Icosahedron'], ['sphere', 'Sphere']])}${sel('pg-env', 'Environment', [['midnight', 'Midnight'], ['dawn', 'Dawn'], ['forest', 'Forest'], ['mono', 'Mono']])}${rng('pg-light', 'Light angle', 0, 360, 45)}${rng('pg-persp', 'Camera distance', 3, 12, 6, 0.5)}<div class="ctl-check"><input type="checkbox" id="pg-wire"><label for="pg-wire">Wireframe</label></div><div class="ctl-row"><button type="button" class="btn" id="pg-reset">Reset</button></div></div></div></section>
<section class="lab-card" aria-labelledby="lp"><h2 id="lp">Particle playground</h2><p>Particles link up when they are close. Move the pointer over the canvas to attract them.</p>
  <div class="lab-split"><canvas class="lab-canvas" id="pp-canvas" role="img" aria-label="Particle simulation. Move the pointer over it to attract particles."></canvas>
  <div class="ctls">${rng('pp-count', 'Particles', 10, 200, 90)}${rng('pp-speed', 'Speed', 0.2, 3, 1, 0.1)}${rng('pp-attr', 'Attraction', 0, 2, 0.6, 0.1)}${rng('pp-dist', 'Connection distance', 40, 200, 110)}<div class="ctl-row"><button type="button" class="btn" id="pp-toggle" aria-pressed="false">Pause</button><button type="button" class="btn" id="pp-reset">Reset</button></div></div></div></section>
<section class="lab-card" aria-labelledby="lg"><h2 id="lg">Gravity playground</h2><p>Click or tap the canvas to drop an object, or press Enter on it. Change the direction and strength of gravity.</p>
  <div class="lab-split"><canvas class="lab-canvas" id="gv-canvas" tabindex="0" role="img" aria-label="Gravity sandbox. Click to drop objects. Press Enter to drop one from the top."></canvas>
  <div class="ctls">${rng('gv-g', 'Gravity', 0, 30, 12)}${sel('gv-dir', 'Direction', [['down', 'Down'], ['up', 'Up'], ['left', 'Left'], ['right', 'Right']])}${sel('gv-shape', 'Shape', [['ball', 'Ball'], ['box', 'Box']])}<div class="ctl-row"><button type="button" class="btn" id="gv-add">Drop 5</button><button type="button" class="btn" id="gv-toggle" aria-pressed="false">Pause</button><button type="button" class="btn" id="gv-reset">Reset</button></div><p class="hint" id="gv-count" role="status">0 objects</p></div></div></section>
<section class="lab-card" aria-labelledby="lc"><h2 id="lc">Colour lab</h2><p>Generate a palette. Copy any value as HEX, RGB or HSL.</p>
  <div class="ctl-row">${sel('cl-mode', 'Palette type', [['random', 'Random'], ['analogous', 'Analogous'], ['complementary', 'Complementary'], ['triad', 'Triad']])}<button type="button" class="btn" id="cl-gen">Generate</button></div><ul class="swatches" id="cl-swatches"></ul></section>
<section class="lab-card" aria-labelledby="lpt"><h2 id="lpt">Pointer physics</h2><p>The solid ball follows your pointer on a spring. The ring follows with easing. The line shows velocity. With the keyboard, focus the canvas and use the arrow keys.</p>
  <div class="lab-split"><canvas class="lab-canvas" id="pt-canvas" tabindex="0" role="img" aria-label="Pointer physics demo. Move the pointer over it, or use the arrow keys."></canvas>
  <div class="ctls">${rng('pt-k', 'Spring stiffness', 20, 400, 160)}${rng('pt-d', 'Damping', 2, 40, 12)}${rng('pt-e', 'Easing', 0.02, 0.4, 0.12, 0.01)}<dl class="read"><div><dt>X</dt><dd id="pt-x">0</dd></div><div><dt>Y</dt><dd id="pt-y">0</dd></div><div><dt>Pointer speed</dt><dd id="pt-v">0 px/s</dd></div><div><dt>Spring speed</dt><dd id="pt-s">0 px/s</dd></div></dl></div></div></section>
</div>`,
});

// ---------- Random ----------
const RC = [['project', 'Random project', 'Pick one of Omar’s projects.'], ['challenge', 'Random challenge', 'A goal for the Arcade or Lab.'], ['colour', 'Random colour', 'HEX, RGB and HSL.'], ['ui', 'Random site mode', 'Switches the accent colour theme.'], ['interaction', 'Random interaction', 'A thing to try on this site.'], ['build', 'What should I build next?', 'An idea generator, not a plan.'], ['line', 'Random line', 'A line from the project pages.'], ['game', 'Random game', 'One of the thirteen games in the Game Archive.']];
page('/random/', {
  title: 'Random — Omar Hosny',
  description: 'A page of random things made on your device: a project, a challenge, a colour, a site theme and an idea of what to build next.',
  section: 'random',
  crumbs: [['Random', '/random/']],
  body: `
<header class="page-head wrap"><h1>Random</h1><p class="lede">Press a button. Everything is generated on your device from what is already on this site.</p></header>
<section class="wrap" aria-labelledby="rg-h"><h2 class="sr-only" id="rg-h">Generators</h2>
  <div class="rnd-grid">${RC.map(([id, t, d]) => `<div class="rnd-card tilt rv"><h3>${t}</h3><p class="card-sum">${d}</p><output id="o-${id}" aria-live="polite">Press the button.</output><button type="button" class="btn" data-gen="${id}" data-out="o-${id}">${id === 'build' ? 'Give me an idea' : 'Generate'}</button></div>`).join('')}</div>
  <p class="hint" id="secrets-found"></p>
  <noscript><p class="hint">These generators need JavaScript.</p></noscript>
</section>`,
});

// ---------- Legal pages ----------
const doc = (title, lede, inner) => `
<header class="page-head wrap"><h1>${title}</h1><p class="lede">${lede}</p></header>
<div class="wrap section"><div class="prose doc">${inner}</div></div>`;
const MAIL = `<a href="mailto:${SITE.email}">${SITE.email}</a>`;

page('/privacy/', {
  title: 'Privacy Policy — Omar Hosny',
  description: 'How omarhosny.work.gd handles information: no accounts, forms, analytics, advertising or cookies.',
  crumbs: [['Privacy Policy', '/privacy/']],
  body: doc('Privacy Policy', `Last updated ${POLICY_DATE}.`, `
<p>This is a personal portfolio website run by Omar Hosny. It is not run by a company. For any privacy question, email ${MAIL}.</p>
<h2>The short version</h2>
<p>This site has no accounts, forms, comments, analytics, advertising or tracking, and it sets no cookies. Some pages run small scripts that are served from this site itself, for the 3D visuals, the arcade games and the lab. They send nothing anywhere. I do not collect personal information through the site itself.</p>
<h2>Information I receive</h2>
<ul>
<li><strong>Email you send me.</strong> If you email ${MAIL}, I receive your email address, your name if you include it, and whatever you write. I use it to read and reply. Your email is handled by the email service that provides that address. I keep a message only as long as it is useful for replying, then delete it.</li>
<li><strong>Nothing else.</strong> There is no contact form, newsletter, sign-up or comment box.</li>
</ul>
<h2>Hosting and server data</h2>
<p>The site is hosted on Cloudflare Pages. When you open a page, your browser asks Cloudflare’s servers for it. To deliver the site and keep it secure, Cloudflare processes technical data such as your IP address, the page requested, your browser type and the time. Cloudflare is a global network, so this can happen in countries other than yours. I do not use this data to identify visitors, and I have not turned on any analytics for this site. Cloudflare publishes its own <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener noreferrer" target="_blank">privacy policy${ext}${NEWTAB}</a>.</p>
<h2>Cookies and local storage</h2>
<p>This site sets no cookies. It does use your browser’s local storage, on your device only, to remember your best arcade scores and a few preferences (theme, reduced motion, and any secrets you have found). I cannot see this data and it is never sent anywhere. The Arcade has a Reset scores button, and you can clear it any time by clearing site data in your browser. See the <a href="/cookies/">Cookies page</a> for details.</p>
<h2>Third-party services</h2>
<p>The pages load nothing from other companies: the fonts, styles, scripts and images are served from this site’s own domain. There are no embedded videos, maps, social buttons or advertising.</p>
<h2>External links</h2>
<p>This site links to my project and game websites, to the source code of WeLock on GitHub, and to my social media profiles. Once you follow a link, that service collects information under its own policy, and I do not control it. The project websites are hosted on other platforms, such as Vercel, and each may handle data differently from this site.</p>
<h2>Security</h2>
<p>The site is static, so there is no database, login or form to attack. It is served over HTTPS and sends security headers that limit what a page can load or do.</p>
<h2>Your rights</h2>
<p>Depending on where you live, laws such as Egypt’s Personal Data Protection Law (Law No. 151 of 2020) or the EU’s GDPR may give you rights to access, correct or delete personal data held about you, or to object to its use. The only personal data I am likely to hold is an email you sent me. To ask about it or have it deleted, write to ${MAIL}. You can also contact the data protection authority in your country.</p>
<h2>Changes</h2>
<p>If this site starts collecting anything new, I will update this page first and change the date at the top.</p>`),
});

page('/terms/', {
  title: 'Terms — Omar Hosny',
  description: 'Terms for using omarhosny.work.gd: acceptable use, ownership, project information, external links and liability.',
  crumbs: [['Terms', '/terms/']],
  body: doc('Terms', `Last updated ${POLICY_DATE}.`, `
<p>These terms cover your use of this personal portfolio website, run by Omar Hosny. By using the site you agree to them. If you do not agree, please do not use it.</p>
<h2>Acceptable use</h2>
<p>You may browse and link to the site. Please do not try to break, overload or gain unauthorised access to it, scrape it at a rate that disrupts it, use it to break the law, or pretend to be me.</p>
<h2>Ownership</h2>
<p>The text, design and original code of this site belong to Omar Hosny, all rights reserved, unless a page says otherwise. Please ask before copying them.</p>
<p>Some material belongs to others. The fonts Bricolage Grotesque and Hanken Grotesk are used under the SIL Open Font License 1.1 (<a href="/fonts/LICENSE-bricolage-grotesque.txt">Bricolage Grotesque licence</a>, <a href="/fonts/LICENSE-hanken-grotesk.txt">Hanken Grotesk licence</a>). Apple, macOS and Touch&nbsp;ID are trademarks of Apple Inc. Other product names belong to their owners, and I am not affiliated with them. WeLock is not affiliated with MakLock.</p>
<h2>Projects and software</h2>
<p>The pages describe my projects as I understand them on the date shown on each page. A project’s own website or repository is the authority on what it does, how to install it and the licence or terms that apply to it. Some projects are in development and may change or stop working. Software is provided as is, without any promise that it suits your purpose.</p>
<h2>External links</h2>
<p>Links to other websites are for your convenience. I do not control those sites and am not responsible for their content, availability or privacy practices.</p>
<h2>Availability</h2>
<p>I try to keep the site working but do not promise it will always be available, error-free or up to date.</p>
<h2>Liability</h2>
<p>To the extent the law allows, I am not liable for any loss or damage from using this site or relying on its information. Nothing here limits any right or liability that cannot legally be limited.</p>
<h2>Changes</h2>
<p>I may change the site or these terms. The date at the top shows the latest update, and continuing to use the site means you accept the current terms.</p>
<h2>Contact</h2>
<p>Questions about these terms: ${MAIL}. See also the <a href="/privacy/">Privacy Policy</a> and <a href="/cookies/">Cookies page</a>.</p>`),
});

page('/cookies/', {
  title: 'Cookies — Omar Hosny',
  description: 'This site sets no cookies and has no trackers. It stores only game scores and preferences in your own browser, so there is no cookie banner.',
  crumbs: [['Cookies', '/cookies/']],
  body: doc('Cookies', `Last updated ${POLICY_DATE}.`, `
<p>This site does not use cookies, and it has no tracking, so there is no cookie banner to accept. It does keep a few things in your browser’s local storage, described below.</p>
<h2>What was checked</h2>
<ul>
<li>Cookies: none set by this site.</li>
<li>Local storage: one entry named <code>oh:v1</code>, used only for your best arcade scores, your last ten reaction times, theme and motion preferences, and which Easter eggs you found. It stays on your device, is never sent to a server, and is only needed for those features. Use Reset scores in the Arcade, or clear site data in your browser, to remove it. Session storage: not used.</li>
<li>Analytics, advertising, tracking pixels and fingerprinting: none.</li>
<li>Embedded third-party content such as videos, maps or social widgets: none.</li>
<li>Third-party scripts, fonts or images: none. Every file, including the site’s own scripts, loads from this site’s own domain.</li>
</ul>
<h2>Hosting</h2>
<p>The site is hosted on Cloudflare Pages. I have not turned on any Cloudflare feature that sets cookies. If that changes, this page and the <a href="/privacy/">Privacy Policy</a> will be updated first, and a consent choice added if the law requires one.</p>
<h2>Other websites</h2>
<p>Links to my project sites and social profiles leave this site. Those sites may set cookies or store data in your browser under their own policies. For example, Omar Calc and Day Frame say they keep your data in your own browser.</p>
<h2>Questions</h2>
<p>Email ${MAIL}.</p>`),
});

// ---------- 404 ----------
page('/404.html', {
  title: 'Page not found — Omar Hosny',
  description: 'This page does not exist.',
  noindex: true,
  body: `<div class="wrap nf section"><div><h1>Page not found</h1><p class="lede">That address does not lead anywhere. The page you wanted does not exist, or it moved.</p><div class="actions"><a class="btn btn-primary" href="/">Return home</a><a class="btn" href="/projects/">Projects</a><a class="btn" href="/arcade/">Arcade</a><a class="btn" href="/random/">Random</a></div><p class="hint">The broken portal follows your pointer. Click it to repair it.</p></div><figure class="stage"><canvas data-scene="portal" role="img" aria-label="A broken ring portal showing 404. Click it to repair it. Decorative."></canvas></figure></div>`,
});

// ---------- Layout ----------
function layout(p) {
  const url = abs(p.path === '/404.html' ? '/' : p.path);
  const ogImage = abs('/og.png');
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', '@id': PERSON_ID, name: SITE.name, url: abs('/'),
    email: SITE.email, mainEntityOfPage: { '@id': SITE_ID },
    sameAs: SOCIALS.filter((x) => !x.noSameAs).map((x) => x.url),
    owns: LIVE.map((x) => ({ '@id': abs(`/projects/${x.slug}/#app`) })),
  };
  const website = {
    '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE_ID, url: abs('/'), name: SITE.name,
    description: SITE.tagline, inLanguage: 'en', author: { '@id': PERSON_ID }, publisher: { '@id': PERSON_ID },
  };
  const crumbs = p.crumbs.length ? {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'], ...p.crumbs].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  } : null;
  const graph = [...(p.path === '/' ? [person, website] : []), ...p.schema, ...(crumbs ? [crumbs] : [])];
  const nav = NAV.map(([href, label]) => `<li><a href="${href}"${p.section && href === `/${p.section}/` ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? 'noindex' : 'index,follow,max-image-preview:large'}">
<meta name="theme-color" content="#050a13">
<meta name="color-scheme" content="dark">
<meta name="author" content="${SITE.name}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/hanken-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">\n<link rel="modulepreload" href="/js/core.js">
<meta property="og:type" content="${p.path === '/' ? 'website' : 'article'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Omar Hosny — websites, software and projects">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${ogImage}">
${graph.length ? `<script type="application/ld+json">${JSON.stringify(graph.length === 1 ? graph[0] : graph)}</script>` : ''}
</head>
<body data-page="${p.id}">
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header"><div class="wrap bar">
  <a class="brand" href="/" translate="no">Omar Hosny</a>
  <button type="button" class="menu-btn" aria-expanded="false" aria-controls="main-nav">Menu</button>
  <nav aria-label="Main" id="main-nav"><ul class="nav-list">${nav}</ul></nav>
</div></header>
<main id="main">${p.body}</main>
<div id="live" class="sr-only" role="status" aria-live="polite"></div>
<footer class="site-footer">
  <div class="wrap foot">
    <div><p translate="no"><strong>Omar Hosny</strong></p><p>Websites, software and projects.</p><p class="foot-note">Press <kbd class="term-key">&#96;</kbd> for a terminal. There are a few other secrets.</p></div>
    <nav aria-labelledby="f-site"><h2 id="f-site">Site</h2><ul><li><a href="/">Home</a></li><li><a href="/projects/">Projects</a></li><li><a href="/interests/">Interests</a></li><li><a href="/learning/">Learning</a></li><li><a href="/arcade/">Arcade</a></li><li><a href="/lab/">Lab</a></li><li><a href="/random/">Random</a></li><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li></ul></nav>
    <nav aria-labelledby="f-proj"><h2 id="f-proj">Projects</h2><ul>${LIVE.map((x) => `<li><a href="/projects/${x.slug}/">${esc(x.name)}</a></li>`).join('')}<li><a href="/projects/omarlink/">OmarLink (soon)</a></li></ul></nav>
    <div><h2>Email</h2><ul><li><a href="mailto:${SITE.email}">${SITE.email}</a></li></ul></div>
  </div>
  <div class="wrap"><div class="legal"><span>© ${new Date().getFullYear()} Omar Hosny</span><nav aria-label="Legal"><ul><li><a href="/privacy/">Privacy Policy</a></li><li><a href="/terms/">Terms</a></li><li><a href="/cookies/">Cookies</a></li></ul></nav><span class="legal-tools"><button type="button" class="link-btn" id="motion-toggle" aria-pressed="false">Motion: full</button><button type="button" class="link-btn" data-open-terminal>Terminal</button></span></div></div>
</footer>
<script type="application/json" id="site-data">${JSON.stringify(siteData).replace(/</g, '\\u003c')}</script>
<script type="module" src="/js/core.js"></script>
</body>
</html>
`;
}

// ---------- Write ----------
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await cp('public', OUT, { recursive: true });
await writeFile(join(OUT, 'styles.css'), (await readFile('src/styles.css', 'utf8')) + '\n' + (await readFile('src/extra.css', 'utf8')));

for (const p of pages) {
  const file = p.path.endsWith('/') ? join(OUT, p.path, 'index.html') : join(OUT, p.path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, layout(p));
}

const today = new Date().toISOString().slice(0, 10);
const indexable = pages.filter((p) => !p.noindex);
await writeFile(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
await writeFile(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);

console.log(`Built ${pages.length} pages → ${OUT}/`);
