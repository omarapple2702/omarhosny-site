# omarhosny.work.gd

Static personal site for Omar Hosny. No framework, no dependencies, no build tooling beyond Node 18+.

## What is where
- `build.mjs` generates every page. `src/data.mjs` holds project data. `src/styles.css` is the original base; `src/extra.css` is the interaction layer. Both are bundled into `dist/styles.css`.
- `public/js/` holds the site scripts (ES modules, same-origin only, no libraries): `gfx.js` is a small Canvas 3D engine, `scenes.js` the 3D scenes (hero core, globe, lock, OmarLink, desk, Day Frame, network, 404 portal, Lab object, background), `arcade.js` the five games, `lab.js` the experiments, `pages.js` the Random, About, Contact and calculator behaviour, `core.js` the shared behaviour (menu, cursor, terminal, Easter eggs, motion switch).
- `src/games.mjs` is the single source for Omar's eight existing games (URL, category, description, visual, what each page shows). Cards, the details dialog, the terminal, Random and the audit all read from it, so a URL lives in exactly one place.
- `/interests/` and `/learning/` are built from the `INTERESTS` and `LEARN` arrays in `build.mjs`. Add an entry there and the cards, orbit, map and details all update.
- Pages: `/arcade/` (now the Game Archive), `/interests/`, `/learning/`, `/lab/`, `/random/` and `/projects/omarlink/` are new or expanded. Every original route and URL is unchanged.
- Pages work without JavaScript: all content is plain HTML. The 3D scenes, games and lab are enhancements.
- Secrets: the backtick key opens a terminal; the Konami code toggles scanline mode; clicking the logo five times switches theme.
- Local data: one `localStorage` key, `oh:v1`, holds best scores and preferences. Nothing leaves the device.

## Commands
- `npm run build`: generates `dist/`
- `npm run dev`: builds and previews at http://localhost:4173
- Edit content in `src/data.mjs` (projects, socials, games) and page copy in `build.mjs`. Styles are in `src/styles.css`.
- What still needs your input is listed in `PLACEHOLDERS.md`.

## Cloudflare Pages
Build command: `npm run build` · Output directory: `dist` · Node version: 18 or newer.
Headers are set in `public/_headers`.

### Connect the domain
1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git. Pick the repo and use the settings above.
3. After the first deploy: project → Custom domains → add `www.omarhosny.work.gd`.
4. `work.gd` is a free subdomain service. Cloudflare Pages asks for a CNAME record, so at the place where you manage `omarhosny.work.gd` add `www` → `<your-project>.pages.dev`. If that service cannot add records for `www`, tell Cloudflare's setup screen what it says and check the service's DNS options.
5. Remove or unpublish the old Google Sites page so the domain no longer points to it.

## Quality checks
- `npm run dev` previews `dist/` with the same headers as `public/_headers`, including the Content-Security-Policy.
- `qa/audit.mjs` runs axe-core (WCAG 2.2 AA), keyboard, reflow, cookie/storage, request-origin, link and copy checks. Setup instructions are at the top of the file. `qa/html-validate.json` is the HTML validator config (`npx html-validate -c qa/html-validate.json "dist/**/*.html"`).
- After deploying, open the live site, then DevTools → Application → Cookies, and confirm no cookies are set. If you ever turn on Cloudflare Web Analytics or add any script, update the Privacy and Cookies pages first.
