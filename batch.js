/*
  batch.js — Stage 3 formal-evaluation batch runner (added 2026-09-25).

  NOT a new dispatch architecture: it loops over the same dispatchToAll() that
  the "Send to All" button calls, so every send goes through the same request
  builders, the same output handling and the same export record. It adds only
  the repetition, pacing, retry and logging around it.

  Structure (manuscript §5.2–§5.3): 10 Appendix D.5 prompts × 3 runs = 30
  sends, each to all 4 finalists = 120 responses. Prompts and the system prompt
  come from stage3/prompts.json. Run labels are S3-P<n>-run<n>; re-sends are
  S3-P<n>-run<n>-retry / -retry2 / … (the Stage 2 convention).

  Failure handling follows Stage 2 (CORRECTIONS.md / RUN-GUIDE §2):
    - A send with API failures (503 / network / timeout, after the adapters' own
      retries) is exported anyway, never dropped.
    - Only the models that failed are re-sent, after a backoff, as -retry and
      then -retry2. A re-send only fills in a response that failed with an API
      error — an original that succeeded is never replaced, so nothing can be
      cherry-picked by re-sending.
    - A response that came back but is badly formatted is NOT an API failure and
      is never re-sent; that is a result, for the graders.
    - What still fails after 2 re-sends is listed as unresolved in RUN-LOG.md
      rather than retried forever.

  Daily quotas are different (see isQuotaError()): waiting 60 s doesn't help, so
  the model is set aside for the rest of the session while the others carry on,
  and the gap is filled in when the batch is run again after the reset. Found
  live on the first run: gemini-2.5-flash's free tier allows ~20 requests a day,
  so 30 sends can never all reach it in one day.

  OpenRouter (north-mini-code): before every send the batch reads OpenRouter's
  real free-model quota (assertOpenRouterQuota(), strict) and sets the model
  aside rather than send with less than a full retry's worth of requests left.

  Progress is always read back from the exported files, so a stopped or paused
  batch resumes by simply running it again.

  Two runners share runStage3Batch(): the page (below, using a chosen
  stage3-evidence folder or plain downloads) and stage3/run_headless.mjs (Node,
  same script.js code, no browser).
*/

// Re-sends allowed per model for non-quota failures (-retry, -retry2). A let, not a const,
// so a run can be given more (--retry-limit) when failures were caused by the runner's
// own machine (e.g. a laptop sleeping mid-send), not by the API.
let BATCH_RETRY_LIMIT = 2;
const BATCH_DEFAULT_DELAY_MS = 20000;      // gap between sends
const BATCH_DEFAULT_BACKOFF_MS = [60000, 120000]; // wait before -retry, -retry2

class BatchPause extends Error {}

function stage3Label(promptId, run, attempt) {
  return `${promptId}-run${run}` + (attempt === 0 ? "" : attempt === 1 ? "-retry" : `-retry${attempt}`);
}

// Sleeps in 1 s steps so a "stop" request is honoured promptly.
async function batchSleep(ms, shouldStop) {
  for (let left = ms; left > 0 && !shouldStop(); left -= 1000) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(1000, left)));
  }
}

// Model ids with no successful response in any of the given runs (original + re-sends).
function unresolvedModelIds(runs, modelIds) {
  const ok = new Set();
  for (const run of runs) for (const r of run.responses) if (!r.error) ok.add(r.modelId);
  return modelIds.filter((id) => !ok.has(id));
}

/*
  isQuotaError() — a limit to wait out (or a model this key can't serve), not a fault to
  retry. Matches Google's
  429 "exceeded your current quota" (any quota except a per-minute one, which a
  short backoff does clear) and OpenRouter's "free-models-per-day". Older exports
  kept only 200 characters of the error, without the quotaId, so the bare
  "exceeded your current quota" text is treated the same way.
*/
function isQuotaError(error) {
  const e = String(error || "");
  if (/free-models-per-day/i.test(e)) return true;
  // Found live 2026-09-26: a newer Google account gets HTTP 404 "This model
  // models/gemini-2.5-flash is no longer available to new users" from a key that
  // otherwise works. Retrying can't help; another key (or account) can.
  if (/^HTTP 404/.test(e) && /no longer available to new users/i.test(e)) return true;
  return /^HTTP 429/.test(e) && /exceeded your current quota/i.test(e) && !/PerMinute/i.test(e);
}

// Attempts (original or re-send) in which this model failed for a reason other than quota.
function nonQuotaFailures(runs, modelId) {
  return runs.filter((run) => run.responses.some((r) => r.modelId === modelId && r.error && !isQuotaError(r.error))).length;
}

