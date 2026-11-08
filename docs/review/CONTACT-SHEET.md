# ConceptLab — owner review contact sheet (Task 9 Part A)

Generated 2026-11-09. Screenshots taken from the production build
(`next build` + `next start`), fixture mode, Chromium at 1280×900.

| Page | Screenshot |
|---|---|
| Landing page `/` (Lighthouse: Performance 94, Accessibility 100) | [01-landing.png](./01-landing.png) |
| `/demo` — both bundled experiences | [02-demo.png](./02-demo.png) |
| `/create` — concept + access code form | [03-create.png](./03-create.png) |
| Share page `/e/qaNNVrkb7rQZ` — saved Moon phases experience | [04-share.png](./04-share.png) |
| Seasons template preview (ground-view inset) | [05-seasons.png](./05-seasons.png) |

## Live preview URL

- **Preview deployment (Task 9A polish included):** https://conceptlab-ozxpw4c1w-iwyusds-projects.vercel.app

Note: Vercel **deployment protection (SSO) is enabled** on this project's deployments
(owner account default), so preview/production URLs require the owner's Vercel login.
Share links for students must be publicly reachable — the owner should switch deployment
protection to "Preview deployments only" (or off for production) as part of Task 9
Part B / release. See `docs/BLOCKERS.md`.

## Checks behind this contact sheet

- Lint, typecheck, 85 unit tests, 23 Playwright E2E (incl. axe checks on every page)
  pass locally and in CI on `main`.
- Lighthouse (landing page, production build): **Performance 94 / Accessibility 100**
  (targets 90+ / 95+).
- axe: no serious or critical violations on `/`, `/demo`, `/create`, `/dev/validate`,
  both preview scenes, and a share page.
- Frame rate: see [FRAME-RATE.md](./FRAME-RATE.md) (no GPU available in this
  environment — software rendering; both scenes ≥ 30 fps regardless).
