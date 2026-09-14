## Models used

This grid currently holds the 10 candidates from the **THS-ST2 thesis round**
of Stage 1 selection (2026-09-14), which replaced the prior round's 10
candidates wholesale, not as a merge — see [Prior rounds (superseded)](#prior-rounds-superseded)
below for the full lineage this replaced, kept for the paper trail rather than
deleted. An even earlier set of 4 models (Gemini 2.5 Flash, Mistral Small,
Llama 3.3 70B Versatile, Llama 4 Scout) predates the Stage 1 process entirely
and was removed rather than mixed in — see the comment above the `MODELS`
array in `script.js`.

**Ranking rule (stated, not a caveat):** candidates are ranked by combined
IFBench + GPQA Diamond score where Artificial Analysis has published both
(Tier 1). Where AA has only published GPQA Diamond for a candidate — true for
some newer models AA hasn't run IFBench on yet — that candidate is ranked on
GPQA Diamond alone (Tier 2), and Stage 2's pass/fail screening on the actual
decomposition task serves as the instruction-following check in place of an
IFBench score. This round has one Tier 2 slot, per the standing addendum rule.

**Free-access rule:** every candidate must have confirmed free (or, for a
documented exception, low-cost/paid) API access — verified against a live
account or catalog check, not just "the provider has a free tier." A
provider-level free tier doesn't mean every model on it is free; check the
specific model. This app's convention (every entry below) is to verify
*access* live before wiring a card in — AA's score figures themselves are
taken from the rewire doc as given, not independently re-verified.

| # | Model | Provider | Architecture | API | Combined | GPQA-D | IFBench |
|---|-------|----------|--------------|-----|----------|--------|---------|
| 1 | `gemini-3.5-flash` | Google | Dense Transformer | Gemini OpenAI-compat, default (dynamic) thinking | 168.5 | 92.2 | 76.3 |
| 2 | `nvidia/nemotron-3-ultra-550b-a55b:free` | NVIDIA (via OpenRouter) | MoE | OpenRouter | 168.1 | 86.7 | 81.4 |
| 3 | `gemini-3.5-flash` (medium) | Google | Dense Transformer | Gemini OpenAI-compat, `reasoning_effort: "medium"` | 166.7 | 92.1 | 74.6 |
| 4 | `gemma-4-31b-it` | Google | Dense Transformer | Gemini OpenAI-compat (native, not OpenRouter) | 161.3 | 85.7 | 75.6 |
| 5 | `gemini-3.1-flash-lite` | Google | Dense Transformer | Gemini OpenAI-compat | 159.4 | 82.2 | 77.2 |
| 6 | `gemma-4-26b-a4b-it` | Google | Dense Transformer | Gemini OpenAI-compat (native, not OpenRouter) | 151.6 | 79.2 | 72.4 |
| 7 | `nvidia/nemotron-3-super-120b-a12b:free` | NVIDIA (via OpenRouter) | MoE | OpenRouter | 151.5 | 80.0 | 71.5 |
| 8 | `openai/gpt-oss-120b` (high) | Groq | MoE | Groq OpenAI-compat, `reasoning_effort: "high"` | 147.2 | 78.2 | 69.0 |
| 9 | `cohere/north-mini-code:free` | Cohere (via OpenRouter) | Dense Transformer (unconfirmed — see below) | OpenRouter | 133.3 | 75.7 | 57.6 |
| 10 | `gemini-3.8-flash` (high) | Google | Dense Transformer | Gemini OpenAI-compat, `reasoning_effort: "high"` | Tier 2 | 95.3 | — |

Source: Artificial Analysis IFBench and GPQA Diamond leaderboards, pulled live
2026-09-14. Access verified against: OpenRouter's live `GET /v1/models`
catalog (rows 2, 7, 9 — all three confirmed with genuine `:free`/$0 pricing,
distinct from a paid non-`:free` listing also present for the same base model
on rows 2 and 7), Google's native `GET /v1beta/models` catalog plus a real
chat-completions call (rows 4, 6 — both listed and both returned real `200`s),
and a live call confirming `reasoning_effort` is accepted as a top-level body
field by both Gemini's and Groq's OpenAI-compat endpoints (rows 3, 8, 10).

### Open items flagged this round (not silently resolved)

- **Row 1 vs. row 3 — same base model, genuinely different calls, but a
  subtle distinction.** `gemini-3.5-flash`'s own documented default thinking
  level is "medium," but as *dynamic* thinking — Google's docs: "Gemini
  models engage in dynamic thinking by default, automatically adjusting
  reasoning effort based on request complexity." Row 3 forces
  `reasoning_effort: "medium"` explicitly, which pins the level instead of
  letting it float. So these are not literally identical API calls, but on a
  simple prompt, dynamic thinking may settle near "medium" anyway and produce
  very similar output — worth knowing before treating rows 1 and 3 as two
  clearly-distinguished data points in a defense.
- **Rows 2 and 7 — Nemotron moved from NVIDIA NIM to OpenRouter this round.**
  Prior rounds only knew these models via NVIDIA NIM directly (needs the
  local `nim-proxy.js` hop — NVIDIA's native API sends no CORS headers).
  OpenRouter's own catalog now lists both with a genuine `:free` tag
  ($0 pricing, confirmed live) — a new discovery this round, not something
  earlier research checked. CORS-clean on OpenRouter, so both are called
  directly, no proxy. `nim-proxy.js` / `NIM_STAGGER_MS` are left in place but
  fully inert this round — zero active cards route through NIM.
- **Rows 4 and 6 — Gemma moved from OpenRouter to Google's own Gemini API
  directly.** A prior round's `gemma-4-31b` entry pointed at OpenRouter's
  `google/gemma-4-31b-it:free`, which has a documented history in this app of
  failing on shared-pool congestion (see the "Prior rounds" section below).
  This round confirmed live that `gemma-4-31b-it` and `gemma-4-26b-a4b-it`
  are both listed in this account's native Gemini model catalog and both
  respond over the same OpenAI-compat endpoint the Gemini cards already use —
  so both route there directly now, sidestepping that specific failure mode.
  **Display note:** both Gemma routes embed a `<thought>...</thought>`
  reasoning prefix directly inside the visible response text (confirmed
  live) — unlike every other card in this grid, including Groq's gpt-oss
  (whose reasoning comes back in a separate `message.reasoning` field, not
  mixed into content). This app displays response text raw, so the Gemma
  cards will visibly show that prefix. Not stripped — a product decision,
  not a wiring one.
  **Stability note on row 4 specifically, found after the initial live-test
  passed:** `gemma-4-31b-it` returned a real `200` when first wired in, but a
  follow-up check shortly after got 4/4 `HTTP 500 INTERNAL` failures, with
  and without `temperature` set. Isolated to this one model ID — the same
  round of checks got clean `200`s from `gemma-4-26b-a4b-it` and
  `gemini-3.5-flash` — so this reads as an upstream regression on Google's
  side for this specific model, not this app's request shape or account. A
  bare `500` isn't assumed to self-clear the way `gemini-3.8-flash`'s
  documented `503` does, so no retry logic was added for it; re-check before
  relying on this card for a real pilot run.
- **Row 9 — architecture unconfirmed.** `cohere/north-mini-code:free` is new
  to this app; its `:free` listing on OpenRouter is confirmed live, but this
  app has no confirmed source (AA page, Cohere docs, or otherwise) for its
  actual architecture. Marked "Dense Transformer" in `script.js` as a default
  guess only, flagged rather than stated as fact — worth checking before the
  architecture badge is treated as authoritative anywhere.
- **Row 10 — known flakiness, unrelated to this round's changes.**
  `gemini-3.8-flash` has a standing history in this app of transient `503`
  "high demand" responses that clear on retry (documented since it was first
  added in the prior round; reconfirmed live again this round: one `503`, one
  `200` on immediate retry). Not specific to `reasoning_effort` or this
  rewire.

### Shared infrastructure changes this round

- **Client-side timeout added.** `callOpenAICompatChat()` now aborts any
  in-flight request after `REQUEST_TIMEOUT_MS` (40 seconds, picked from the
  30-45s range this was flagged at) via `AbortController`, instead of waiting
  indefinitely on a stuck upstream. A timed-out call surfaces as the same
  "CORS/Network" card state as any other no-response failure (see
  [How to use](#how-to-use)), with a message naming the timeout explicitly so
  it doesn't read as a real CORS block. 40s was chosen knowing at least one
  live response this round took ~85s under a transient `503`-then-retry
  pattern (`gemini-3.8-flash`, see above) — that's the outlier, not the norm,
  and a hung request blocking every other card in "Send to All" was judged
  the worse failure mode. **Per-model override, added after the fact:** row
  2 (`nemotron-3-ultra`) live-tested at a consistent ~120s (two independent
  runs: 120837ms, then 120313ms) on its OpenRouter `:free` route — 3x the
  40s default. `callOpenAICompatChat()` accepts an optional `timeoutMs` that
  overrides `REQUEST_TIMEOUT_MS` for one call, threaded through all three
  adapters; only `nemotron-3-ultra`'s `MODELS` entry passes it (`150000`).
  Every other card still uses the shared 40s default.
- **`reasoning_effort` support added.** `callOpenAICompatChat()` accepts an
  `extraBody` object merged into the JSON request body, threaded through
  `callGeminiCompat()`, `callGroq()`, and `callOpenRouter()`. This is how rows
  3, 8, and 10 set a specific reasoning/thinking level per entry without a
  separate adapter. **Temperature safeguard:** `extraBody` is spread into the
  body literal *before* `temperature: 0`, not after, specifically so nothing
  passed via `extraBody` can ever silently override the fixed temperature —
  confirmed still applied to all 10 current cards through the one shared
  builder, no per-adapter exceptions.
- **Array entries can no longer assume one `MODELS` entry = one unique model
  ID.** Rows 1/3 and (base model) 10 show the same underlying model ID can
  back multiple cards with different `extraBody` params — each needs its own
  unique `id` (used as the DOM lookup key) even though the upstream model ID
  repeats. `gemini-3-5-flash` / `gemini-3-5-flash-medium` and the plain
  `gemini-3-8-flash-high` naming in `script.js` follow this.

To swap models, edit the `MODELS` array at the top of `script.js` — each
entry defines its display name, provider, architecture badge, key, and call
function (now optionally taking a 4th `extraBody` argument). All 10 current
candidates go through the one shared `callOpenAICompatChat()` builder (Groq,
OpenRouter, and Gemini's OpenAI-compat layer are all confirmed OpenAI-shaped
for this round's candidates; NVIDIA NIM, Cohere, Mistral, and DeepSeek's
native endpoint are also compatible but currently unused — see below).

Every call is sent with `temperature: 0`, enforced once inside
`callOpenAICompatChat()`, ordered so `extraBody` can't override it — see
"Shared infrastructure changes" above.

## How to configure

Open `config.js` and paste each key between the empty quotes:

```js
const CONFIG = {
  GEMINI_API_KEY: "your-gemini-key",
  GROQ_API_KEY: "your-groq-key",
  OPENROUTER_API_KEY: "your-openrouter-key",
  NVIDIA_API_KEY: "your-nvidia-nim-key", // unused this round — see note below
  COHERE_API_KEY: "your-cohere-key", // unused this round — see note below
  MISTRAL_API_KEY: "your-mistral-key", // unused — see note below
  DEEPSEEK_API_KEY: "your-deepseek-key" // unused — see note below
};
```

`validateConfig()` in `script.js` only warns on missing/placeholder
`GEMINI_API_KEY`, `GROQ_API_KEY`, and `OPENROUTER_API_KEY` this round — those
are the only keys an active `MODELS` entry depends on. `NVIDIA_API_KEY` and
`COHERE_API_KEY` dropped out of that check this round (Nemotron moved to
OpenRouter, Cohere's slot is now `north-mini-code` via OpenRouter instead of
`command-a-plus` directly) but are left in `config.js`, same treatment as the
already-unused `MISTRAL_API_KEY`/`DEEPSEEK_API_KEY` — a one-line change per
card if a future round routes back through NIM or Cohere directly.

`config.js` is gitignored. `config.example.js` is the template. Rename and remove "example."

## How to use

1. (Optional) Type a **System Prompt** — sets role/tone for all models, e.g. "You are a doctor."
2. Type a **User Prompt** — the actual question or task.
3. Click **Send to All**. All 10 models are queried in parallel. Cards show a loading shimmer until each response arrives (or until the 40s client-side timeout — see above — cuts a stuck one off).
4. Each card displays the raw response text (never reformatted — this is why the Gemma cards show their `<thought>...</thought>` prefix, see above), a status (**OK** / **Failed** / **CORS/Network**), and elapsed time in ms.
   - **CORS/Network** means `fetch()` never got an HTTP response back — the browser blocked the request (most likely CORS), couldn't reach the host at all, or the client-side timeout fired. Browsers don't expose which of the three it was from the error alone, but a timeout's error message names itself explicitly. A real HTTP error response — a `429`, for instance — is **Failed**, not CORS/Network, even though both can look like "it didn't work" at a glance.
5. Click **Export JSON** to download the run (system prompt, user prompt, timestamp, every model's response) as a timestamped `.json` file.
6. Expand **Session History** at the bottom to see all runs from this browser session. Click any entry to restore that run into the grid.

> Note: session history lives only in browser memory. Refreshing the page clears it. Use Export to save anything you want to keep.
>
> This round's 10 candidates don't need `node nim-proxy.js` running — zero cards route through NVIDIA NIM. The proxy and its stagger logic (`NIM_STAGGER_MS`) are left in the codebase, inert, in case a future round moves a candidate back onto NIM — see [CORS notes](#cors-notes).

## CORS notes

CORS behavior per provider, confirmed with real requests from a live browser:

| Provider | CORS headers present? | Behavior |
|---|---|---|
| Groq, OpenRouter, Google (OpenAI-compat) | Yes | Called directly from the browser — covers all 10 of this round's candidates |
| Cohere, Mistral | Yes | Confirmed CORS-fine, but currently unused — no active card calls either |
| NVIDIA NIM | **No** | Would route through the local `nim-proxy.js` if used — currently inert, no active card routes through NIM this round |

NVIDIA's hosted `integrate.api.nvidia.com` API sends no `Access-Control-Allow-Origin` header, and a real browser call confirms it's actually blocked (not just missing on preflight). There's no officially supported way to enable it either — an NVIDIA staff reply on [their own developer forum](https://forums.developer.nvidia.com/t/please-handle-cors-to-make-it-possible-to-make-calls-from-the-browser/310061) only says "we'll keep this use case in mind." `callNvidia()` in `script.js` still uses the local proxy for this reason, but no `MODELS` entry calls it this round — both Nemotron candidates moved to OpenRouter instead (confirmed live with genuine `:free` pricing — see the model table above), which sends proper CORS headers and needs no proxy.

`nvidia/nemotron-3-ultra-550b-a55b:free` and `nvidia/nemotron-3-super-120b-a12b:free` (OpenRouter) — confirmed CORS-clean and called directly, same as every other OpenRouter-routed card.

`cohere/north-mini-code:free` (OpenRouter) — confirmed CORS-clean and called directly.

`gemma-4-31b-it` and `gemma-4-26b-a4b-it` (Google, direct) — same OpenAI-compat endpoint as the Gemini cards, same CORS behavior, no proxy.

A 400ms stagger between NIM-routed call starts (`NIM_STAGGER_MS` in `script.js`) exists from an earlier round's live run that showed a `503` and an unrelated-looking timeout land in the same batch — a shared-backend-under-load pattern on NIM's free tier. Left in place, fully inert this round (see above), not removed per instruction — this is shared, model-agnostic infrastructure, not specific to any one model that passed through it.

**OpenRouter `:free`-tagged routes — a standing, known failure mode, not new this round.** A prior round's `gemma-4-31b-it:free` card (then routed through OpenRouter) live-tested 4/4 failures in under 1.1s with `HTTP 429`, `"limit_source":"upstream_provider_shared_pool"` — external congestion on OpenRouter's shared free-tier routing, not this app's own traffic. `callOpenRouter()` retries up to 3 attempts total on `HTTP 429` specifically, 5 seconds apart, added in the prior round and still in place — this rides out transient upstream saturation, not a concurrency fix. Now relevant to 3 different cards this round (both Nemotron entries, North Mini Code) instead of just Gemma, since all three route through OpenRouter's `:free` tier.

**Newly found this round — a second, more serious OpenRouter failure shape: HTTP 200 with the real error buried in the body.** Live-tested on `nemotron-3-super`: 2 failures out of 8 identical calls came back as `HTTP 200` with no `choices` array at all, and a top-level `{"error":{"message":"Upstream error from Nvidia: Service temporarily overloaded","code":502}}` instead — OpenRouter apparently passing through whatever shape the specific upstream provider it happened to route to that instant returned, rather than always normalizing to a real HTTP error status. `callOpenAICompatChat()` previously only checked `res.ok` (the HTTP status) to decide success/failure, so this silently became `content: ""` — displayed in the grid as a misleading **OK** / *(empty response)*, indistinguishable from the model genuinely saying nothing, and — worse — never triggered `callOpenRouter()`'s 429 retry either, since no exception was ever thrown for it. **Fixed:** `callOpenAICompatChat()` now checks the parsed body for a top-level `error` field regardless of `res.ok` and throws a real error for it; `callOpenRouter()`'s retry condition now also matches this shape (`"Upstream error in HTTP 200 response..."`), not just literal `HTTP 429`. This is a correctness fix, not just cosmetic — before it, a real upstream failure on any OpenRouter-routed card could have been silently recorded as a successful empty response in an exported run.

## File structure

- `index.html` - UI layout, loads config.js then script.js
- `style.css` - Dark theme, responsive grid, skeleton animation
- `script.js` - Model registry, send logic, history, provider adapters
- `nim-proxy.js` - Minimal local CORS proxy for NVIDIA NIM (currently inert — no active card routes through NIM this round, see CORS notes)
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
> ID, back via a completely separate rewire doc's own inclusion.)
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
> `gemini-3.8-flash` did, at #10, now with `reasoning_effort: "high"` forced.)

</details>

