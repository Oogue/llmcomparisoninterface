/*
  Each entry describes one model card on the grid. To add a new model, append
  a new object here with:
    id            - unique key used as the card's data-model-id (DOM lookup)
    name          - label shown in the card header
    provider      - sub-label shown under the name
    architecture  - "Dense Transformer" or "MoE"; controls badge styling
    keyName       - which CONFIG.* field this model needs to authenticate
    call(sys,user)- async function that sends the prompt and returns text
*/
const MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "gemini-2.5-flash",
    provider: "Google",
    architecture: "Dense Transformer",
    keyName: "GEMINI_API_KEY",
    call: callGemini
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "llama-3.3-70b-versatile",
    provider: "Groq",
    architecture: "Dense Transformer",
    keyName: "GROQ_API_KEY",
    // Both Groq models share callGroq() — we pass the model ID per-call.
    call: (sys, user) => callGroq("llama-3.3-70b-versatile", sys, user)
  },
  {
    id: "llama-4-scout",
    name: "llama-4-scout-17b-16e-instruct",
    provider: "Groq",
    architecture: "MoE",
    keyName: "GROQ_API_KEY",
    call: (sys, user) => callGroq("meta-llama/llama-4-scout-17b-16e-instruct", sys, user)
  },
  {
    id: "mistral-small-latest",
    name: "mistral-small-latest",
    provider: "Mistral",
    architecture: "Dense Transformer",
    keyName: "MISTRAL_API_KEY",
    call: callMistral
  }
];

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

  // Collect any keys that are empty or still the placeholder value.
  const missing = [];
  for (const key of ["GEMINI_API_KEY", "GROQ_API_KEY", "MISTRAL_API_KEY"]) {
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
    status.innerHTML = `<span class="tag-fail">Failed</span>`;
  } else {
    body.classList.remove("error");
    // Use textContent (not innerHTML) so model output can't inject HTML.
    body.textContent = result.text || "(empty response)";
    status.innerHTML = `<span class="tag-ok">OK</span>`;
  }
  time.textContent = `${result.ms} ms`;
}

/*
  handleSend() - Click handler for the "Send to All" button. Reads the two prompt fields,
  fires every model in parallel via Promise.all, updates each card as its
  response arrives, then records the run in sessionHistory.
*/
async function handleSend() {
  const sysPrompt = document.getElementById("system-prompt").value.trim();
  const userPrompt = document.getElementById("user-prompt").value.trim();
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

  // Show skeletons on every card up front, before any network calls.
  for (const m of MODELS) setCardLoading(m.id);

  // Timestamp for the run, used in history entries and export filenames.
  const startedAt = new Date().toISOString();

  // Promise.all dispatches all four requests concurrently. Each model is
  // wrapped in its own try/catch so a single failure doesn't reject the whole
  // batch — failed models just record an error and the others continue.
  const results = await Promise.all(
    MODELS.map(async (model) => {
      const start = performance.now();
      try {
        const text = await model.call(sysPrompt, userPrompt);
        const ms = Math.round(performance.now() - start);
        const result = { modelId: model.id, modelName: model.name, provider: model.provider, text, ms, error: null };
        setCardResult(model.id, result);
        return result;
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        const result = { modelId: model.id, modelName: model.name, provider: model.provider, text: null, ms, error: err.message || String(err) };
        setCardResult(model.id, result);
        return result;
      }
    })
  );

  // Record this run for history + export. unshift() puts newest first.
  lastRun = {
    timestamp: startedAt,
    systemPrompt: sysPrompt,
    userPrompt,
    responses: results
  };
  sessionHistory.unshift(lastRun);
  renderHistory();

  // Re-enable the Send button and unlock Export.
  sendBtn.disabled = false;
  sendBtn.textContent = "Send to All";
  exportBtn.disabled = false;
}

/*
  handleExport() - Serializes lastRun to JSON, creates an in-memory Blob, and 
  triggers a download via a temporary <a> element. Filename embeds the run's 
  timestamp (with : and . swapped for - so it's filesystem-safe on Windows).
*/
function handleExport() {
  if (!lastRun) return;
  const blob = new Blob([JSON.stringify(lastRun, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const safeStamp = lastRun.timestamp.replace(/[:.]/g, "-");
  const a = document.createElement("a");
  a.href = url;
  a.download = `llm-run-${safeStamp}.json`;
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
      <div class="history-prompt">${escapeHtml(truncated)}</div>
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
  callGemini() — Google Generative AI REST API.
  The Gemini schema differs from OpenAI's: messages are "contents" (with
  role/parts), and a system prompt goes in a separate top-level
  systemInstruction field rather than as a system message.
*/
async function callGemini(systemPrompt, userPrompt) {
  const key = CONFIG.GEMINI_API_KEY;
  if (!key || key === "your-key-here") throw new Error("GEMINI_API_KEY not set");
  // API key is passed as a query parameter, not a header.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: userPrompt }] }]
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    // Truncate the error body so a giant HTML 500 page doesn't fill the card.
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  // Response shape: candidates[0].content.parts[].text — concatenate all parts.
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  return text;
}

/*
  callGroq() — Groq Cloud, OpenAI-compatible chat completions endpoint.
  Used by both the Llama 3.3 and Llama 4 Scout cards; the caller picks the
  model by passing modelId.
*/
async function callGroq(modelId, systemPrompt, userPrompt) {
  const key = CONFIG.GROQ_API_KEY;
  if (!key || key === "your-key-here") throw new Error("GROQ_API_KEY not set");
  // OpenAI-style: system + user messages in a single array.
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Bearer token auth — same pattern as OpenAI.
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({ model: modelId, messages })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

/*
  callMistral() — Mistral's chat completions endpoint, also OpenAI-shaped.
  Identical request/response handling as Groq, just a different host and key.
*/
async function callMistral(systemPrompt, userPrompt) {
  const key = CONFIG.MISTRAL_API_KEY;
  if (!key || key === "your-key-here") throw new Error("MISTRAL_API_KEY not set");
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({ model: "mistral-small-latest", messages })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
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