/*
  classifyMissing() — the models with no successful response, split into:
    unresolved  out of re-sends (more than BATCH_RETRY_LIMIT non-quota failures)
    waiting     no response yet because of a quota (or set aside before it was sent)
    retryable   worth re-sending now
*/
function classifyMissing(runs, modelIds) {
  const missing = unresolvedModelIds(runs, modelIds);
  const unresolved = missing.filter((id) => nonQuotaFailures(runs, id) > BATCH_RETRY_LIMIT);
  const rest = missing.filter((id) => !unresolved.includes(id));
  const waiting = rest.filter((id) => {
    const last = [...runs].reverse().map((run) => run.responses.find((r) => r.modelId === id)).find(Boolean);
    return !last || isQuotaError(last.error);
  });
  return { missing, unresolved, waiting, retryable: rest.filter((id) => !waiting.includes(id)) };
}

/*
  Progress is always derived from the exported files (byLabel: runLabel -> run
  JSON), never from in-memory counters, so a resumed batch reports on the whole
  evidence folder, not just its own session.
*/
function summarizeStage3(promptSet, modelIds, byLabel) {
  const rows = [];
  const failures = [];
  const total = { expected: 0, firstPassOk: 0, recovered: 0, unresolved: 0, waiting: 0, notSent: 0 };
  for (const p of promptSet.prompts) {
    for (let r = 1; r <= promptSet.runs_per_prompt; r++) {
      const orig = byLabel.get(stage3Label(p.id, r, 0));
      const retries = [];
      for (let a = 1; byLabel.has(stage3Label(p.id, r, a)); a++) retries.push(byLabel.get(stage3Label(p.id, r, a)));
      total.expected += modelIds.length;
      if (!orig) {
        total.notSent += modelIds.length;
        rows.push({ label: stage3Label(p.id, r, 0), sent: false });
        continue;
      }
      const all = [orig, ...retries];
      const firstOk = modelIds.filter((id) => orig.responses.some((x) => x.modelId === id && !x.error));
      const cls = classifyMissing(all, modelIds);
      total.firstPassOk += firstOk.length;
      total.recovered += modelIds.length - firstOk.length - cls.missing.length;
      total.unresolved += cls.unresolved.length;
      total.waiting += cls.waiting.length;
      total.retryable = (total.retryable || 0) + cls.retryable.length;
      rows.push({ label: stage3Label(p.id, r, 0), sent: true, firstOk: firstOk.length, retrySends: retries.length, unresolved: cls.unresolved, waiting: cls.waiting, retryable: cls.retryable });
      all.forEach((run, i) => {
        for (const x of run.responses) {
          if (!x.error) continue;
          const laterOk = all.slice(i + 1).some((later) => later.responses.some((y) => y.modelId === x.modelId && !y.error));
          const outcome = laterOk ? "recovered by a later re-send"
            : i < all.length - 1 ? "re-sent, failed again"
            : cls.unresolved.includes(x.modelId) ? "UNRESOLVED"
            : cls.waiting.includes(x.modelId) ? "waiting on quota reset" : "not re-sent yet";
          failures.push({ label: run.runLabel, modelId: x.modelId, ms: x.ms, error: x.error, outcome });
        }
      });
    }
  }
  total.retryable = total.retryable || 0;
  return { rows, failures, total };
}

