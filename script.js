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

const sessionHistory = [];
let lastRun = null;

document.addEventListener("DOMContentLoaded", () => {
  validateConfig();
  buildGrid();
  document.getElementById("send-btn").addEventListener("click", handleSend);
  document.getElementById("export-btn").addEventListener("click", handleExport);
});

function validateConfig() {
  const banner = document.getElementById("config-warning");
  if (typeof CONFIG === "undefined") {
    banner.classList.remove("hidden");
    banner.textContent = "config.js not loaded. Copy config.example.js to config.js and fill in your API keys.";
    return;
  }
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

function buildGrid() {
  const grid = document.getElementById("response-grid");
  grid.innerHTML = "";
  for (const model of MODELS) {
    const card = document.createElement("div");
    card.className = "card";
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

function setCardLoading(modelId) {
  const card = document.querySelector(`.card[data-model-id="${modelId}"]`);
  if (!card) return;
  const body = card.querySelector('[data-role="body"]');
  body.classList.remove("error");
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
    body.textContent = result.text || "(empty response)";
    status.innerHTML = `<span class="tag-ok">OK</span>`;
  }
  time.textContent = `${result.ms} ms`;
}

async function handleSend() {
  const sysPrompt = document.getElementById("system-prompt").value.trim();
  const userPrompt = document.getElementById("user-prompt").value.trim();
  if (!userPrompt) {
    alert("Please enter a user prompt.");
    return;
  }

  const sendBtn = document.getElementById("send-btn");
  const exportBtn = document.getElementById("export-btn");
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";

  for (const m of MODELS) setCardLoading(m.id);

  const startedAt = new Date().toISOString();

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

  lastRun = {
    timestamp: startedAt,
    systemPrompt: sysPrompt,
    userPrompt,
    responses: results
  };
  sessionHistory.unshift(lastRun);
  renderHistory();

  sendBtn.disabled = false;
  sendBtn.textContent = "Send to All";
  exportBtn.disabled = false;
}

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
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderHistory() {
  const list = document.getElementById("history-list");
  const count = document.getElementById("history-count");
  count.textContent = sessionHistory.length;
  list.innerHTML = "";
  sessionHistory.forEach((run, idx) => {
    const li = document.createElement("li");
    li.className = "history-item";
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

async function callGemini(systemPrompt, userPrompt) {
  const key = CONFIG.GEMINI_API_KEY;
  if (!key || key === "your-key-here") throw new Error("GEMINI_API_KEY not set");
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
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  return text;
}

async function callGroq(modelId, systemPrompt, userPrompt) {
  const key = CONFIG.GROQ_API_KEY;
  if (!key || key === "your-key-here") throw new Error("GROQ_API_KEY not set");
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
