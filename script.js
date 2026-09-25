/*
  Each entry describes one model card on the grid. To add a new model, append
  a new object here with:
    id            - unique key used as the card's data-model-id (DOM lookup)
    name          - label shown in the card header
    provider      - sub-label shown under the name
    architecture  - "Dense Transformer" or "MoE"; controls badge styling
    keyName       - which CONFIG.* field this model needs to authenticate
    adapter       - provider function (callGeminiCompat / callGroq / callOpenRouter)
    upstream      - the provider's own model ID, as sent in the request
    params        - optional per-model request fields (e.g. reasoning_effort)
    timeoutMs     - optional per-model timeout override (default REQUEST_TIMEOUT_MS)
  call(sys,user) is attached automatically below from adapter/upstream/params/
  timeoutMs, so the request and the exported run record can never disagree about
  which model ID or settings were used.
*/
/*
  The original 4 models (Gemini 2.5 Flash, Mistral Small [mistral-small-latest],
  Llama 3.3 70B Versatile, Llama 4 Scout) were removed from this grid entirely —
  all four, not just the two that had started 404ing on Groq. They predate the
  Stage 1 accessibility-then-benchmark selection process that the current
  candidates went through, so mixing them into the same comparison grid would
  blur two different selection methodologies.

  Every prior Stage 1 long-list is replaced wholesale, not merged — see README
  for the full lineage of earlier rounds. This array holds the Stage 1
  long-list DECIDED 2026-09-15 (THS-ST2-Stage1-LLM-Selection.md §1–§2, rules
  R1–R9), which replaced the 2026-09-14 set:
    - free-tier access only, documented by the provider (R1, R2)
    - both AA benchmarks required — no GPQA-D-only "Tier 2" entries (R4)
    - ranked by GPQA-D + IFBench sum (R5)
    - one card per model, at its highest-scoring benchmarked setting, fixed
      for every run like temperature (R6)
    - standing free access only: no trial/evaluation keys, one-time
      credits, or free routes governed by trial / evaluation-only terms
      (R1); no preview models, and no models with an announced shutdown
      date (R3)
    - a model's fixed setting is its highest-scoring benchmarked setting
      that completes within the provider's free-tier limits (R6)
  First 2026-09-15 rewire: removed gemini-3-5-flash-medium (same model as #1,
  lower-scoring setting — R6) and gemini-3-8-flash-high (GPQA-D only — R4);
  added gpt-oss-20b-high and nemotron-3-nano-omni. Second 2026-09-15 rewire
  (after the replacement search, THS-ST2-Stage1-Replacement-Search.md):
  removed gemini-3-1-flash-lite (Google's deprecations page lists a May 7,
  2027 shutdown date — R3); added gemini-2-5-flash. Third 2026-09-15 rewire
  (after the before-freezing checks): removed nemotron-3-ultra,
  nemotron-3-super and nemotron-3-nano-omni (their OpenRouter :free routes are
  served under the NVIDIA API Trial Terms — "limited trial purposes only and
  without use ... in production" — R1); switched gpt-oss-20b from "high" to
  "low" ("high" never finishes within Groq's free 8K tokens-per-minute cap —
  R6); added a shared MAX_TOKENS cap and Gemini/Groq retries (see
  callOpenAICompatChat(), callGeminiCompat(), callGroq()). The list now has 7
  eligible models, not 10. All cards live-verified (see
  ../stage1-evidence/2026-09-15/calls/).
  AA score figures themselves are taken from the Stage 1 handout — this app
  verifies *access*, not AA's own numbers.

  STAGE 2 RESULT (2026-09-25): 4 of the 7 passed and move on to formal
  evaluation (manuscript §5.3). MODELS below is now exactly those 4 finalists;
  the 3 excluded models moved to MODELS_DORMANT, each with its exclusion reason.
  Finalists keep temperature 0, max_tokens 7400 and their provider routing
  exactly as Stage 2 ran them.
*/
const MODELS = [
  {
    // STAGE 2 FINALIST (Stage 3 formal evaluation). Stage 1 score 168.5.
    // #1, combined 168.5 (GPQA-D 92.2 / IFBench 76.3). Google AI Studio
    // direct, no reasoning_effort override — left at Gemini's documented
    // default for this model, which is dynamic/auto thinking (Google's docs:
    // "Gemini models engage in dynamic thinking by default, automatically
    // adjusting reasoning effort based on request complexity"). AA also
    // scored a forced-"medium" setting (166.7); under R6 this model gets one
    // card, at the higher-scoring default, so the former
    // gemini-3-5-flash-medium card was removed.
    id: "gemini-3-5-flash",
    name: "gemini-3.5-flash",
    provider: "Google",
    architecture: "Dense Transformer",
    keyName: "GEMINI_API_KEY",
    adapter: callGeminiCompat,
    upstream: "gemini-3.5-flash"
  },
  {
    // STAGE 2 FINALIST (Stage 3 formal evaluation). Stage 1 score 151.6.
    // #3, combined 151.6 (GPQA-D 79.2 / IFBench 72.4). Same route family as
    // gemma-4-31b (now in MODELS_DORMANT): Google's own Gemini API directly, NOT
    // OpenRouter — listed in this account's native GET /v1beta/models catalog,
    // real 200 via the OpenAI-compat endpoint. Same display note applies:
    // reasoning text embeds directly in message content as
    // "<thought>...</thought>".
    // TIMEOUT (2026-09-25): the 2026-09-15 `timeoutMs: 90000` override (a real
    // Appendix D.5 prompt ran past the old 40s default) is dropped — the shared
    // REQUEST_TIMEOUT_MS is now 180000, the value every Stage 2 export records.
    id: "gemma-4-26b-a4b",
    name: "gemma-4-26b-a4b-it",
    provider: "Google",
    architecture: "Dense Transformer",
    keyName: "GEMINI_API_KEY",
    adapter: callGeminiCompat,
    upstream: "gemma-4-26b-a4b-it"
  },
  {
    // STAGE 2 FINALIST (Stage 3 formal evaluation). Stage 1 score 133.3.
    // #5, combined 133.3 (GPQA-D 75.7 / IFBench 57.6). OpenRouter's
    // `cohere/north-mini-code:free`, confirmed via GET /v1/models and the
    // per-model endpoints API with genuine $0 pricing (served by Cohere).
    // ARCHITECTURE RESOLVED 2026-09-15: OpenRouter's model description says "A
    // sparse mixture-of-experts model with 30B total parameters and 3B active"
    // (saved in ../stage1-evidence/2026-09-15/docs/openrouter/), so the badge is
    // now "MoE" (it was previously a "Dense Transformer" guess). Also the
    // weakest task fit on the list: a coding-agent model with a low IFBench
    // score.
    // QUOTA (2026-09-25): this route is governed by OpenRouter's free-model
    // daily request cap (50/day on this key — GET /api/v1/key ->
    // free_model_daily_requests), NOT by Cohere's direct-API trial headers that
    // logCohereQuota()/callCohere() read; those never applied to this route.
    // See assertOpenRouterQuota().
    id: "north-mini-code",
    name: "north-mini-code",
    provider: "Cohere (via OpenRouter)",
    architecture: "MoE",
    keyName: "OPENROUTER_API_KEY",
    adapter: callOpenRouter,
    upstream: "cohere/north-mini-code:free"
  },
  {
    // STAGE 2 FINALIST (Stage 3 formal evaluation). Stage 1 score 129.3.
    // #6, combined 129.3 (GPQA-D 79.0 / IFBench 50.3). ADDED in the second
    // 2026-09-15 rewire, found by the replacement search. AA's record is
    // "Gemini 2.5 Flash (Reasoning)" — this model's default is dynamic
    // thinking (on), so no reasoning_effort override is sent; its
    // "(Non-reasoning)" setting scored lower (107.3), so under R6 this card
    // uses the default. Note: AA's separate "Gemini 2.5 Flash Preview
    // (Sep '25)" record is a different model ID, not this one. Free access
    // documented on Google's Gemini API pricing page (Free Tier: "Free of
    // charge"); deprecations page: "No shutdown date announced" (both saved in
    // ../stage1-evidence/2026-09-15/docs/). Live-verified 2026-09-15 (HTTP
    // 200). AVAILABILITY RISK, flagged: Google already returns "no longer
    // available to new users" for gemini-2.5-pro and gemini-2.5-flash-lite.
    id: "gemini-2-5-flash",
    name: "gemini-2.5-flash",
    provider: "Google",
    architecture: "Dense Transformer",
    keyName: "GEMINI_API_KEY",
    adapter: callGeminiCompat,
    upstream: "gemini-2.5-flash"
  }
];

