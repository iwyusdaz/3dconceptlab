# ConceptLab – Progress

One row per task. Status, commands run, test results, commit hash.

| Task | Status | Checks run | Results | Commit |
|---|---|---|---|---|
| 1. Scaffold, GitHub repo, Vercel project, Blob store, CI | in progress | `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e` | 11 unit tests pass; lint clean; typecheck clean; 2 Playwright smoke tests pass (home page + canvas render + secret-leak check) | (pending) |
| 2. Scene spec schema, validator, formula name list | not started | | | |
| 3. Formula library | not started | | | |
| 4. Viewer + composed scene renderer | not started | | | |
| 5. Seasons template | not started | | | |
| 6. AI pipeline + daily cap | not started | | | |
| 7. Create page, saving, share links | not started | | | |
| 8. Demo page, landing page, README | not started | | | |
| 9A. Polish, a11y, perf, review prep | not started | | | |

## Notes

- Next.js 16 removed `next lint`; the lint script uses ESLint 9 flat config
  (`eslint src e2e`) with `eslint-config-next` 16's native flat configs.
- Playwright E2E runs the app itself via `webServer` in fixture mode with
  dummy credentials; it also checks the dummy secrets never appear in page
  HTML (bundle-leak check for the config helper).