function renderStage3Log({ promptSet, modelIds, byLabel, events, status, pauseReason, runner }) {
  const { rows, failures, total } = summarizeStage3(promptSet, modelIds, byLabel);
  const statusText = status === "complete" ? "complete" : pauseReason ? `${status} — ${pauseReason}` : status;
  const L = [];
  L.push("# Stage 3 formal evaluation — run log", "");
  L.push(`Generated ${new Date().toISOString()} by \`${runner}\` · ${APP_VERSION}`);
  L.push(`Prompt set: stage3/prompts.json (${promptSet.version}) · ${promptSet.prompts.length} prompts × ${promptSet.runs_per_prompt} runs × ${modelIds.length} models = ${total.expected} responses`);
  L.push(`Models: ${modelIds.join(", ")}`, "");
  L.push(`**Status:** ${statusText}`, "");
  L.push("| | Responses |", "|---|---:|");
  L.push(`| Succeeded on the first pass | ${total.firstPassOk} |`);
  L.push(`| Failed first pass, recovered by a re-send | ${total.recovered} |`);
  L.push(`| Waiting on a daily-quota reset (run the batch again after it) | ${total.waiting} |`);
  L.push(`| Failed, still to be re-sent | ${total.retryable} |`);
  L.push(`| Still failing after ${BATCH_RETRY_LIMIT} re-sends (unresolved) | ${total.unresolved} |`);
  L.push(`| Not sent yet | ${total.notSent} |`);
  L.push(`| **Present and usable** | **${total.firstPassOk + total.recovered} of ${total.expected}** |`, "");
  L.push("## Per send", "", "| Send | First-pass OK | Re-sends | Waiting on quota | Unresolved |", "|---|---:|---:|---|---|");
  for (const r of rows) {
    L.push(r.sent
      ? `| ${r.label} | ${r.firstOk}/${modelIds.length} | ${r.retrySends} | ${r.waiting.join(", ") || "—"} | ${r.unresolved.join(", ") || "—"} |`
      : `| ${r.label} | not sent | | | |`);
  }
  L.push("", "## API failures (every errored response, in any send)", "");
  if (!failures.length) L.push("None.");
  else {
    L.push("| Send | Model | ms | Error | Outcome |", "|---|---|---:|---|---|");
    for (const f of failures) L.push(`| ${f.label} | ${f.modelId} | ${f.ms} | ${String(f.error).replace(/\|/g, "\\|").replace(/\s+/g, " ").slice(0, 140)} | ${f.outcome} |`);
  }
  L.push("", "## Events (this session)", "", ...(events.length ? events.map((e) => `- ${e}`) : ["- (none)"]), "");
  return L.join("\n");
}