/*
  DORMANT — the 3 Stage 1 candidates excluded at Stage 2 (Stage 2 results, 4
  finalists decided). Kept here, not deleted, so the history stays visible in code.
  These entries are NOT rendered as cards, get no call(), and are never sent to.
  Because both Groq models are in here and no finalist routes through Groq,
  callGroq() below is now fully inert (see its comment). To bring one back, move
  its entry into MODELS (and drop the excludedAt/excludedReason fields).
*/
const MODELS_DORMANT = [
  {
    // EXCLUDED at Stage 2 (score 161.3): failed C2 on S2-P3 (R017, R019, R026 resolved to fail).
    // #2, combined 161.3 (GPQA-D 85.7 / IFBench 75.6). Google's own Gemini API
    // directly, NOT OpenRouter's `google/gemma-4-31b-it:free` (still on
    // OpenRouter's catalog, just not used for this slot). `gemma-4-31b-it` is
    // listed in this account's native GET /v1beta/models catalog and responds
    // via the same OpenAI-compat endpoint the Gemini cards use. WHY NOT
    // OPENROUTER: its `:free` gemma route has a documented history in this app
    // of failing on shared-pool congestion (see callOpenRouter()'s comment).
    // DISPLAY NOTE, flagged (see callGeminiCompat()'s comment for detail):
    // this route's responses embed a "<thought>...</thought>" reasoning
    // prefix directly in the visible message content — the raw-response
    // display will show it as-is.
    //
    // STABILITY NOTE, flagged: worked at wiring time (real 200), then 4/4
    // `HTTP 500 INTERNAL` failures shortly after, with and without
    // `temperature` set; re-checked 2026-09-15: 2/3 `HTTP 500`, 1 `200`, with
    // 22–38 s latency on a one-word prompt. Isolated to this model ID (the
    // same request shape against gemma-4-26b-a4b-it and gemini-3.5-flash
    // returned clean 200s), so it looks like an upstream problem on Google's
    // side. Re-checked again 2026-09-15 (before-freezing checks): 3 of 7 calls
    // succeeded (24–34 s); the rest were 500/503, including a 500 on a real
    // D.5 prompt. KEPT by group decision: callGeminiCompat() now retries HTTP
    // 500/503, and this card passes timeoutMs: 90000 because successful calls
    // take up to ~34 s and a 503 can take ~58 s to come back. Persistent
    // failures count as infrastructure failures under the Stage 2 protocol
    // (§8), not as task failures.
    id: "gemma-4-31b",
    name: "gemma-4-31b-it",
    provider: "Google",
    architecture: "Dense Transformer",
    keyName: "GEMINI_API_KEY",
    adapter: callGeminiCompat,
    upstream: "gemma-4-31b-it",
    timeoutMs: 90000,
    excludedAt: "Stage 2",
    excludedReason: "Failed C2 on S2-P3 (R017, R019, R026 resolved to fail)"
  },
  {
    // EXCLUDED at Stage 2 (score 147.2): failed C1 on S2-P2 all 3 runs (likely reasoning consumed the 7,400-token budget); also failed C2 on S2-P2 and S2-P3.
    // #4, combined 147.2 (GPQA-D 78.2 / IFBench 69.0). `reasoning_effort:
    // "high"` forced — that's the setting AA benchmarked, and Groq's own
    // default for gpt-oss is "medium" (Groq API reference), so it's set
    // explicitly. Groq's endpoint accepts reasoning_effort as a top-level
    // field and returns reasoning in a separate message.reasoning field (not
    // mixed into message.content the way Gemma's is) — only the content field
    // is surfaced to the card, per callOpenAICompatChat()'s return. Free
    // access documented in Groq's rate-limits page, Free Plan table (30 RPM,
    // 1K RPD, 8K TPM, 200K TPD); the 8K TPM cap may bite on long
    // high-reasoning responses.
    id: "gpt-oss-120b-high",
    name: "gpt-oss-120b (high)",
    provider: "Groq",
    architecture: "MoE",
    keyName: "GROQ_API_KEY",
    adapter: callGroq,
    upstream: "openai/gpt-oss-120b",
    params: { reasoning_effort: "high" },
    excludedAt: "Stage 2",
    excludedReason: "Failed C1 on S2-P2 all 3 runs (likely reasoning consumed the 7,400-token budget); also failed C2 on S2-P2 and S2-P3"
  },
  {
    // EXCLUDED at Stage 2 (score 118.9): failed C2 on S2-P2/S2-P3 and C3 on S2-P4/S2-P5.
    // #7, combined 118.9 (GPQA-D 61.1 / IFBench 57.8) at `reasoning_effort:
    // "low"`. CHANGED in the third 2026-09-15 rewire from "high" (133.9):
    // on real Appendix D.5 prompts, "high" spent the whole 7,400-token budget
    // on reasoning and never produced an answer, and Groq's Free Plan caps
    // this model at 8K tokens per minute, so there's no room to raise it. "low"
    // is the next-highest setting AA benchmarked and returned valid JSON (12
    // microtasks, ~750 tokens, 1–1.5 s) on the same prompts
    // (../stage1-evidence/2026-09-15/calls/freeze-checks/). Rule R6 was amended
    // to "highest-scoring benchmarked setting that completes within the
    // provider's free-tier limits." Separate card from #4 because it's a
    // different model (different weights). Free access documented in Groq's
    // Free Plan table (30 RPM, 1K RPD, 8K TPM, 200K TPD).
    id: "gpt-oss-20b-low",
    name: "gpt-oss-20b (low)",
    provider: "Groq",
    architecture: "MoE",
    keyName: "GROQ_API_KEY",
    adapter: callGroq,
    upstream: "openai/gpt-oss-20b",
    params: { reasoning_effort: "low" },
    excludedAt: "Stage 2",
    excludedReason: "Failed C2 on S2-P2/S2-P3, C3 on S2-P4/S2-P5"
  }
];

