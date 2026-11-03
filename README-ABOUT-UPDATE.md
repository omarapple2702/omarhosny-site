# About page refinement: build and audit (macOS)

This ZIP is the full site project with the About page refinement and the Home teaser fix applied on top of your existing uncommitted work. It includes your `.git` folder exactly as it was. Nothing is committed, pushed or deployed.

## What changed (this round and the previous one)
- `build.mjs`: About copy and map nodes (Certificates and Sports removed), new biography, "Born in" row removed, Home About teaser now "Background, software and projects."
- `public/js/pages.js`: one line so the line to the selected map node lights up.
- `src/extra.css`: an appended block of About-only blue + orange styles (scoped to `body[data-page="about"]`).
- Left alone: Interests, Learning, and the certificates/sports data in `src/data.mjs`.

## Requirements
Node 18 or newer (check with `node --version`). Install with Homebrew if needed: `brew install node`.

## Build and preview
```bash
cd omarhosny-site
npm run build      # generates dist/ (no dependencies needed)
npm run dev        # builds, then serves http://localhost:4173
```
Open http://localhost:4173/about/ and http://localhost:4173/ to review.

## Audit (axe-core, keyboard, reflow, links)
Terminal 1:
```bash
cd omarhosny-site
npm install
npx playwright install chromium
npm run dev
```
Terminal 2 (leave Terminal 1 running):
```bash
cd omarhosny-site
node qa/audit.mjs
```
Optional HTML validation:
```bash
npx html-validate -c qa/html-validate.json "dist/**/*.html"
```

## Notes
- `node_modules/`, `.wrangler/`, `.DS_Store` and `qa/shots/` are not included. They are recreated or not needed.
- `dist/` is included and was built from these sources. `npm run build` regenerates it.
- axe-core could not be run in the environment that made these changes, so please run the audit above before any deploy.
