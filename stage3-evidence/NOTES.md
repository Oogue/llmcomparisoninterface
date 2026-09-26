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

## Machine sleep during the 2026-09-25 run (~13:04–15:25 UTC)

The Mac running the batch went to sleep mid-run. Timers stalled (a 49 s backoff took ~54 min; a send with a
180 s timeout ran ~53 min) and several requests failed with `fetch failed` or `Timed out after 180000ms`. These
failures came from the runner's machine, not from the providers, but they used up the 2-re-send allowance for
some responses (notably S3-P8-run1 and S3-P8-run2). Those failed attempts are kept as exported (they are the
record of what happened). The runner was restarted under `caffeinate` with `--retry-limit=5` so the affected
responses get fresh attempts; each new attempt is another `-retryN` file. An answer is only ever added where the
earlier attempts failed with an API/network error — a successful response is never replaced.

## Third Gemini key added (2026-09-26T01:24:21Z)

Accounts A and B had both used up the free tier's 20 requests/day on gemini-3.5-flash and gemini-2.5-flash,
so a third key from another Google account (account C, `config.js` field `GEMINI_API_KEY_3`) was used for the
remaining Gemini gaps. Exports from that pass carry `batch.geminiKeyAlias: "GEMINI_API_KEY_3"`. Same caveat as
before: whether account C's project has billing enabled is not visible through the API.

## Fourth Gemini key (2026-09-26T02:06:24Z)

Account C's key gets HTTP 404 on gemini-2.5-flash ("no longer available to new users"), and accounts A and B
were out of daily quota, so the last gemini-2.5-flash gaps were filled with a fourth key (account D,
`config.js` field `GEMINI_API_KEY_4`; a one-off test call on gemini-2.5-flash returned 200 first). Exports from
that pass carry `batch.geminiKeyAlias: "GEMINI_API_KEY_4"`. Billing status of account D is not visible through the API.

## Final state of the 120-response run (2026-09-26)

- 120 of 120 responses present and usable (verified directly against the export files: one per prompt × run ×
  model; identical system prompt in every export; each user prompt matches its S3 prompt ID;
  `temperature: 0`, `max_tokens: 7400`, no provider JSON mode; no excluded model appears).
- 65 succeeded on the first pass; 55 were recovered by re-sends (`-retry` … `-retry10` files); none unresolved.
- Failed attempts stay in the export files as the record of what happened; a re-send only ever fills in a response
  that had failed with an API/network error.
- Causes of the re-sends: Gemma 4 26B 180 s timeouts, transient `fetch failed` / 503 errors, Google's 20/day free-tier
  cap on gemini-3.5-flash and gemini-2.5-flash (worked around with extra keys, above), and the machine sleeping.
- `batch-console.log` is the raw console output of every batch pass, in order.

## Rating sheets

`rating/` holds the blind sheets for the four raters (Allen, Nian, Lui, Emman) — same rows, same order for all;
seeds 20260926 (Sheet A, 120 responses) and 20260927 (Sheet B, 40 prompt × model groups). `rating/keys/` (which model
wrote what) is git-ignored until all eight sheets are in; then remove that line from `.gitignore` and commit it
with the results. Do not regenerate the sheets once rating has started.