/*
  Attach each entry's call() from its adapter/upstream/params/timeoutMs. Done
  here rather than inline in the array so that what gets sent and what gets
  logged in the export come from the same fields (added 2026-09-16 for the
  Stage 2 runs).
*/
MODELS.forEach((model) => {
  model.call = (sys, user) => model.adapter(model.upstream, sys, user, model.params, model.timeoutMs);
});

/*
  APP_VERSION is written into every exported run so a result file can be traced
  back to the exact interface version that produced it.
*/
const APP_VERSION = "stage3-v1.0 (4 Stage 2 finalists), export schema 2 — 2026-09-25";

/*
  IN-MEMORY STATE - Nothing is persisted to disk or localStorage, refreshing the 
  page clears everything. Use the Export button to save a run to a JSON file.
    sessionHistory - all runs made this session, newest first
    lastRun        - the run currently displayed in the grid (used by Export)
*/
const sessionHistory = [];
let lastRun = null;

// Wait until the DOM is parsed before wiring up handlers and building the grid.
document.addEventListener("DOMContentLoaded", () => {
  validateConfig();
  buildGrid();
  document.getElementById("send-btn").addEventListener("click", handleSend);
  document.getElementById("export-btn").addEventListener("click", handleExport);
});

// The CONFIG keys the active MODELS entries need (deduplicated).
function requiredKeyNames() {
  return [...new Set(MODELS.map((m) => m.keyName))];
}

/*
  validateConfig() - Shows a warning banner if config.js is missing or any API 
  key is blank or still set to the placeholder string. Models with missing keys 
  will fail at call time, but this gives the user an upfront heads-up.
*/
function validateConfig() {
  const banner = document.getElementById("config-warning");

  // CONFIG is defined as a global in config.js. If that script wasn't loaded
  // (e.g. file was never created), CONFIG won't exist at all.
  if (typeof CONFIG === "undefined") {
    banner.classList.remove("hidden");
    banner.textContent = "config.js not loaded. Copy config.example.js to config.js and fill in your API keys.";
    return;
  }

  // Collect any keys that are empty or still the placeholder value. Only
  // checks keys an active MODELS entry actually depends on — from the 4 Stage 2
  // finalists that is GEMINI_API_KEY and OPENROUTER_API_KEY. GROQ_API_KEY is no
  // longer needed (both Groq models are in MODELS_DORMANT). NVIDIA_API_KEY and
  // COHERE_API_KEY stay out of this check — no current card uses either
  // (see callNvidia() / callCohere() for the still-intact-but-unused
  // adapters). DEEPSEEK_API_KEY and MISTRAL_API_KEY are excluded for the same
  // reason (see callDeepSeek() / callMistral()).
  const missing = [];
  for (const key of requiredKeyNames()) {
    const val = CONFIG[key];
    if (!val || val === "your-key-here") missing.push(key);
  }
  if (missing.length) {
    banner.classList.remove("hidden");
    banner.innerHTML = `Missing or placeholder API keys in <code>config.js</code>: ${missing.join(", ")}. Models using these keys will fail.`;
  }
}

