// Tiny static preview server for dist/ (mimics Cloudflare Pages: /about/ → about/index.html, 404.html fallback)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
const ROOT = 'dist', PORT = Number(process.env.PORT || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
// Parse dist/_headers so the preview sends the same headers as production.
const rules = []; { let cur = null;
  for (const line of (await readFile(join(ROOT, '_headers'), 'utf8').catch(() => '')).split('\n')) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) { cur = { pat: line.trim(), h: {} }; rules.push(cur); }
    else { const i = line.indexOf(':'); cur.h[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  } }
const match = (pat, p) => new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(p);
createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, p);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch {}
  try {
    const data = await readFile(file);
    const hd = {}; for (const r of rules) if (match(r.pat, p)) Object.assign(hd, r.h);
    res.writeHead(200, { ...hd, 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(data);
  } catch {
    const data = await readFile(join(ROOT, '404.html'));
    const hd = {}; for (const r of rules) if (r.pat === '/*') Object.assign(hd, r.h);
    res.writeHead(404, { ...hd, 'Content-Type': TYPES['.html'] }); res.end(data);
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
