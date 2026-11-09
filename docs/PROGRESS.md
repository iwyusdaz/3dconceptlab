# ConceptLab – Progress

One row per task. Status, commands run, test results, commit hash.

| Task | Status | Checks run | Results | Commit |
|---|---|---|---|---|
| 1. Scaffold, GitHub repo, Vercel project, Blob store, CI | done | `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`; `gh repo create iwyusdaz/conceptlab --public --source . --push`; `vercel project add conceptlab`, `vercel link --yes --project conceptlab`, `vercel git connect`, `vercel blob create-store conceptlab-store --access private --yes`, `vercel env add` (LIVE_AI_ACCESS_CODE, AI_DAILY_CAP, FIXTURE_MODE preview=true/production=false), `vercel env pull .env.development.local`, `vercel deploy` | 11 unit tests pass; lint clean; typecheck clean; 2 Playwright smoke tests pass (home page + canvas render + secret-leak check). CI green on main. Repo: https://github.com/iwyusdaz/conceptlab. Blob store `conceptlab-store` (private) connected in all environments. Preview URL Ready. Note: git auto-deploy later disconnected on purpose (see BLOCKERS #3). | befe8f4 |
| 2. Scene spec schema, validator, formula name list | done | unit tests (15 validator tests), E2E `/dev/validate` (2) | Valid fixtures pass; 8 broken fixtures each fail with a readable error path; `/dev/validate` shows errors for pasted JSON. | e62034e |
| 3. Formula library | done | 17 formula unit tests; `/dev/validate` sample-outputs table (E2E) | Equinox daylight 12 h at all latitudes; noon altitude ≈62° at 51.5°N on June solstice; 80°N → 24 h / 0 h at solstices; distance ≈147.1M km (early Jan) / ≈152.1M km (early Jul); illuminated fraction 0/0.5/1; tilt 0 → constant daylight. | f854dee |
| 4. Viewer + composed scene renderer | done | binding/readout unit tests (9); E2E viewer tests (3, incl. slider→readout and bindings→mesh-position assertions) | `/preview/fixture/moon-phases` shows the correct lit half as the slider moves (visually verified: full moon at 180° is opposite the Sun and fully lit); aria-valuetext with units; time-lapse + Not-to-scale badges. | 00e16bc |
| 5. Seasons template | done | template registry + readout unit tests (6); E2E (2) | Registry entry passes the schema; tilt 0 → daylight constant across orbit (E2E); distance smallest in January; Blue Marble texture; starfield without twinkle; ground view inset. | 1e43a79 (+0995f98 E2E flake fix) |
| 6. AI pipeline + daily cap | done | 15 pipeline unit tests with fake client; storage tests (8, incl. concurrent counter updates and ETag conflict/retry); E2E API tests (3) | Unsupported / template / compose / retry-then-succeed / fail-after-2-retries all verified; empty & cut-off replies are validation failures; fixture routing per plan; access code required (401); daily cap enforced before each call and counter updated after (in-memory + local + live-Blob). | 4bd43e3 |
| 7. Create page, saving and share links | done | 85 unit tests incl. Blob contract tests against the real store (test/ prefix + cleanup); E2E (2): full create→edit→save→share-in-new-context flow, not-found page | Saved Moon phases experience opens from its share link in another browser context locally AND on the Vercel preview (verified with the automation bypass: saved to Blob `preview/` prefix, share page loads server-side). Share IDs: 12 URL-safe chars; invalid/unknown → not-found. | 0230300 |
| 8. Demo page, landing page, README | done | E2E (2): /demo renders both experiences, intercepts and asserts ZERO /api/* calls; all links internal and working | `/demo` works with no env keys and makes no AI/storage calls. README covers setup, env vars, Modes table, storage design, architecture, accuracy, DeepSeek note, asset licences. | 578aa0e |
| 9A. Polish, a11y, perf, review prep | done | lint/typecheck/85 unit/23 E2E (incl. 7 axe checks); Lighthouse; in-app fps meter measurements; contact sheet | axe: no serious/critical violations on all pages. Lighthouse (landing, prod build): Performance 94, Accessibility 100. Frame rate: both scenes ≥30 fps (60/43) even with NO GPU (SwiftShader software rendering) — see docs/review/FRAME-RATE.md. Labels only on hover/focus; text alternative for 3D; compressed texture (106 KB). Contact sheet + preview URL in docs/review/. Stopped for owner review as planned. | bcea4ec |
| 9B. After owner review | done | Owner approved ("go ahead until all finished and working well", 2026-11-09). Live DeepSeek checks; fix round: optional part `color`/`center` with renderer defaults, validation-failure logging, compose budget 4000→6000 tokens; all 85 unit + 23 E2E re-run green; CI green | Live verified: Seasons → template (4 calls), Moon phases → composed, valid + renders (2 calls), volcanoes → "not supported" with reason (1 call), usage counter in Blob records every call. Production deployed (`vercel deploy --prod`); live generate → save → **public share link verified on production** (https://conceptlab-iwyusds-projects.vercel.app/e/sZCGbB_CAVQD). Production URL recorded in README. | 83a50a6 (+f1088a0 cleanup) |

## Notes

- Next.js 16 removed `next lint`; the lint script uses ESLint 9 flat config
  with `eslint-config-next` 16's native flat configs.
- Playwright E2E runs the app itself via a warmed `webServer` script
  (`scripts/e2e-server.sh`) in fixture mode with a test-only access code; a
  self-verifying `setRange` helper avoids hydration races on range inputs.
- Live checks that ran: Blob storage contract tests against the real private
  store (Task 7). Live checks NOT run: real DeepSeek generation (no
  credentials — BLOCKERS #1).
- Git auto-deploy to the production target was disconnected deliberately
  (BLOCKERS #3): pushes to `main` were creating production deployments, which
  the plan forbids before owner approval.