/*
  buildGrid() - Creates one card per model in the response grid. Cards start in an 
  "Awaiting prompt…" state and are mutated later by setCardLoading() / setCardResult().
*/
function buildGrid() {
  const grid = document.getElementById("response-grid");
  grid.innerHTML = "";
  for (const model of MODELS) {
    const card = document.createElement("div");
    card.className = "card";
    // data-model-id lets us look up this specific card later by model.
    card.dataset.modelId = model.id;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">
          <span class="card-model">${escapeHtml(model.name)}</span>
          <span class="card-provider">${escapeHtml(model.provider)}</span>
        </div>
        <span class="badge ${model.architecture === "MoE" ? "moe" : "dense"}">${model.architecture}</span>
      </div>
      <div class="card-body" data-role="body">
        <span class="placeholder" style="color: var(--text-muted);">Awaiting prompt…</span>
      </div>
      <div class="card-footer">
        <span data-role="status"></span>
        <span data-role="time"></span>
      </div>
    `;
    grid.appendChild(card);
  }
}

/*
  setCardLoading() - Replaces a card's body with the skeleton-shimmer animation and shows
  "Loading…" in the footer. Called for every card right before sending.
*/
function setCardLoading(modelId) {
  const card = document.querySelector(`.card[data-model-id="${modelId}"]`);
  if (!card) return;
  const body = card.querySelector('[data-role="body"]');
  body.classList.remove("error");
  // 5 skeleton lines of varying widths to imitate paragraph text.
  body.innerHTML = `
    <div class="skeleton">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
  `;
  card.querySelector('[data-role="status"]').textContent = "Loading…";
  card.querySelector('[data-role="time"]').textContent = "";
}

/*
  setCardResult() - Renders a final result into a card — either the model's text 
  response or an error message — plus the elapsed time. Errors are styled red but 
  don't affect any other cards.
*/
function setCardResult(modelId, result) {
  const card = document.querySelector(`.card[data-model-id="${modelId}"]`);
  if (!card) return;
  const body = card.querySelector('[data-role="body"]');
  const status = card.querySelector('[data-role="status"]');
  const time = card.querySelector('[data-role="time"]');
  if (result.error) {
    body.classList.add("error");
    body.textContent = `Error: ${result.error}`;
    // fetch() throwing before an HTTP response ever came back usually means
    // the browser blocked the request itself (CORS) or couldn't reach the
    // host at all — distinct from a real HTTP error the server returned.
    status.innerHTML = result.networkError
      ? `<span class="tag-cors">CORS/Network</span>`
      : `<span class="tag-fail">Failed</span>`;
  } else {
    body.classList.remove("error");
    // Use textContent (not innerHTML) so model output can't inject HTML.
    body.textContent = result.text || "(empty response)";
    status.innerHTML = `<span class="tag-ok">OK</span>`;
  }
  time.textContent = `${result.ms} ms`;
}

/*
  callModel() - Runs one model's call() with timing + error handling, and
  writes the result into that model's card. Pulled out of handleSend() so
  every model goes through identical result-shaping logic.
*/
async function callModel(model, sysPrompt, userPrompt) {
  const start = performance.now();
  try {
    const text = await model.call(sysPrompt, userPrompt);
    const ms = Math.round(performance.now() - start);
    const result = {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      architecture: model.architecture,
      upstreamModelId: model.upstream,
      requestParams: model.params ?? null,
      timeoutMs: model.timeoutMs ?? REQUEST_TIMEOUT_MS,
      text,
      ms,
      error: null
    };
    setCardResult(model.id, result);
    return result;
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    const result = {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      architecture: model.architecture,
      upstreamModelId: model.upstream,
      requestParams: model.params ?? null,
      timeoutMs: model.timeoutMs ?? REQUEST_TIMEOUT_MS,
      text: null,
      ms,
      error: err.message || String(err),
      networkError: err instanceof NetworkError
    };
    setCardResult(model.id, result);
    return result;
  }
}

/*
  handleSend() - Click handler for the "Send to All" button. Reads the two prompt fields,
  hands them to dispatchToAll(), and keeps the buttons in the right state
  around it.
*/
async function handleSend() {
  const sysPrompt = document.getElementById("system-prompt").value.trim();
  const userPrompt = document.getElementById("user-prompt").value.trim();
  const runLabel = document.getElementById("run-label").value.trim();
  if (!userPrompt) {
    alert("Please enter a user prompt.");
    return;
  }

  // Disable the Send button while requests are in flight to prevent
  // double-submits.
  const sendBtn = document.getElementById("send-btn");
  const exportBtn = document.getElementById("export-btn");
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  try {
    await dispatchToAll(sysPrompt, userPrompt, runLabel);
    exportBtn.disabled = false;
  } catch (err) {
    // Only QuotaError gets here (nothing was sent) — every other failure is
    // already recorded per card inside callModel().
    alert(err.message || String(err));
  } finally {
    // Re-enable the Send button.
    sendBtn.disabled = false;
    sendBtn.textContent = "Send to All";
  }
}

/*
  dispatchToAll() - The body of "Send to All", pulled out of handleSend() (and
  otherwise unchanged) so the Stage 3 batch runner (batch.js) sends through
  exactly the same path a manual click does. Fires every model in parallel via
  Promise.all, updates each card as its response arrives, records the run in
  sessionHistory and returns it.

  models defaults to every active model. The batch runner passes just the
  failed models when it re-sends after an API failure, so a retry doesn't
  spend free-tier quota (north-mini-code's is 50 requests a day) on models
  that already succeeded.

  strictQuota is for unattended runs: it makes the OpenRouter quota check fail
  closed (see assertOpenRouterQuota()). A manual click stays lenient.
*/
async function dispatchToAll(sysPrompt, userPrompt, runLabel, { models = MODELS, strictQuota = false } = {}) {
  // Checked before anything is sent, so a refusal costs no calls.
  await assertOpenRouterQuota(models, { strict: strictQuota });

  // Show skeletons on every card up front, before any network calls.
  for (const m of models) setCardLoading(m.id);

  // Timestamp for the run, used in history entries and export filenames.
  const startedAt = new Date().toISOString();

  // Promise.all dispatches every model's request concurrently. Each model
  // is wrapped in its own try/catch (inside callModel) so a single failure
  // doesn't reject the whole batch — failed models just record an error and
  // the others continue.
  const results = await Promise.all(models.map((model) => callModel(model, sysPrompt, userPrompt)));

  // Record this run for history + export. unshift() puts newest first.
  lastRun = {
    runLabel: runLabel || null,
    timestamp: startedAt,
    appVersion: APP_VERSION,
    // Conditions held constant for every model on every run (Stage 1 v1.0 /
    // manuscript 5.2). Recorded here so an exported run is self-describing.
    fixedConditions: { temperature: 0, max_tokens: MAX_TOKENS, providerJsonMode: false },
    systemPrompt: sysPrompt,
    userPrompt,
    responses: results
  };
  sessionHistory.unshift(lastRun);
  renderHistory();
  return lastRun;
}

/*
  exportFileName() - The download name for a run: run label first so exports
  sort by prompt and run (e.g. llm-run-S2-P1-run1-2026-....json), then the
  run's timestamp with : and . swapped for - so it's filesystem-safe on Windows.
  Shared by handleExport() and the batch runner so both name files identically.
*/
function exportFileName(run) {
  const safeStamp = run.timestamp.replace(/[:.]/g, "-");
  const safeLabel = run.runLabel ? run.runLabel.replace(/[^A-Za-z0-9._-]/g, "-") + "-" : "";
  return `llm-run-${safeLabel}${safeStamp}.json`;
}

/*
  handleExport() - Serializes lastRun to JSON, creates an in-memory Blob, and 
  triggers a download via a temporary <a> element.
*/
function handleExport() {
  if (!lastRun) return;
  const blob = new Blob([JSON.stringify(lastRun, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFileName(lastRun);
  document.body.appendChild(a);
  a.click();
  // Clean up the temporary link and free the blob URL.
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/*
  renderHistory () - Rebuilds the session history list from sessionHistory. Each 
  <li> shows the truncated prompt, a wall-clock time, and ok/fail counts, and is 
  clickable to restore that run.
*/
function renderHistory() {
  const list = document.getElementById("history-list");
  const count = document.getElementById("history-count");
  count.textContent = sessionHistory.length;
  list.innerHTML = "";
  sessionHistory.forEach((run, idx) => {
    const li = document.createElement("li");
    li.className = "history-item";
    // Trim long prompts for the list — full prompt is still in run.userPrompt.
    const truncated = run.userPrompt.length > 90 ? run.userPrompt.slice(0, 90) + "…" : run.userPrompt;
    const okCount = run.responses.filter((r) => !r.error).length;
    const failCount = run.responses.length - okCount;
    const time = new Date(run.timestamp).toLocaleTimeString();
    li.innerHTML = `
      <div class="history-prompt">${run.runLabel ? `<strong>${escapeHtml(run.runLabel)}</strong> — ` : ""}${escapeHtml(truncated)}</div>
      <div class="history-meta">
        <span>${time}</span>
        <span class="tag-ok">${okCount} ok</span>
        ${failCount ? `<span class="tag-fail">${failCount} failed</span>` : ""}
      </div>
    `;
    li.addEventListener("click", () => restoreRun(idx));
    list.appendChild(li);
  });
}

/*
  restoreRun() - Replays a stored run into the UI: refills the prompt textareas 
  and pushes each model's old response back into its card. Also makes that run 
  the current lastRun so Export downloads the right thing.
*/
function restoreRun(idx) {
  const run = sessionHistory[idx];
  if (!run) return;
  document.getElementById("system-prompt").value = run.systemPrompt;
  document.getElementById("user-prompt").value = run.userPrompt;
  document.getElementById("run-label").value = run.runLabel || "";
  for (const model of MODELS) {
    const r = run.responses.find((x) => x.modelId === model.id);
    if (r) setCardResult(model.id, r);
  }
  lastRun = run;
  document.getElementById("export-btn").disabled = false;
}

/*
  PROVIDER ADAPTERS - Each function takes (systemPrompt, userPrompt) and returns
  the model's text response. They throw on HTTP errors so handleSend can route
  to the error branch of the card.
*/

/*
  NetworkError - Thrown when fetch() itself rejects, i.e. no HTTP response
  ever came back. Browsers deliberately don't distinguish "blocked by CORS"
  from "couldn't reach the host" in this case, so we can't either — but we
  CAN distinguish this from a real HTTP error response, which is what
  handleSend() uses to show a separate "CORS/Network" badge instead of
  "Failed".
*/
class NetworkError extends Error {}

// Client-side timeout for every provider call. Previously there was no
// bound at all: a stuck upstream (a 503 that never resolves, a dropped
// connection) left a card spinning indefinitely instead of failing fast.
// 40s picked as a middle point in the 30-45s range this was flagged at —
// long enough that a real-but-slow response (observed up to ~85s on a
// congested Gemini call, but that's the outlier, not the norm) isn't cut
// off pre-emptively for every model, short enough that a hung card doesn't
// block reading results from every other card in "Send to All".
// CHANGED 2026-09-25 from 40000 to 180000 for the Stage 3 run. Every Stage 2
// export records `timeoutMs: 180000` on every card, but the committed code said
// 40000 (90000 for the Gemma cards) — the runner's copy had evidently been
// changed without being committed. This puts the repo back in line with what
// produced the evidence. It only bounds how long a hung call may sit before it
// is logged as an API failure; it does not change any response.
const REQUEST_TIMEOUT_MS = 180000;

// Uniform output cap sent with EVERY request (like temperature). Added in the
// third 2026-09-15 rewire: without any max_tokens, Groq's gpt-oss models fell
// back to a short provider default (3,072 / 2,048 tokens) and stopped
// mid-reasoning with no answer on real Appendix D.5 prompts. 7400 was the
// largest value that fits under Groq's Free Plan cap of 8K tokens per minute
// per model with a ~350-token prompt; gpt-oss-120b (high) completed with
// valid JSON at ~4,300–4,800 total tokens. Kept identical across all cards so
// every model runs under the same conditions (manuscript §5.2). Revisit if the
// Stage 2 dry run shows any model finishing with finish_reason "length".
const MAX_TOKENS = 7400;

/*
  callOpenAICompatChat() — Shared request builder for any provider exposing
  an OpenAI-shaped chat completions endpoint (system/user messages in,
  choices[0].message.content out). Confirmed compatible: NVIDIA NIM, Groq,
  DeepSeek, Mistral, and Google's Gemini OpenAI-compat layer. Always sends
  temperature: 0 — every adapter below goes through this, so there's a
  single place enforcing it instead of six copies that could drift.

  extraBody, when passed, is merged into the JSON request body — currently
  used for reasoning_effort (Gemini's OpenAI-compat layer and Groq's
  gpt-oss models both accept it as a top-level field; confirmed live for
  both, not assumed from docs). extraBody is spread BEFORE temperature in
  the body literal below, not after, specifically so a future extraBody
  value can never silently override temperature: 0 — that field stays the
  last word no matter what a caller passes in.

  max_tokens is set the same way: MAX_TOKENS is spread after extraBody, so no
  caller can change the shared output cap for one card.

  timeoutMs, when passed, overrides REQUEST_TIMEOUT_MS for this call only —
  originally added for nemotron-3-ultra (removed 2026-09-15), which took ~120s
  on OpenRouter's free route; now used by gemma-4-31b (90s, see its MODELS
  entry). Left as a per-call override rather than raising the global default,
  so every other card still fails fast on a real hang.
*/
async function callOpenAICompatChat({ endpoint, apiKey, apiKeyName, modelId, systemPrompt, userPrompt, onResponse, extraBody, timeoutMs = REQUEST_TIMEOUT_MS }) {
  if (!apiKey || apiKey === "your-key-here") throw new Error(`${apiKeyName} not set`);
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: modelId, messages, ...extraBody, max_tokens: MAX_TOKENS, temperature: 0 }),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new NetworkError(`Timed out after ${timeoutMs}ms waiting for a response`);
    }
    throw new NetworkError(err.message || "Network error (fetch failed before a response was received)");
  } finally {
    clearTimeout(timeoutId);
  }
  // Optional hook for a caller that needs to inspect response headers (e.g.
  // Cohere's trial-quota headers) without changing what this function
  // returns to everyone else. No other current caller passes this.
  if (onResponse) onResponse(res);
  if (!res.ok) {
    // Truncate the error body so a giant HTML 500 page doesn't fill the card.
    // A 429 keeps more (1500 chars, 2026-09-25): Google's puts the quotaId
    // (per-minute vs per-day) well past 200 chars, and the Stage 3 batch needs
    // it to tell a limit to wait out from a fault to retry. Error text only —
    // no effect on any successful response.
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, res.status === 429 ? 1500 : 200)}`);
  }
  const data = await res.json();
  // OpenRouter (confirmed live; not seen from the other providers here) can
  // return HTTP 200 with no `choices` at all and the real failure buried in
  // a top-level `error` field instead — e.g. an upstream 502 "Service
  // temporarily overloaded" from whichever provider it routed to behind a
  // :free tag. Without this check that silently became `content: ""`,
  // which the UI then shows as a misleading "OK" / "(empty response)" —
  // indistinguishable from the model genuinely saying nothing. Checked
  // regardless of res.ok, since this is a 200 wrapping a real failure.
  if (data.error) {
    const code = data.error.code ? ` (${data.error.code})` : "";
    throw new Error(`Upstream error in HTTP 200 response${code}: ${data.error.message || JSON.stringify(data.error)}`);
  }
  return data?.choices?.[0]?.message?.content ?? "";
}