/*
  runStage3Batch() — options:
    promptSet     parsed stage3/prompts.json
    io            { readExports() -> [run JSON], save(name, text), saveLog(text, {final}) }
    log           console-style sink for progress lines
    delayMs       minimum gap between sends
    retryBackoffMs  waits before -retry, -retry2
    shouldStop    () -> true to stop cleanly between sends
    runner        provenance string recorded in each export ("browser", "headless-node")
    only          optional list of prompt ids (e.g. ["S3-P1"]) for a partial run
    retryLimit    override BATCH_RETRY_LIMIT for this run (default 2)
    geminiKeyAlias  name of the CONFIG field the Google models are using, recorded in each export
  Resolves { status: "complete" | "paused", reason, summary }. "paused" means
  something is still to do (quota reset, stopped by request, or an error);
  unresolved responses are reported in the summary, not as a pause.
*/
async function runStage3Batch({ promptSet, io, log = console.log, delayMs = BATCH_DEFAULT_DELAY_MS, retryBackoffMs = BATCH_DEFAULT_BACKOFF_MS, shouldStop = () => false, runner = "unknown", only = null, geminiKeyAlias = "GEMINI_API_KEY", retryLimit = null }) {
  if (retryLimit !== null) BATCH_RETRY_LIMIT = retryLimit;
  const modelIds = MODELS.map((m) => m.id);
  const byLabel = new Map();
  for (const run of await io.readExports()) if (run.runLabel) byLabel.set(run.runLabel, run);

  const events = [];
  const note = (msg) => { const line = `${new Date().toISOString()} ${msg}`; events.push(line); log(line); };
  const writeLog = (status, pauseReason, final) =>
    io.saveLog(renderStage3Log({ promptSet, modelIds, byLabel, events, status, pauseReason, runner }), { final });

  // Models set aside for the rest of this session because a quota ran out.
  const blocked = new Map(); // modelId -> reason
  const unresolvedNoted = new Set();
  const block = (id, reason) => { if (!blocked.has(id)) { blocked.set(id, reason); note(`${id}: set aside for this session — ${reason}`); } };

  let lastSendAt = 0;
  const pace = async () => {
    await batchSleep(lastSendAt + delayMs - Date.now(), shouldStop);
    if (shouldStop()) throw new BatchPause("stopped by request");
  };

  async function sendOnce(prompt, runNo, attempt, wanted) {
    const label = stage3Label(prompt.id, runNo, attempt);
    await pace();
    // OpenRouter's real quota, checked up front so north-mini-code can be set
    // aside on its own instead of stopping the other models.
    let models = wanted.filter((m) => !blocked.has(m.id));
    try {
      await assertOpenRouterQuota(models, { strict: true });
    } catch (err) {
      if (!(err instanceof QuotaError)) throw err;
      for (const m of models.filter((x) => x.keyName === "OPENROUTER_API_KEY")) block(m.id, err.message);
      models = models.filter((m) => !blocked.has(m.id));
    }
    if (!models.length) return null;
    // Mirror what is being sent into the normal fields (page only; harmless headless).
    document.getElementById("system-prompt").value = promptSet.system_prompt;
    document.getElementById("user-prompt").value = prompt.user_prompt;
    document.getElementById("run-label").value = label;
    note(`sending ${label} to ${models.map((m) => m.id).join(", ")}`);
    const run = await dispatchToAll(promptSet.system_prompt, prompt.user_prompt, label, { models, strictQuota: true });
    lastSendAt = Date.now();
    // geminiKeyAlias is the CONFIG field name (never the key) that the Google models used.
    run.batch = { stage: "stage3", promptId: prompt.id, run: runNo, attempt, runner, geminiKeyAlias };
    await io.save(exportFileName(run), JSON.stringify(run, null, 2));
    byLabel.set(label, run);
    const bad = run.responses.filter((r) => r.error);
    for (const r of bad) if (isQuotaError(r.error)) block(r.modelId, "daily quota reached (HTTP 429)");
    note(`${label}: ${run.responses.length - bad.length}/${run.responses.length} OK` +
      (bad.length ? ` — failed: ${bad.map((r) => `${r.modelId} (${String(r.error).replace(/\s+/g, " ").slice(0, 70)})`).join("; ")}` : "") +
      (lastOpenRouterQuota ? ` · OpenRouter free quota left before send: ${lastOpenRouterQuota.remaining}/${lastOpenRouterQuota.limit}` : ""));
    await writeLog("in progress", null, false);
    return run;
  }

  let status = "complete", pauseReason = null;
  try {
    for (const prompt of promptSet.prompts) {
      if (only && !only.includes(prompt.id)) continue;
      for (let runNo = 1; runNo <= promptSet.runs_per_prompt; runNo++) {
        if (shouldStop()) throw new BatchPause("stopped by request");
        const label0 = stage3Label(prompt.id, runNo, 0);
        if (!byLabel.has(label0)) await sendOnce(prompt, runNo, 0, MODELS);
        if (!byLabel.has(label0)) continue; // every model was set aside; nothing sent

        let retriesDone = 0;
        while (byLabel.has(stage3Label(prompt.id, runNo, retriesDone + 1))) retriesDone++;
        for (;;) {
          const runs = [byLabel.get(label0)];
          for (let a = 1; a <= retriesDone; a++) runs.push(byLabel.get(stage3Label(prompt.id, runNo, a)));
          const cls = classifyMissing(runs, modelIds);
          for (const id of cls.unresolved) {
            if (!unresolvedNoted.has(label0 + id)) { unresolvedNoted.add(label0 + id); note(`${label0}: UNRESOLVED after ${BATCH_RETRY_LIMIT} re-sends — ${id}`); }
          }
          const eligible = [...cls.retryable, ...cls.waiting].filter((id) => !blocked.has(id));
          if (!eligible.length) break;
          // Backoff only for a fresh non-quota failure; a quota gap is filled in straight away.
          const fresh = cls.retryable.some((id) => eligible.includes(id));
          if (fresh) {
            const wait = retryBackoffMs[Math.min(nonQuotaFailures(runs, cls.retryable.find((id) => eligible.includes(id))) - 1, retryBackoffMs.length - 1)] ?? 0;
            const remaining = Date.parse(runs[runs.length - 1].timestamp) + wait - Date.now();
            if (remaining > 0) {
              note(`${label0}: API failure for ${eligible.join(", ")} — waiting ${Math.round(remaining / 1000)}s, then re-sending those models`);
              await batchSleep(remaining, shouldStop);
              if (shouldStop()) throw new BatchPause("stopped by request");
            }
          }
          const sent = await sendOnce(prompt, runNo, retriesDone + 1, MODELS.filter((m) => eligible.includes(m.id)));
          if (!sent) break;
          retriesDone++;
        }
      }
    }
    const still = [...blocked.keys()];
    if (still.length) {
      status = "paused";
      pauseReason = `${still.join(", ")} hit a quota this session; responses for ${still.length > 1 ? "them" : "it"} are waiting. Run the batch again after the daily reset — it fills the gaps in.`;
    }
  } catch (err) {
    status = "paused";
    pauseReason = err instanceof BatchPause ? err.message : `unexpected error: ${err.message || err}`;
    note(err instanceof BatchPause ? `PAUSED — ${pauseReason}. Progress is saved; run the batch again to resume.` : `STOPPED — ${pauseReason}`);
  }
  const summary = summarizeStage3(promptSet, modelIds, byLabel);
  if (status === "complete" && (summary.total.waiting || summary.total.notSent || summary.total.retryable) && !only) {
    status = "paused"; pauseReason = "some responses are still missing (see the tables)";
  }
  await writeLog(status, pauseReason, true);
  const t = summary.total;
  note(`${status}: ${t.firstPassOk} first-pass OK, ${t.recovered} recovered by re-send, ${t.waiting} waiting on quota, ${t.retryable} to re-send, ${t.unresolved} unresolved, ${t.notSent} not sent (of ${t.expected}).`);
  return { status, reason: pauseReason, summary };
}

