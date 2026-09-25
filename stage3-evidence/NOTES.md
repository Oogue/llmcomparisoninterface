# Stage 3 evidence — notes

## Gemini API key switched partway through (2026-09-25T05:08:30Z)

The first Google key (account A) exhausted the free tier's daily cap of **20 requests per day per model**
on `gemini-3.5-flash` and `gemini-2.5-flash` (429, `GenerateRequestsPerDayPerProjectPerModel-FreeTier`), so
30 sends could not reach either model in one day.

From 2026-09-25T05:08:30Z onward, Gemini requests use a **second key from a different Google account (account B)**.
Everything sent before that used account A. Export files do not record which key was used; use the file
timestamps (`timestamp` field) against the time above.

- Same models, same request code, same `temperature: 0` / `max_tokens: 7400` — only the credential (and so
  the quota pool) differs. Google's free tier does not change model behaviour by account.
- Not verified: whether account B's project has billing enabled. The Stage 2 run guide says to use a project
  **without** billing so every call stays on the documented free tier (selection rule R1). The key's
  model catalog lists all three Google finalists; billing status is not visible through the API.
- The previous key remains in `config.js` as `GEMINI_API_KEY_PREVIOUS` (gitignored) for use after its quota resets.

**Update:** exports written after this note's runner change carry `batch.geminiKeyAlias` — the `config.js` field
name (`GEMINI_API_KEY` = account B, `GEMINI_API_KEY_PREVIOUS` = account A) used for the Google models. The key
itself is never recorded. Exports written before that field existed are covered by the timestamp rule above.
