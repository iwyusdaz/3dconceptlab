# 3D ConceptLab – Blockers and owner actions

Status: **All owner actions resolved.** The project is live in production.

## OPEN

(none)

## RESOLVED

- **DeepSeek credentials provided (2026-11-09).** Owner added
  `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` (`deepseek-flash`) to `.env.local`;
  the agent added both to all Vercel environments. Live checks ran
  successfully against real DeepSeek:
  - Seasons concept → template match, DeepSeek-written content (4 calls).
  - Moon phases concept → composed spec, valid on 1st generation (2 calls),
    renders correctly (screenshot check).
  - Unsupported concept ("volcanoes") → correct "This concept isn't supported
    yet" message with a reason (1 call).
  - Daily counter recorded every call (Blob `development/usage/2026-11-09.json`).
- **Deployment protection scoped to previews only (2026-11-09).** Changed via
  the Vercel API at the owner's request: production deployments are now
  publicly reachable without login; preview deployments keep SSO protection.
- **Production deployment released (2026-11-09)** with owner approval
  ("go ahead until all finished and working well"): `vercel deploy --prod`.
  Live generate → save → public share link verified end-to-end on production.
- **Vercel git connect worked** at Task 1 (no GitHub-app permission problem),
  but was deliberately disconnected later (see history below).
- **Blob storage live checks ran** during Task 7 (contract tests against the
  real private store under a `test/` prefix, cleaned up afterwards).
- **LIVE_AI_ACCESS_CODE** was generated during Task 1; on 2026-11-09 the
  owner re-confirmed it. Note: it was printed to the terminal while
  debugging env-file quoting — the owner may rotate it by editing
  `.env.local` and re-running `vercel env add LIVE_AI_ACCESS_CODE
  <value> production -y --force` (plus preview/development).

## History

- Git auto-deploy to the production target was disconnected deliberately
  during the build (pushes to `main` were auto-deploying to Production,
  which the plan forbids before owner approval). It can be re-enabled with
  `vercel git connect` now that the owner has approved release.
