# ConceptLab – Blockers and owner actions

Each entry lists what is blocked, why, and the exact owner action needed.

## OPEN

### 1. DeepSeek credentials missing
- **Blocked:** Live AI generation (Live mode) cannot run; the app runs in
  Fixture mode. Live checks against real DeepSeek cannot be performed.
- **Why:** `.env.local` does not contain `DEEPSEEK_API_KEY` or
  `DEEPSEEK_MODEL`; they had not been provided when Task 1 started.
- **Owner action:** add to `/Users/iwayanusada/conceptlab/.env.local`:
  - `DEEPSEEK_API_KEY=<a DeepSeek API key with credit>`
  - `DEEPSEEK_MODEL=<current model name, e.g. the one you intend to use>`
  Then re-run the Task 6 live checks after Task 6 is built.

## RESOLVED

(none yet)