/*
  callGeminiCompat() — Google's Gemini OpenAI-compatible layer. GEMINI_API_KEY
  is sent as a Bearer token here (Google's native REST API instead takes it as
  a query param, but that adapter isn't used by any current candidate).

  Used for both the native Gemini Flash cards (3.5 / 2.5) AND
  the two Gemma cards (4-31b-it, 4-26b-a4b-it) — confirmed live that this same
  endpoint serves Gemma model IDs directly under this account's GEMINI_API_KEY
  (both listed in a native GET /v1beta/models call, both returned real 200s
  here), not just via OpenRouter. NOTE: Gemma's responses embed a
  "<thought>...reasoning text...</thought>" prefix directly inside
  message.content (confirmed live) — unlike the Gemini-proper cards and unlike
  Groq's gpt-oss (which returns reasoning in a separate message.reasoning
  field, not mixed into content). This app displays response text raw/
  unmodified, so the Gemma cards will visibly show that thought prefix. Not
  stripped here — flagged instead, since silently stripping it would be a
  product decision, not a wiring one.

  extraBody is forwarded straight through to callOpenAICompatChat() — this is
  how a card sets reasoning_effort without needing a separate adapter. No
  current Gemini card passes one (the gemini-3.5-flash medium and
  gemini-3.8-flash high cards that did were removed in the 2026-09-15
  rewire), but the path is kept for future use. Confirmed live: reasoning_effort is accepted as a top-level body
  field (not nested under extra_body) by this endpoint.
*/
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 5000;
async function callGeminiCompat(modelId, systemPrompt, userPrompt, extraBody, timeoutMs) {
  // Retries HTTP 500 / 503 only (added 2026-09-15 for gemma-4-31b-it, which
  // returned 500 INTERNAL or 503 "high demand" on 4 of 7 calls in the
  // before-freezing checks; gemini-3.8-flash earlier showed the same 503).
  // Other errors (400, 404, 429 quota) are real and surface immediately.
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      return await callOpenAICompatChat({
        endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        apiKey: CONFIG.GEMINI_API_KEY,
        apiKeyName: "GEMINI_API_KEY",
        modelId,
        systemPrompt,
        userPrompt,
        extraBody,
        timeoutMs
      });
    } catch (err) {
      const isRetryable = err instanceof Error && /^HTTP 50[03]/.test(err.message);
      if (!isRetryable || attempt === GEMINI_MAX_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, GEMINI_RETRY_DELAY_MS));
    }
  }
}