/* ---------- page wiring (no-op outside the browser page) ---------- */

// io for the page: writes into <chosen folder>/exports/ and <chosen folder>/RUN-LOG.md
// when a folder was picked (File System Access API — Chrome / Edge), otherwise
// falls back to ordinary downloads, which cannot be read back for resuming.
function makeBrowserIo(dirHandle) {
  const download = (name, text, type) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const write = async (dir, name, text) => {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
  };
  if (!dirHandle) {
    return {
      readExports: async () => [],
      save: async (name, text) => download(name, text, "application/json"),
      saveLog: async (text, { final }) => { if (final) download("RUN-LOG.md", text, "text/markdown"); }
    };
  }
  return {
    readExports: async () => {
      const dir = await dirHandle.getDirectoryHandle("exports", { create: true });
      const out = [];
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind !== "file" || !name.endsWith(".json")) continue;
        out.push(JSON.parse(await (await handle.getFile()).text()));
      }
      return out;
    },
    save: async (name, text) => write(await dirHandle.getDirectoryHandle("exports", { create: true }), name, text),
    saveLog: async (text) => write(dirHandle, "RUN-LOG.md", text)
  };
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("batch-start-btn");
    if (!startBtn) return; // headless / page without the batch section
    const pickBtn = document.getElementById("batch-folder-btn");
    const stopBtn = document.getElementById("batch-stop-btn");
    const folderLabel = document.getElementById("batch-folder-label");
    const logEl = document.getElementById("batch-log");
    let dirHandle = null;
    let stopRequested = false;
    const log = (line) => { logEl.textContent += line + "\n"; logEl.scrollTop = logEl.scrollHeight; };

    if (typeof window.showDirectoryPicker !== "function") {
      pickBtn.disabled = true;
      folderLabel.textContent = "This browser can't pick a folder — exports will go to your Downloads folder (no resume). Use Chrome or Edge to write straight into stage3-evidence/.";
    }

    pickBtn.addEventListener("click", async () => {
      try {
        dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        folderLabel.textContent = `Writing to “${dirHandle.name}/” (exports/ and RUN-LOG.md are created inside it). Pick the stage3-evidence folder.`;
      } catch (err) {
        if (err.name !== "AbortError") alert(err.message);
      }
    });

    stopBtn.addEventListener("click", () => { stopRequested = true; stopBtn.textContent = "Stopping after this send…"; });

    startBtn.addEventListener("click", async () => {
      if (typeof window.showDirectoryPicker === "function" && !dirHandle) {
        alert("Choose the stage3-evidence folder first, so exports land there and the batch can resume.");
        return;
      }
      const missing = requiredKeyNames().filter((k) => !CONFIG[k] || CONFIG[k] === "your-key-here");
      if (missing.length) { alert(`Missing API keys in config.js: ${missing.join(", ")}`); return; }
      const delayMs = Math.max(0, Number(document.getElementById("batch-delay").value) || 0) * 1000;
      startBtn.disabled = true; pickBtn.disabled = true; stopBtn.disabled = false;
      stopRequested = false; stopBtn.textContent = "Stop after this send";
      logEl.textContent = "";
      try {
        const promptSet = await (await fetch("stage3/prompts.json")).json();
        const result = await runStage3Batch({
          promptSet, io: makeBrowserIo(dirHandle), log, delayMs, runner: "browser",
          shouldStop: () => stopRequested
        });
        log(result.status === "complete" ? "Done." : `Not finished: ${result.reason}`);
      } catch (err) {
        log(`Batch failed to start: ${err.message || err}`);
      } finally {
        startBtn.disabled = false; stopBtn.disabled = true;
        pickBtn.disabled = typeof window.showDirectoryPicker !== "function";
        document.getElementById("export-btn").disabled = !lastRun;
      }
    });
  });
}
