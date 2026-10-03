# Decisions and open items

## Needs your decision
1. **OmarLink**: no public link exists. It now has a "Coming soon" page with a concept visual. The idea of clipboard, files, screen and notifications moving between a phone and a Mac comes from your brief; please confirm that wording is accurate before it goes live, and edit the `omarlink` entry in `src/data.mjs` if not.
2. **Arcade**: the old games page was removed earlier because the games could not be copied. `/arcade/` is new and has five original, playable games. The old game names (Minesweeper, Tetris and so on) are not claimed anywhere.
3. **Full name and birthplace on the About page**: you supplied them, so they are shown. Exact date of birth and school name are deliberately not published. Think about whether the full four-part name and birthplace need to be public, ideally with a parent or guardian.
4. **Privacy statements to confirm are true for you**: you keep emails only as long as needed to reply and then delete them; you have not turned on Cloudflare Web Analytics; the contact address's email provider needs no extra mention.

## Still open from earlier
- TerraView and Atlas-AI use only the one-line description each site publishes. Send more detail and screenshots if you want fuller pages.
- WhatsApp link `https://wa.me/@omarhosny_222` is used exactly as supplied. Tap it on your phone to confirm it opens your chat.
- Social sites block automated checks, so those links were not opened by a machine.
- Trips and school photos were not moved across.

## Filled in
Social links, About details, all six project links, privacy/terms/cookies pages.


## Changed in the 3D upgrade
- **CSP**: one directive added, `script-src 'self'`. Before, `default-src 'none'` blocked all scripts. No inline scripts, no `unsafe-eval`, no remote hosts. Everything else is unchanged.
- **Privacy and Cookies pages** now say the site uses one local-storage entry for scores and preferences, and that some pages run same-origin scripts. Dates updated to 3 October 2026. Please re-read both before publishing.
- **Verified by script**: no console errors, no horizontal overflow at 1440, 390 and 320 px, games, score storage and reset, terminal, Easter egg, calculator, menu and reduced motion all pass. **Not run**: axe-core (not installable offline in the build environment). Run `qa/audit.mjs` locally per its header before deploying.
- **Not done**: no sound (left out on purpose); no real WebGL (the 3D is a small Canvas engine to keep the site dependency-free and CSP-tight); About has a relationship map but no dated timeline because no dates were supplied.

## Game Archive, Interests and Learning (round 3): please review
- **Interests and Learning use only facts already in the ZIP**: tennis, swimming (5 stars), the projects, Omar Calc's maths features, the Cambridge Lower Secondary / Cambridge Primary / UCMAS certificates, WeLock in Swift and SwiftUI, and Day Frame's Study / Projects / Life sorting. The ZIP contains nothing about other hobbies, school subjects or what you are studying right now, so none were added. These pages are short on purpose. To grow them, add entries to `INTERESTS` and `LEARN` in `build.mjs`.
- **Game descriptions only say what each page shows** (inspected 3 October 2026, text only):
  - *2048 Omar* is titled **2048 Drop**: you drop and merge tiles, you don't slide them. The card says so.
  - *Neon Rush* and *Survival Dodging Game* both have the generic page title "Mini Game"; I could only confirm a score, a Play / Play Again button and a Ready? screen, so the cards say no more than that. Send me a sentence about how each plays and I will add it.
  - *Omar Quiz* is titled **Omar's Ultimate Quiz**. I could only see its Quiz Finished screen and Restart Quiz button, so the site does not say what it asks about. Tell me the topics and I will add them (and a better Learning entry).
  - *Flappy Bird Omar*: only the sound button was visible.
- Visuals on the game cards are original illustrations, not screenshots and not the games' own artwork.
- Privacy and Terms now say the site links to "project and game websites". Those sites are separate and follow their own policies.
- axe-core still could not be installed in my build environment. I ran `qa/audit.mjs` with a temporary stand-in for axe only (everything else in the audit ran for real: keyboard, reflow at 5 sizes, links, copy scan, cookies, request origins) and checked colour contrast separately with my own script. Run the real axe pass locally before deploying.
- `qa/audit.mjs` changes: keyboard check now counts only rendered, tabbable controls (and `<summary>`), ignores links inside collapsed `<details>`, checks tab order and the mobile Menu; `#1` no longer matches hex colours; "coming soon" is allowed on the Projects index and the OmarLink page only; the audit also checks every game URL is linked from the Game Archive.