/*
  callGroq() — Groq Cloud, OpenAI-compatible chat completions endpoint.
  Shared by every Groq-hosted card; the caller picks the model by passing
  modelId. extraBody forwards through to callOpenAICompatChat() — used by the
  gpt-oss-120b (high) card to set reasoning_effort: "high"; confirmed live
  that Groq's endpoint accepts this field the same way Gemini's does.

  FULLY DORMANT since Stage 2 (2026-09-25): both Groq-hosted models
  (gpt-oss-120b, gpt-oss-20b) were excluded and now live in MODELS_DORMANT,
  and none of the 4 finalists routes through Groq. Nothing in MODELS calls
  this function. Left intact, not deleted, same treatment as callMistral() /
  callNvidia() / callDeepSeek().
*/
const GROQ_MAX_ATTEMPTS = 3;
const GROQ_RETRY_DELAY_MS = 20000;
async function callGroq(modelId, systemPrompt, userPrompt, extraBody, timeoutMs) {
  // Retries HTTP 429 only (added 2026-09-15). Groq's Free Plan allows 8K
  // tokens per minute per model, and one gpt-oss-120b (high) response uses
  // ~4,300–4,800 tokens, so two sends of the same prompt within a minute hit
  // 429 (seen live in the before-freezing checks). A 20s wait lets the
  // per-minute window partly reset before retrying.
  for (let attempt = 1; attempt <= GROQ_MAX_ATTEMPTS; attempt++) {
    try {
      return await callOpenAICompatChat({
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: CONFIG.GROQ_API_KEY,
        apiKeyName: "GROQ_API_KEY",
        modelId,
        systemPrompt,
        userPrompt,
        extraBody,
        timeoutMs
      });
    } catch (err) {
      const isRetryable = err instanceof Error && /^HTTP 429/.test(err.message);
      if (!isRetryable || attempt === GROQ_MAX_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, GROQ_RETRY_DELAY_MS));
    }
  }
}

/*
  callMistral() — Mistral's chat completions endpoint, also OpenAI-shaped.
  Currently unused by any MODELS entry: Mistral Medium was replaced by
  Gemini 3.5 Flash (billing issue, not a code issue — see the MODELS array
  comment). Left intact, not deleted, same as callDeepSeek() below — a
  one-line change per card if a Mistral model becomes worth using again.
*/
async function callMistral(modelId, systemPrompt, userPrompt) {
  return callOpenAICompatChat({
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    apiKey: CONFIG.MISTRAL_API_KEY,
    apiKeyName: "MISTRAL_API_KEY",
    modelId,
    systemPrompt,
    userPrompt
  });
}

