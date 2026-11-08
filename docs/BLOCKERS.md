# ConceptLab – Blockers and owner actions

Each entry lists what is blocked, why, and the exact owner action needed.

## OPEN — owner actions needed before/ during Task 9 Part B

### 1. DeepSeek credentials missing
- **Blocked:** Live AI generation (Live mode) cannot run; the app runs in
  Fixture mode. Live checks against real DeepSeek have NOT been performed.
- **Why:** `.env.local` does not contain `DEEPSEEK_API_KEY` or
  `DEEPSEEK_MODEL`; they had not been provided when Task 1 started.
- **Owner action:** add to `/Users/iwayanusada/conceptlab/.env.local`:
  - `DEEPSEEK_API_KEY=<a DeepSeek API key with credit>`
  - `DEEPSEEK_MODEL=<the current model name>`
  Then set them on Vercel (`vercel env add DEEPSEEK_API_KEY production`, same
  for `DEEPSEEK_MODEL`), or ask the agent to do it, and re-run the Task 6
  live checks.

### 2. Deployment protection blocks public share links
- **Blocked:** students cannot open share links or `/demo` on Vercel URLs:
  all deployments (including production target) redirect to Vercel SSO login
  (`ssoProtection: all_except_custom_domains`, the account default).
- **Why:** the Vercel account's default deployment protection applies to
  every deployment.
- **Owner action:** in the Vercel dashboard (Settings → Deployment
  Protection), either disable protection or scope it to preview deployments
  only, so production serves the public. This should happen at Task 9
  Part B release time, after owner approval.

### 3. Production deployment deferred pending owner approval (by design)
- **Note (not a failure):** production deployments are intentionally not
  released. Git auto-deploy was disconnected (`vercel git disconnect`) after
  Task 1 because pushes to `main` were auto-deploying to the production
  target, which the plan forbids before owner approval. To re-enable after
  approval: `vercel git connect`, or deploy with `vercel deploy --prod`.
  All production-target deployments made so far are unreachable to the
  public (see blocker 2).

## RESOLVED

- **Vercel git connect worked** at Task 1 (no GitHub-app permission problem),
  but was deliberately disconnected later — see OPEN item 3.
- **Blob storage live checks ran successfully** during Task 7 (credentials
  pulled via `vercel env pull` were present, so the contract tests executed
  against the real private store under a `test/` prefix and cleaned up).
- **LIVE_AI_ACCESS_CODE** was generated and appended to `.env.local` during
  Task 1 (file did not exist yet; it was created, not overwritten).
