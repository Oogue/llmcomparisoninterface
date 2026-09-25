## Current status: Stage 3 formal evaluation (4 finalists)

Stage 2 is complete: **4 of the 7 Stage 1 candidates passed** and move on to formal evaluation
(manuscript §5.3). The grid now shows only those four; everything below this section is the
Stage 1 / Stage 2 history and is left as it was written.

| Model | Stage 1 score | Route |
|---|---:|---|
| Gemini 3.5 Flash | 168.5 | Google (free tier) |
| Gemma 4 26B A4B | 151.6 | Google (free tier) |
| North Mini Code | 133.3 | OpenRouter free route (Cohere) |
| Gemini 2.5 Flash | 129.3 | Google (free tier) |

The 3 excluded models are kept in code, not deleted, in `MODELS_DORMANT` in `script.js`, each with
its exclusion reason: Gemma 4 31B (failed C2 on S2-P3), gpt-oss-120b (failed C1 on S2-P2, C2 on
S2-P2/S2-P3) and gpt-oss-20b (failed C2 on S2-P2/S2-P3, C3 on S2-P4/S2-P5). Both Groq models are
gone, so `callGroq()` is fully dormant.

- **Conditions unchanged:** `temperature: 0`, `max_tokens: 7400`, same provider routing.
- **Timeout:** `REQUEST_TIMEOUT_MS` is now 180 s for every card (was 40 s, 90 s for the Gemma
  cards). Every Stage 2 export records `timeoutMs: 180000`; the committed code had drifted from the
  copy that ran Stage 2. This only bounds how long a hung call may sit before it is logged as an API
  failure.
- **North Mini Code quota:** the limit that applies is OpenRouter's free-model cap (50 requests a
  day on this key), not Cohere's direct-API trial headers. `assertOpenRouterQuota()` reads it from
  `GET /api/v1/key` before every send and refuses to send when fewer than 3 requests are left.