/*
  NIM_STAGGER_MS / scheduleNimSlot() — Originally added because NIM-routed
  cards firing in the same instant on "Send to All" showed a 503 "Service
  temporarily overloaded" and an unrelated-looking ETIMEDOUT landing in the
  same batch — a shared-backend-under-load pattern, not evidence of a
  protocol-level ceiling. Serializes just the *start* of each NIM call with
  a small gap; each call still resolves independently once fired.

  Currently UNUSED / inert: this round's MODELS array routes zero cards
  through callNvidia() — nemotron-3-ultra and nemotron-3-super both moved to
  OpenRouter's own `:free`-tagged listings this round (confirmed live; see
  callOpenRouter()'s comment), and deepseek-v4-flash isn't in this round's
  top 10 at all. Left in place rather than removed, per instruction — this
  is shared, model-agnostic infrastructure, not specific to any one model
  that passed through it, and callNvidia() below (also unused now) is a
  one-line change per card away from being wired back in if a future round
  moves a candidate back onto NIM.
*/
const NIM_STAGGER_MS = 400;
let nimQueue = Promise.resolve();
function scheduleNimSlot() {
  const slot = nimQueue.then(() => new Promise((resolve) => setTimeout(resolve, NIM_STAGGER_MS)));
  nimQueue = slot;
  return slot;
}

/*
  callNvidia() — NVIDIA NIM, OpenAI-compatible chat completions shape, but
  routed through the local nim-proxy.js instead of hitting
  integrate.api.nvidia.com directly. NVIDIA's hosted API sends no CORS
  headers on this endpoint (confirmed by a live blocked browser call) and
  has no officially supported way to enable them — see the comment atop
  nim-proxy.js. Every other provider here sends proper CORS headers and is
  called directly; NVIDIA is the only one needing this extra hop.

  Currently unused by any MODELS entry (see the NIM_STAGGER_MS comment
  above) — left intact, not deleted, same treatment as callMistral() /
  callDeepSeek() below, in case a future round routes a candidate back
  through NIM instead of OpenRouter.
*/
async function callNvidia(modelId, systemPrompt, userPrompt) {
  await scheduleNimSlot();
  return callOpenAICompatChat({
    endpoint: "http://localhost:8787/v1/chat/completions",
    apiKey: CONFIG.NVIDIA_API_KEY,
    apiKeyName: "NVIDIA_API_KEY",
    modelId,
    systemPrompt,
    userPrompt
  });
}

/*
  logCohereQuota() — Reads Cohere's real trial-quota headers off each
  response (rather than guessing with a client-side counter, which could
  drift from the account's true state) and warns as the tighter of the two
  limits gets close. Discovered live, not from docs: alongside the
  documented x-endpoint-monthly-call-limit (1000/month across all Cohere
  models on this key), the compatibility endpoint also carries its own
  much tighter x-trial-endpoint-call-limit (20, separate window) — that
  one is the real constraint for a Trial key and is what this warns on.
*/
// Real remaining count from the last response's x-trial-endpoint-call-
// remaining header. Stays null until the first live call reports it —
// callCohere() only hard-stops once it actually knows the account is close,
// never on a guess.
let cohereCallsRemaining = null;
// Refuse new calls at/under this remaining count, well before the trial's
// hard 20-call ceiling, so a pilot run can't blow through the whole quota
// in one batch of "Send to All" clicks.
const COHERE_HARD_STOP_THRESHOLD = 3;

function logCohereQuota(res) {
  const remaining = res.headers.get("x-trial-endpoint-call-remaining");
  const limit = res.headers.get("x-trial-endpoint-call-limit");
  const monthlyLimit = res.headers.get("x-endpoint-monthly-call-limit");
  if (remaining === null) return;
  cohereCallsRemaining = Number(remaining);
  console.log(`Cohere trial quota: ${remaining}/${limit} left on this endpoint (monthly cap: ${monthlyLimit}).`);
  if (cohereCallsRemaining <= 5) {
    console.warn(`Cohere Command A+ is close to its trial endpoint call limit (${remaining} left) — calls will start failing soon on this key's tier.`);
  }
}

/*
  callCohere() — Cohere's OpenAI-compatible chat completions endpoint.
  Confirmed live: api.cohere.com and the docs' api.cohere.ai both resolve
  to the same backend (identical 401 response without a key), and it sends
  proper CORS headers, so it's called directly like Groq, rather than
  through the NVIDIA proxy.

  Hard-stops locally once logCohereQuota() has observed the trial-endpoint
  count run down to COHERE_HARD_STOP_THRESHOLD, instead of only warning and
  letting the next call hit a real 429 from Cohere.

  Currently unused by any MODELS entry — command-a-plus isn't in this
  round's top 10 (Cohere's still represented this round, though: see
  north-mini-code, routed through callOpenRouter() instead). Left intact,
  not deleted, same treatment as callMistral() / callDeepSeek() /
  callNvidia() — a one-line change per card if Command A+ re-enters a future
  round's list.
*/
async function callCohere(modelId, systemPrompt, userPrompt) {
  if (cohereCallsRemaining !== null && cohereCallsRemaining <= COHERE_HARD_STOP_THRESHOLD) {
    throw new Error(`Cohere trial endpoint call limit nearly exhausted (${cohereCallsRemaining} left) — refusing to spend more calls`);
  }
  return callOpenAICompatChat({
    endpoint: "https://api.cohere.com/compatibility/v1/chat/completions",
    apiKey: CONFIG.COHERE_API_KEY,
    apiKeyName: "COHERE_API_KEY",
    modelId,
    systemPrompt,
    userPrompt,
    onResponse: logCohereQuota
  });
}

/*
  callOpenRouter() — OpenRouter's OpenAI-compatible chat completions
  endpoint, a routing layer in front of many providers' models. Confirmed
  CORS-clean on preflight, so it's called directly rather than through a
  proxy. Currently used by 1 card, north-mini-code. Earlier it also served
  nemotron-3-ultra, nemotron-3-super (both
  confirmed live on OpenRouter's catalog with genuine `:free`/$0 pricing —
  new discovery this round; earlier sessions only knew these via NVIDIA NIM,
  which needs the local nim-proxy.js hop since NVIDIA's native API sends no
  CORS headers — see callNvidia() below, now unused but left intact) and
  north-mini-code (Cohere's, also confirmed live with a genuine `:free` tag),
  and nemotron-3-nano-omni (added 2026-09-15, genuine `:free` tag, live 200);
  all three Nemotron cards were removed on 2026-09-15 (NVIDIA API Trial Terms).
  gemma-4-31b-it previously routed through here too; this round moved it to
  Google's own Gemini API directly instead (see callGeminiCompat()) — no
  longer routed through OpenRouter.

  Retries on HTTP 429 with a fixed delay between attempts: gemma-4-31b-it's
  `:free` tag (when it was still routed here) previously failed 4/4 with
  "limit_source":"upstream_provider_shared_pool" — external congestion on
  OpenRouter's shared free-tier routing, not this app's own traffic (see
  README CORS notes), so retrying rides out transient upstream saturation
  rather than fixing concurrency like the NIM stagger does. Kept generic
  (not gemma-specific) since any `:free`-tagged OpenRouter route can hit the
  same shared-pool congestion.

  ALSO retries on the "upstream error in HTTP 200 response" case thrown by
  callOpenAICompatChat() (see its comment) — confirmed live on
  nemotron-3-super: 2 failures out of 8 calls, HTTP 200 with no `choices` and
  a body-level `{"error":{"message":"Upstream error from Nvidia: Service
  temporarily overloaded","code":502}}` instead. Same shared-congestion
  shape as the 429 case, just surfaced differently — OpenRouter apparently
  passes through whatever status shape the specific upstream provider it
  routed to that instant returned, rather than always normalizing to a real
  HTTP error. Without this, that failure mode was previously indistinguishable
  from the model genuinely returning an empty response (content: ""),
  and — worse — never triggered a retry at all, since no exception was ever
  thrown for it before this fix.

  extraBody forwards through to callOpenAICompatChat() on every attempt, same
  as the other adapters, though none of the 3 current OpenRouter-routed
  cards use it. timeoutMs also forwards through on every attempt — used by
  nemotron-3-ultra (see its MODELS entry) to override the 40s default up to
  150s for its consistently slow (~120s observed, live-tested twice) free-
  tier route; the other 2 OpenRouter-routed cards don't need it and fall
  back to the shared default.
*/
const OPENROUTER_MAX_ATTEMPTS = 3;
const OPENROUTER_RETRY_DELAY_MS = 5000;
async function callOpenRouter(modelId, systemPrompt, userPrompt, extraBody, timeoutMs) {
  for (let attempt = 1; attempt <= OPENROUTER_MAX_ATTEMPTS; attempt++) {
    try {
      return await callOpenAICompatChat({
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: CONFIG.OPENROUTER_API_KEY,
        apiKeyName: "OPENROUTER_API_KEY",
        modelId,
        systemPrompt,
        userPrompt,
        extraBody,
        timeoutMs
      });
    } catch (err) {
      const isRetryable = err instanceof Error &&
        (/^HTTP 429/.test(err.message) || /^Upstream error in HTTP 200 response/.test(err.message));
      if (!isRetryable || attempt === OPENROUTER_MAX_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, OPENROUTER_RETRY_DELAY_MS));
    }
  }
}

/*
  QuotaError / getOpenRouterFreeQuota() / assertOpenRouterQuota() — the quota
  guard for north-mini-code (the only finalist on OpenRouter). Added
  2026-09-25.

  Why this and not logCohereQuota(): that guard reads Cohere's own
  x-trial-endpoint-call-* headers and only runs inside callCohere(), which no
  card uses. north-mini-code goes through OpenRouter's `:free` route, and what
  limits it is OpenRouter's free-model cap, 50 requests/day on this key. Live
  check 2026-09-25: GET /api/v1/key returned free_model_daily_requests
  {used: 0, limit: 50, remaining: 50}. OpenRouter's chat responses expose no
  rate-limit headers to the browser (its Access-Control-Expose-Headers lists
  only X-Generation-Id, X-Provider-Name, request-id, cf-ray), so the guard
  reads the key endpoint, which is CORS-open, instead of guessing with a client
  counter that could drift from the account's real state.

  The retries in callOpenRouter() can each spend a request, so a send needs
  up to OPENROUTER_MAX_ATTEMPTS of headroom; below that it refuses to send
  (QuotaError) rather than burning the last requests silently. Lenient by
  default: if the check itself can't be read, a manual click goes ahead with a
  console warning. strict (the unattended batch) treats "can't tell" as a
  refusal.
*/
class QuotaError extends Error {}

// The most recent quota reading (null if the last send had no OpenRouter model
// or the check couldn't be read) — the batch runner logs it with each send.
let lastOpenRouterQuota = null;

async function getOpenRouterFreeQuota() {
  const res = await fetch("https://openrouter.ai/api/v1/key", {
    headers: { Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}` }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from OpenRouter /key`);
  const q = (await res.json())?.data?.free_model_daily_requests;
  if (!q || typeof q.remaining !== "number") throw new Error("OpenRouter /key returned no free_model_daily_requests");
  return q; // { used, limit, remaining }
}

async function assertOpenRouterQuota(models, { strict = false } = {}) {
  lastOpenRouterQuota = null;
  if (!models.some((m) => m.keyName === "OPENROUTER_API_KEY")) return null;
  let quota;
  try {
    // A one-off network blip shouldn't set the model aside: 3 tries, 3 s apart.
    for (let attempt = 1; ; attempt++) {
      try { quota = await getOpenRouterFreeQuota(); break; }
      catch (err) { if (attempt === 3) throw err; await new Promise((r) => setTimeout(r, 3000)); }
    }
  } catch (err) {
    const msg = `Couldn't read OpenRouter's free-model quota (${err.message}).`;
    if (strict) throw new QuotaError(`${msg} Pausing rather than sending blind.`);
    console.warn(`${msg} Sending anyway.`);
    return null;
  }
  lastOpenRouterQuota = quota;
  console.log(`OpenRouter free-model quota: ${quota.remaining}/${quota.limit} requests left today.`);
  if (quota.remaining < OPENROUTER_MAX_ATTEMPTS) {
    throw new QuotaError(
      `OpenRouter free-model daily quota nearly exhausted (${quota.remaining} of ${quota.limit} left) — ` +
      `refusing to send, since north-mini-code's retries could spend the rest. Try again after the daily reset.`
    );
  }
  return quota;
}

/*
  callDeepSeek() — DeepSeek's native chat completions endpoint, OpenAI-
  shaped. Currently unused by any MODELS entry: deepseek-v4-flash routes
  through callNvidia() instead (NVIDIA NIM hosts the same build and the
  native account is balance-blocked — see the MODELS array comment). Left
  intact, not deleted, so switching back is a one-line change if the
  native account gets funded later.
*/
async function callDeepSeek(modelId, systemPrompt, userPrompt) {
  return callOpenAICompatChat({
    endpoint: "https://api.deepseek.com/chat/completions",
    apiKey: CONFIG.DEEPSEEK_API_KEY,
    apiKeyName: "DEEPSEEK_API_KEY",
    modelId,
    systemPrompt,
    userPrompt
  });
}

/*
  escapeHtml() - Escape user/model-controlled strings before placing them in 
  innerHTML, so a prompt containing "<script>" can't actually inject script tags. 
  Anywhere text is set with textContent already, this isn't needed.
*/
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