- **Prompts:** `stage3/prompts.json` (and `stage3/STAGE3-D5-PROMPTS.md`) hold the 10 Appendix D.5
  prompts and the system prompt. Two edits to D.5 are **proposed, not yet confirmed by the group**:
  Fix A (JSON output tail on the system prompt) and Fix B (prompt 4 drops "Create an outline I can
  base my writing on, and").
- **The 120-response run:** see [Formal evaluation batch](#formal-evaluation-batch-stage-3).

## Models used

This section tracks the Stage 1 long-list (see `../THS-ST2-Stage1-LLM-Selection.md`) and the
matching cards in this grid. **The list was decided on 2026-09-15 and has 7 models.** The grid
matches it, and every card returned valid JSON on a real Appendix D.5 prompt through this app's
own adapters that day. Earlier rounds' lists are kept below under
[Prior rounds (superseded)](#prior-rounds-superseded) for the paper trail. An even earlier set of
4 models (Gemini 2.5 Flash, Mistral Small, Llama 3.3 70B Versatile, Llama 4 Scout) predates the
Stage 1 process entirely and was removed rather than mixed in — see the comment above the
`MODELS` array in `script.js`. (Gemini 2.5 Flash is back on the list, but it re-entered through
the Stage 1 rules, not as a carry-over.)

**Selection rules (decided 2026-09-15; full list R1–R9 in the Stage 1 handout):**
- **Standing free-tier access only.** Excluded: paid or low-cost models, trial / evaluation keys,
  one-time credits, and free routes governed by trial / evaluation-only terms.
- **Free access must be documented** by the provider. Live calls are extra evidence, not a
  substitute.
- **No preview models, and no models with a published shutdown date.**
- **Both Artificial Analysis benchmarks required** (IFBench and GPQA Diamond). No GPQA-D-only
  "Tier 2".
- **Score = GPQA-D + IFBench.** The top 10 form the list, or every eligible model if fewer (7 this
  round).
- **One slot per model,** at its highest-scoring benchmarked setting **that completes within the
  provider's free-tier limits**, fixed for every run.
- No minimum IFBench score, and no per-provider cap.

AA's score figures are taken from the Stage 1 handout. This app's convention is to verify
*access* live before wiring a card in.

| # | Model | Provider | Architecture | API / setting | Combined | GPQA-D | IFBench | Card id |
|---|-------|----------|--------------|---------------|----------|--------|---------|---------|
| 1 | `gemini-3.5-flash` | Google | Dense Transformer | Gemini OpenAI-compat, default (dynamic) thinking | 168.5 | 92.2 | 76.3 | `gemini-3-5-flash` |
| 2 | `gemma-4-31b-it` | Google | Dense Transformer | Gemini OpenAI-compat (native, not OpenRouter); 90 s timeout | 161.3 | 85.7 | 75.6 | `gemma-4-31b` |
| 3 | `gemma-4-26b-a4b-it` | Google | Dense Transformer | Gemini OpenAI-compat (native, not OpenRouter); 90 s timeout | 151.6 | 79.2 | 72.4 | `gemma-4-26b-a4b` |
| 4 | `openai/gpt-oss-120b` | Groq | MoE | Groq OpenAI-compat, `reasoning_effort: "high"` | 147.2 | 78.2 | 69.0 | `gpt-oss-120b-high` |
| 5 | `cohere/north-mini-code:free` | Cohere (via OpenRouter) | MoE (30B total / 3B active, per OpenRouter's description) | OpenRouter | 133.3 | 75.7 | 57.6 | `north-mini-code` |
| 6 | `gemini-2.5-flash` | Google | Dense Transformer | Gemini OpenAI-compat, default (dynamic) thinking | 129.3 | 79.0 | 50.3 | `gemini-2-5-flash` |
| 7 | `openai/gpt-oss-20b` | Groq | MoE | Groq OpenAI-compat, `reasoning_effort: "low"` | 118.9 | 61.1 | 57.8 | `gpt-oss-20b-low` |

**Fixed request conditions for every card** (enforced in `callOpenAICompatChat()`):
- `temperature: 0`
- `max_tokens: 7400`

`extraBody` can't override either value.

Free access documented by (all saved in `../stage1-evidence/2026-09-15/docs/`):
- **Google's Gemini API pricing page, Free Tier column:** rows 1, 2, 3 and 6. Google's deprecations
  page shows no shutdown date for any of them.
- **OpenRouter's model catalog and per-model endpoints API ($0):** row 5. Served by Cohere, with no
  trial notice on the model page.
- **Groq's rate-limits page, Free Plan table:** rows 4 and 7 (30 RPM, 1K RPD, 8K TPM, 200K TPD).
  Groq's Services Agreement covers "preview or production use".

Real-prompt check (2026-09-15): Appendix D.5 prompt #2 with the JSON system prompt, run on every
card through this file's adapters in Node. All 7 returned valid JSON:

| Card | Time | Microtasks |
|---|---|---|
| gemini-3.5-flash | 8 s | 13 |
| gemma-4-31b | 83 s, after retries | 15 |
| gemma-4-26b | 52 s | 11 |
| gpt-oss-120b | 12 s | 17 |
| north-mini-code | 13 s | 13 |
| gemini-2.5-flash | 16 s | 31 |
| gpt-oss-20b | 1 s | 12 |

Evidence: `../stage1-evidence/2026-09-15/calls/freeze-checks/`. The browser UI itself wasn't
re-tested.

#### Grid rewired (2026-09-15)

`script.js` was rewired three times on 2026-09-15:
1. **After the rules were decided:**
   - Removed `gemini-3-5-flash-medium` (one slot per model) and `gemini-3-8-flash-high` (GPQA-D only).
   - Added `gpt-oss-20b-high` and `nemotron-3-nano-omni`.
2. **After the replacement search** (`../THS-ST2-Stage1-Replacement-Search.md`):
   - Removed `gemini-3-1-flash-lite` (Google lists a May 7, 2027 shutdown date).
   - Added `gemini-2-5-flash`.
3. **After the before-freezing checks:**
   - Removed `nemotron-3-ultra`, `nemotron-3-super` and `nemotron-3-nano-omni`. Their OpenRouter
     `:free` routes are served by NVIDIA under the **NVIDIA API Trial Terms** ("limited trial purposes
     only and without use … in production").
   - Replaced `gpt-oss-20b-high` with `gpt-oss-20b-low`: "high" never finished within Groq's 8K
     tokens-per-minute limit.
   - Added the shared `MAX_TOKENS`, Gemini 500/503 retries, Groq 429 retries, and 90 s timeouts for
     both Gemma cards.

`validateConfig()` still checks only the Gemini, Groq and OpenRouter keys.

### Ranking correction history

- **2026-09-14:** the first version of this table had `cohere/north-mini-code:free` at #9 and
  `gemini-3.8-flash` (high, Tier 2) at #10. Nemotron 3 Nano (146.8), then described as "confirmed
  free on OpenRouter," was moved in at #9.
- **2026-09-15 (live checks):** Nemotron 3 Nano has **no free route** (paid-only on OpenRouter;
  NVIDIA NIM `404 Not found for account`), so it was removed. `gemini-3-flash-preview` was found
  still live.
- **2026-09-15 (rules decided):** `gemini-3-flash-preview`, `gemini-3.5-flash` (medium) and all
  GPQA-D-only models left the list. `openai/gpt-oss-20b`, `cohere/north-mini-code:free` and
  `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` entered.
- **2026-09-15 (replacement search):**
  - `gemini-3.1-flash-lite` removed (shutdown date).
  - `gemini-2.5-flash` added.
  - Command A+ excluded (Cohere trial key only).
  - Gemini 3 Flash Preview's exclusion reason corrected to "preview model".
- **2026-09-15 (before-freezing checks):**
  - All three Nemotron models removed (NVIDIA API Trial Terms: evaluation only, not production).
  - gpt-oss-20b moved from "high" (133.9) to "low" (118.9).
  - The list became 7 models.

### Open items flagged this round (not silently resolved)

- **Row 1 — `gemini-3.5-flash` at its default setting.** AA scored the default (168.5) above
  medium (166.7), so the list uses the default. Google's docs: "Gemini models engage in dynamic
  thinking by default, automatically adjusting reasoning effort based on request complexity."
- **Rows 2 and 3 — Gemma on Google's own Gemini API, not OpenRouter.** A prior round's
  `gemma-4-31b` entry pointed at OpenRouter's `google/gemma-4-31b-it:free`, which has a documented
  history in this app of failing on shared-pool congestion (see the "Prior rounds" section below).
  In the 2026-09-15 checks that OpenRouter route also skipped reasoning by default (0 reasoning
  tokens), unlike AA's benchmarked "(Reasoning)" setting.
  **Display note:** both Gemma routes embed a `<thought>...</thought>` reasoning prefix directly
  inside the visible response text (confirmed live), unlike every other card. This app displays
  response text raw, so the Gemma cards show that prefix. Not stripped here — the Stage 2 protocol
  strips it before grading.
  **Speed:** both Gemma cards take 50–85 s on a real D.5 prompt, so both pass `timeoutMs: 90000`.
  **Stability, row 2 (`gemma-4-31b-it`):**
  - Worked at wiring time, then 4/4 `HTTP 500 INTERNAL` shortly after.
  - 2026-09-15 re-checks: 1 of 3, then 3 of 7 raw calls succeeded; the rest were `500` or `503`,
    including a `500` on a real prompt.
  - It looks isolated to this model ID on Google's side (same-round calls to other Gemini IDs
    succeeded).
  - **Kept by group decision:** `callGeminiCompat()` now retries `500`/`503` up to 3 times,
    5 s apart. With retries, a real prompt succeeded in 83 s.
  - Persistent failures count as infrastructure failures under the Stage 2 protocol.
- **Rows 4 and 7 — Groq Free Plan limits drive two settings.**
  - **Output cap.** Without `max_tokens`, both gpt-oss models fell back to a short provider default
    (3,072 / 2,048 tokens) and stopped mid-reasoning with no answer on real prompts. The shared
    `MAX_TOKENS = 7400` is the largest cap that fits the 8K TPM limit.
  - **gpt-oss-120b (high)** then finishes at ~4,300–4,800 total tokens, so a second send within a
    minute can get `429`; `callGroq()` retries `429`s twice, 20 s apart.
  - **gpt-oss-20b** at "high" used all 7,400 tokens reasoning without answering, so it runs at "low"
    (AA 118.9), which finishes in ~750 tokens.
  - Groq's default `reasoning_effort` for both models is `"medium"`, so both settings are sent
    explicitly.
- **Row 5 — `cohere/north-mini-code:free`, architecture resolved 2026-09-15.** OpenRouter's model
  description says it is "a sparse mixture-of-experts model with 30B total parameters and 3B
  active", so the badge was changed from the earlier "Dense Transformer" guess to "MoE".
- **Row 6 — `gemini-2.5-flash`, added after the replacement search.** AA's "Gemini 2.5 Flash
  (Reasoning)" record (129.3) matches this model's default dynamic thinking, so no
  `reasoning_effort` is sent; its non-reasoning setting scored 107.3. AA's separate "Gemini 2.5
  Flash Preview (Sep '25)" record is a different model ID. **Availability risk:** Google already
  returns "no longer available to new users" for `gemini-2.5-pro` and `gemini-2.5-flash-lite`.
- **Removed cards, for the record:**
  - **Nemotron 3 Ultra / Super / Nano Omni** (third rewire): excluded under the NVIDIA API Trial
    Terms. Ultra was also slow (~70–120 s per response), and the NVIDIA free routes returned
    intermittent `502` "overloaded / request limit reached" errors.
  - **`gemini-3-1-flash-lite`** (second rewire): announced shutdown date.
  - **`gemini-3-5-flash-medium` and `gemini-3-8-flash-high`** (first rewire). `gemini-3.8-flash` had
    a history of transient `503` "high demand" responses, and on 2026-09-15 took 41–119 s per
    one-word reply at `reasoning_effort: "high"`.

### Shared infrastructure

- **Client-side timeout.** `callOpenAICompatChat()` aborts any in-flight request after
  `REQUEST_TIMEOUT_MS` (40 s) via `AbortController`, instead of waiting indefinitely on a stuck
  upstream. A timed-out call surfaces as the "CORS/Network" card state (see
  [How to use](#how-to-use)), with a message naming the timeout explicitly so it doesn't read as a
  real CORS block. `timeoutMs` can override this per card; currently only the two Gemma cards do
  (90 s).
- **Fixed request conditions.** `temperature: 0` and `max_tokens: MAX_TOKENS` (7400) are both
  spread into the request body *after* `extraBody`, so nothing a card passes can override them.
  They apply to all 7 cards through the one shared builder.
- **Retries** (each adapter retries only errors that are known to clear):
  - `callGeminiCompat()`: HTTP `500` / `503`, 3 attempts, 5 s apart.
  - `callGroq()`: HTTP `429`, 3 attempts, 20 s apart.
  - `callOpenRouter()`: HTTP `429` and "HTTP 200 with an error body", 3 attempts, 5 s apart (see
    [CORS notes](#cors-notes)).
- **`reasoning_effort` support.** `callOpenAICompatChat()` accepts an `extraBody` object merged into
  the JSON request body, threaded through `callGeminiCompat()`, `callGroq()` and
  `callOpenRouter()`. The two gpt-oss cards use it (`"high"` / `"low"`).
- **One `MODELS` entry isn't always one unique model ID.** Earlier rounds had several cards on the
  same upstream model with different `extraBody` values, each with its own unique `id` (the DOM
  lookup key). The current list has one card per model, but the convention stands.

To swap models, edit the `MODELS` array at the top of `script.js` — each entry defines its display
name, provider, architecture badge, key, and call function (optionally taking a 4th `extraBody`
argument and a 5th `timeoutMs` argument). All 7 current candidates go through the one shared
`callOpenAICompatChat()` builder (Groq, OpenRouter, and Gemini's OpenAI-compat layer are all
confirmed OpenAI-shaped; NVIDIA NIM, Cohere, Mistral, and DeepSeek's native endpoint are also
compatible but currently unused).

## How to configure

Open `config.js` and paste each key between the empty quotes:

```js
const CONFIG = {
  GEMINI_API_KEY: "your-gemini-key",
  GROQ_API_KEY: "your-groq-key",
  OPENROUTER_API_KEY: "your-openrouter-key",
  NVIDIA_API_KEY: "your-nvidia-nim-key", // unused — see note below
  COHERE_API_KEY: "your-cohere-key", // unused — see note below
  MISTRAL_API_KEY: "your-mistral-key", // unused — see note below
  DEEPSEEK_API_KEY: "your-deepseek-key" // unused — see note below
};
```

`validateConfig()` in `script.js` only warns on missing/placeholder `GEMINI_API_KEY`,
`GROQ_API_KEY` and `OPENROUTER_API_KEY` — the only keys an active `MODELS` entry depends on. For
the Gemini key, use one from a project **without billing enabled**, so every call runs on the
documented free tier. `NVIDIA_API_KEY`, `COHERE_API_KEY`, `MISTRAL_API_KEY` and
`DEEPSEEK_API_KEY` are left in `config.js` but no current card uses them. None of those providers
has a model that qualifies under the current rules (see the Stage 1 handout, Section 4).

`config.js` is gitignored. `config.example.js` is the template. Rename and remove "example."

## How to use

1. (Optional) Type a **System Prompt** — sets role/tone for all models, e.g. "You are a doctor."
   For Stage 2 and formal evaluation, use the JSON system prompt from the Stage 2 protocol draft
   (§4).
2. Type a **User Prompt** — the actual question or task.
3. Click **Send to All**. All 4 finalists are queried in parallel. Cards show a loading shimmer until
   each response arrives. A stuck card is cut off by the client-side timeout (180 s). Retries can
   add time.
   - **North Mini Code's quota:** each send costs it at least one of OpenRouter's 50 free-model
     requests a day. Below 3 left, Send to All refuses with a message instead of sending.
4. Each card displays the raw response text (never reformatted — this is why the Gemma cards show
   their `<thought>...</thought>` prefix, see above), a status (**OK** / **Failed** /
   **CORS/Network**), and elapsed time in ms.
   - **CORS/Network** means `fetch()` never got an HTTP response back — the browser blocked the
     request (most likely CORS), couldn't reach the host at all, or the client-side timeout fired.
     Browsers don't expose which of the three it was from the error alone, but a timeout's error
     message names itself explicitly. A real HTTP error response — a `429`, for instance — is
     **Failed**, not CORS/Network, even though both can look like "it didn't work" at a glance.
5. Click **Export JSON** to download the run (system prompt, user prompt, timestamp, every model's
   response) as a timestamped `.json` file.
6. Expand **Session History** at the bottom to see all runs from this browser session. Click any
   entry to restore that run into the grid.

> Note: session history lives only in browser memory. Refreshing the page clears it. Use Export
> to save anything you want to keep.
>
> None of the current cards needs `node nim-proxy.js` running — zero cards route through NVIDIA NIM.
> The proxy and its stagger logic (`NIM_STAGGER_MS`) are left in the codebase, inert — see
> [CORS notes](#cors-notes).

## Formal evaluation batch (Stage 3)

**10 Appendix D.5 prompts × 3 runs × 4 finalists = 120 responses**, sent as 30 "Send to All" calls.
It is a loop around the same `dispatchToAll()` the button uses (`batch.js`), not a new dispatch
path, and the request/cleaning code is untouched.

**In the page:** open **Formal evaluation batch**, choose the `stage3-evidence` folder (Chrome or
Edge), and click **Start / resume batch**. Each send is written to `exports/` in that folder as
`llm-run-S3-P<n>-run<n>-<timestamp>.json`, and `RUN-LOG.md` is rewritten after every send.

**From the command line** (same `script.js`, no browser):

```
node stage3/run_headless.mjs --live-test     # one Send to All, prints status/latency, saves nothing
node stage3/run_headless.mjs                 # the batch -> stage3-evidence/exports/ + RUN-LOG.md
```

Node has no CORS, so it can't show a browser-side CORS problem; Stage 1/2 already covered that.
Each export from the batch carries a `batch` field (`stage`, `promptId`, `run`, `attempt`,
`runner`) saying which runner produced it.

- **Failures** follow the Stage 2 convention: a send with an API failure (after the adapters' own
  retries) is exported anyway, then only the failed models are re-sent after a 60 s / 120 s backoff
  as `S3-P<n>-run<n>-retry` and `-retry2`. A retry only fills in a response that failed with an
  API error; a badly formatted response is a result, not a failure, and is never re-sent. Anything
  still failing after `-retry2` is listed as unresolved in `RUN-LOG.md`.
- **Pacing:** 20 s minimum between sends (adjustable). If OpenRouter's free-model quota runs low,
  the batch **pauses** rather than spend the last requests; run it again after the daily reset and
  it resumes from what is already in `exports/`.
- **Evidence** goes in `stage3-evidence/`, separate from Stage 2's.

## CORS notes

CORS behavior per provider, confirmed with real requests from a live browser:

| Provider | CORS headers present? | Behavior |
|---|---|---|
| Groq, OpenRouter, Google (OpenAI-compat) | Yes | Called directly from the browser — covers all 4 current cards (Google and OpenRouter; Groq is dormant) |
| Cohere, Mistral | Yes | Confirmed CORS-fine, but currently unused — no active card calls either |
| NVIDIA NIM | **No** | Would route through the local `nim-proxy.js` if used — currently inert |

NVIDIA's hosted `integrate.api.nvidia.com` API sends no `Access-Control-Allow-Origin` header, and a
real browser call confirms it's actually blocked (not just missing on preflight). There's no
officially supported way to enable it either — an NVIDIA staff reply on
[their own developer forum](https://forums.developer.nvidia.com/t/please-handle-cors-to-make-it-possible-to-make-calls-from-the-browser/310061)
only says "we'll keep this use case in mind." `callNvidia()` in `script.js` still uses the local
proxy for this reason, but no `MODELS` entry calls it. (NVIDIA models reached through OpenRouter's
`:free` routes were CORS-clean, but were removed on 2026-09-15 because of NVIDIA's API Trial Terms.)

`cohere/north-mini-code:free` (OpenRouter) — confirmed CORS-clean and called directly.

`gemma-4-31b-it` and `gemma-4-26b-a4b-it` (Google, direct) — same OpenAI-compat endpoint as the
Gemini cards, same CORS behavior, no proxy.

A 400ms stagger between NIM-routed call starts (`NIM_STAGGER_MS` in `script.js`) exists from an
earlier round's live run that showed a `503` and an unrelated-looking timeout land in the same batch
— a shared-backend-under-load pattern on NIM's free tier. Left in place, fully inert, not removed per
instruction — this is shared, model-agnostic infrastructure, not specific to any one model that
passed through it.

**OpenRouter `:free`-tagged routes — a standing, known failure mode.** A prior round's
`gemma-4-31b-it:free` card (then routed through OpenRouter) live-tested 4/4 failures in under 1.1s
with `HTTP 429`, `"limit_source":"upstream_provider_shared_pool"` — external congestion on
OpenRouter's shared free-tier routing, not this app's own traffic. `callOpenRouter()` retries up to
3 attempts total on `HTTP 429`, 5 seconds apart — this rides out transient upstream saturation, not
a concurrency fix. Currently relevant to 1 card (`north-mini-code`).

**A second OpenRouter failure shape: HTTP 200 with the real error buried in the body.** Live-tested
on `nemotron-3-super` (since removed): 2 failures out of 8 identical calls came back as `HTTP 200`
with no `choices` array at all, and a top-level
`{"error":{"message":"Upstream error from Nvidia: Service temporarily overloaded","code":502}}`
instead. OpenRouter apparently passes through whatever shape the specific upstream provider
returned, rather than always normalizing to a real HTTP error status. `callOpenAICompatChat()`
previously only checked `res.ok` (the HTTP status), so this silently became `content: ""` —
displayed in the grid as a misleading **OK** / *(empty response)*, indistinguishable from the model
genuinely saying nothing, and — worse — never triggered `callOpenRouter()`'s 429 retry either.
**Fixed:** `callOpenAICompatChat()` now checks the parsed body for a top-level `error` field
regardless of `res.ok` and throws a real error for it; `callOpenRouter()`'s retry condition also
matches this shape (`"Upstream error in HTTP 200 response..."`), not just literal `HTTP 429`. This
is a correctness fix — before it, a real upstream failure on any OpenRouter-routed card could have
been silently recorded as a successful empty response in an exported run.

## File structure

- `index.html` - UI layout, loads config.js, then script.js, then batch.js
- `style.css` - Dark theme, responsive grid, skeleton animation
- `script.js` - Model registry, send logic, history, provider adapters
- `batch.js` - Stage 3 batch runner: loops Send to All over the D.5 prompts, retries, pacing, quota pause, RUN-LOG.md
- `stage3/` - `prompts.json` / `STAGE3-D5-PROMPTS.md` (the 10 D.5 prompts + system prompt), `run_headless.mjs` (Node runner and live test)
- `stage3-evidence/` - Stage 3 exports and run log (separate from Stage 2's)
- `nim-proxy.js` - Minimal local CORS proxy for NVIDIA NIM (currently inert — no active card routes through NIM, see CORS notes)
- `config.js` - Your API keys (gitignored)
- `config.example.js` - Safe template committed to the repo
- `.gitignore` - Ignores config.js

## Prior rounds (superseded)

The sections below document earlier Stage 1 long-lists, kept for the paper
trail rather than deleted when superseded — none of this reflects the current
`MODELS` array; see the model table near the top of this file for what's
actually active.

<details>
<summary>Round: 2026-09-14, same-day second rewire pass (10 candidates, superseded by the THS-ST2 thesis round above)</summary>

**Ranking rule (stated, not a caveat):** candidates are ranked by combined
IFBench + GPQA Diamond score where Artificial Analysis has published both.
Where AA has only published GPQA Diamond for a candidate — true for some
newer models AA hasn't run IFBench on yet — that candidate is ranked on GPQA
Diamond alone, and Stage 2's pass/fail screening on the actual decomposition
task serves as the instruction-following check for those specific candidates
in place of an IFBench score.

**Free-access rule (added in the 2026-09-14 rewire):** every candidate must
have confirmed free API access — verified against a live account check, not
just "the provider has a free tier." A provider-level free tier doesn't mean
every model on it is free; check the specific model.

| Model | Provider | Architecture | API |
|-------|----------|--------------|-----|
| `gemini-3.5-flash` | Google | Dense Transformer | Gemini OpenAI-compatible layer |
| `gemini-3.6-flash` | Google (**paid AI Studio account**) | Dense Transformer | Gemini OpenAI-compatible layer |
| `gemini-3.7-flash` | Google (**paid AI Studio account**) | Dense Transformer | Gemini OpenAI-compatible layer |
| `gemini-3.8-flash` | Google (**paid AI Studio account**) | Dense Transformer | Gemini OpenAI-compatible layer |
| `openai/gpt-oss-120b` | Groq | MoE | Groq (OpenAI-compatible) |
| `google/gemma-4-31b-it:free` | Google (via OpenRouter) | Dense Transformer | OpenRouter (OpenAI-compatible) |
| `command-a-plus-05-2026` | Cohere | Dense Transformer | Cohere OpenAI-compatible layer |
| `nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA NIM | MoE | NIM chat completions, via local proxy |
| `nvidia/nemotron-3-super-120b-a12b` | NVIDIA NIM | MoE | NIM chat completions, via local proxy |
| `deepseek-ai/deepseek-v4-flash-0731` | DeepSeek (via NVIDIA NIM) | MoE | NIM chat completions, via local proxy |

**Accessibility note on the three paid-account Gemini entries:** `gemini-3.6-flash`,
`gemini-3.7-flash`, and `gemini-3.8-flash` were reachable only through Allen's own
paid Google AI Studio account, not a free tier any researcher could use. Still
valid under the Stage 1 methodology's "confirmed free access **or low-cost**"
wording, but a materially different accessibility story than every other
entry above, all of which ran on no-card free tiers (Groq, NVIDIA NIM,
OpenRouter's `:free` tag, Cohere Trial).

> **`qwen/qwen3.8-27b` removed in the same-day second rewire pass** — displaced
> from that round's 10 by the three new Gemini Flash entries (3.6/3.7/3.8) scoring
> higher on GPQA Diamond (90.5% vs. 92.8–95.3%). It previously stood in for
> Z.ai's GLM-4.7-Flash, which was dropped because its API rejects
> `temperature=0` outright (docs require a positive number), conflicting with
> this app's fixed temperature=0 policy; the originally intended
> `qwen/qwen3-32b` had also turned out to no longer exist in Groq's live
> catalog.
>
> **`gemini-3.1-flash-lite` also removed in the same pass.** ⚠️ **Flagged, not
> silently resolved at the time:** it wasn't named anywhere in that round's
> final long-list doc. That doc instead named two *different* removals for
> this Google slot — "Gemini 3 Flash" (GPQA-D 81.2%) and "Gemini 3.5
> Flash-Lite" (GPQA-D 83.8%) — neither of which matched this entry's actual
> id/name or any score this app had recorded for it. (Note: `gemini-3.1-flash-lite`
> re-entered the array in the THS-ST2 thesis round above, at #5 — same model
> ID, back via a completely separate rewire doc's own inclusion — and was
> removed again on 2026-09-15 because Google lists a May 7, 2027 shutdown date.)
>
> `gemini-3-flash-preview` was **removed in an earlier 2026-09-14 rewire pass**
> (before the same-day pass above) — it lost a head-to-head GPQA-only
> comparison against `qwen3-8-27b`. ⚠️ **Unresolved figure conflict, flagged
> not silently reconciled:** that rewire's own scoring cited 81.2% GPQA
> Diamond for this comparison, but this app's still-earlier decision log
> recorded the same model at IFBench 78.0% / GPQA Diamond 89.8% as a full
> Tier 1 candidate. Two different numbers from two different research rounds
> for the same model. This model was never `gemini-3.1-flash-lite`.
>
> `google/gemma-4-31b-it:free` was the fourth occupant of a slot that started as
> `meta/llama-4-maverick-17b-128e-instruct` (permanently retired on NVIDIA
> NIM), then Cohere Command A (weak GPQA fit), then `moonshotai/kimi-k2.6`
> (blocked by an NVIDIA account-side entitlement gap), then Qwen3.7 Max on
> OpenRouter — dropped because it was always pay-as-you-go, not actually free.
> Gemma 4 31B's `:free` tag was confirmed real and `$0`-priced on OpenRouter's
> live catalog at the time — unlike **GLM-5.1**, which turned out to have **no
> `:free` variant at all** on OpenRouter (only a paid `z-ai/glm-5.1`). (Note:
> the THS-ST2 thesis round above moved this model's slot to Google's own
> Gemini API directly instead of OpenRouter — see the current model table.)
>
> `command-a-plus-05-2026` was a fresh addition in the earlier rewire, not a
> reactivation of the original Command A card. Confirmed via a live,
> authenticated `GET /v1/models` call. Artificial Analysis scored it IFBench
> 73.9% / GPQA Diamond 76.1%, both AA-confirmed. **Trial quota:** alongside the
> documented `x-endpoint-monthly-call-limit` (1000/month), the compatibility
> endpoint also carried its own much tighter `x-trial-endpoint-call-limit`
> (20, a separate window). `callCohere()`'s `logCohereQuota()` logged the real
> remaining count from each response; a hard-stop guard
> (`COHERE_HARD_STOP_THRESHOLD`) was added in the same-day second pass. (Note:
> Cohere is still represented in the THS-ST2 thesis round above, but as
> `north-mini-code` via OpenRouter, not `command-a-plus` directly —
> `callCohere()` is left intact, unused.)
>
> `deepseek-v4-flash` routed through NVIDIA NIM instead of DeepSeek's native
> API (balance-blocked, `402 Insufficient Balance`). GPQA Diamond corrected
> from an earlier 89.4% (secondary-source figure) to 90.8%. **Tier 2, not
> Tier 1, in the same-day second rewire pass:** the fresh re-check against
> live AA data found no published IFBench score for this model at all — the
> 79.2% figure carried by the earlier pass was stale, despite having been
> recorded, on that same date, as "confirmed directly against AA's own
> IFBench chart." Two contradictory same-day confirmations for the same
> number, flagged rather than silently resolved. (Note: not in the THS-ST2
> thesis round's top 10 at all.)
>
> `deepseek-v4-pro` (the other half of this pair) was **removed entirely on
> 2026-09-14** — build.nvidia.com's playground page read "This NIM Endpoint
> has been deprecated" (past tense, confirmed dead), and no newer dated
> DeepSeek V4 Pro build existed in NIM's catalog to swap to.
>
> `gemini-3.5-flash` replaced Mistral Medium 3.5: confirmed paid, not free
> (`mistral-medium-3-5` and `mistral-medium-latest` both returned `429`/
> zero-rate-limit despite the account's Limits page showing the latter as
> "provisioned"). Scored IFBench 76.3% / GPQA Diamond 92.2%. MiniMax-M3 was
> considered and rejected for this slot first — not listed at all in a live
> NIM catalog check. (Note: this model carried forward unchanged into the
> THS-ST2 thesis round above, at #1, same figures.)
>
> `gemini-3.7-flash`: GPQA Diamond 94.5%, no AA IFBench score. **Kept through
> both 2026-09-14 rewire passes on purpose:** absent from either rewire doc's
> own candidate tables with no logged reason, despite being the
> highest-scoring candidate in the pool at the time it was kept. (Note: not
> in the THS-ST2 thesis round's top 10 — the round that replaced this one
> introduced its own new highest-GPQA-D Tier 2 entry, `gemini-3.8-flash`
> (high), instead.)
>
> `gemini-3.6-flash` and `gemini-3.8-flash` were new in the same-day second
> rewire pass. Neither had an AA IFBench score, ranked on GPQA Diamond alone:
> 92.8% for `gemini-3.6-flash`, 95.3% for `gemini-3.8-flash`. (Note:
> `gemini-3.6-flash` didn't carry into the THS-ST2 thesis round;
> `gemini-3.8-flash` did, at #10, now with `reasoning_effort: "high"` forced —
> then moved to the backup list by that round's ranking correction, and made
> ineligible on 2026-09-15 when GPQA-D-only models were ruled out. Its card was
> removed in the first 2026-09-15 rewire.)

</details>

