#!/usr/bin/env node
/*
  run_headless.mjs — runs the Stage 3 batch (or a one-send live test) in Node,
  no browser. Loads config.js, script.js and batch.js UNCHANGED into this
  process (with a do-nothing `document` stub), so the requests, retries,
  cleaning and export records are the same code the page runs — only the
  page's buttons are replaced by this command line.

  One difference from the page: Node has no CORS, so this cannot show a
  browser-side CORS problem. (Stage 1/2 already ran every route from the page.)

  Usage (from the repo root):
    node stage3/run_headless.mjs --live-test
        one Send to All (S3-P1 prompt) to the 4 finalists, results printed only
    node stage3/run_headless.mjs [--out=stage3-evidence] [--delay=20] [--only=S3-P1,S3-P2]
        [--gemini-key=GEMINI_API_KEY_PREVIOUS]   use that config.js field for the Google models
                                                  (default GEMINI_API_KEY); its NAME is recorded in each export
        the batch: writes <out>/exports/*.json and <out>/RUN-LOG.md; resumes
        from whatever is already in <out>/exports/
  config.js must exist (it holds the API keys and is never committed).
*/
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const flag = (name) => process.argv.includes(`--${name}`);

// Minimal stand-in for the page: every element is an inert object.
const el = () => ({ value: "", textContent: "", innerHTML: "", className: "", dataset: {}, disabled: false,
  classList: { add() {}, remove() {} }, appendChild() {}, addEventListener() {}, querySelector: () => null });
globalThis.document = { addEventListener() {}, getElementById: () => el(), querySelector: () => null, createElement: () => el(), body: el() };
globalThis.alert = (m) => console.log("ALERT:", m);

for (const f of ["config.js", "script.js", "batch.js"]) {
  if (!fs.existsSync(path.join(root, f))) { console.error(`${f} not found in ${root}`); process.exit(1); }
  vm.runInThisContext(fs.readFileSync(path.join(root, f), "utf8"), { filename: f });
}
// Top-level const/class declarations from those scripts are global lexical
// bindings: visible here as free variables (MODELS, dispatchToAll, ...).

// Which config.js field the Google models use. The free tier caps each Google model
// at 20 requests/day per project, so a second account's key can carry on once the
// first is used up. Only the field's name is ever logged or exported.
const geminiKeyAlias = arg("gemini-key") || "GEMINI_API_KEY";
if (geminiKeyAlias !== "GEMINI_API_KEY") {
  if (!CONFIG[geminiKeyAlias]) { console.error(`config.js has no ${geminiKeyAlias}`); process.exit(1); }
  CONFIG.GEMINI_API_KEY = CONFIG[geminiKeyAlias];
}

const promptSet = JSON.parse(fs.readFileSync(path.join(root, "stage3/prompts.json"), "utf8"));

const missing = requiredKeyNames().filter((k) => !CONFIG[k] || CONFIG[k] === "your-key-here");
if (missing.length) { console.error("Missing API keys in config.js:", missing.join(", ")); process.exit(1); }

if (flag("live-test")) {
  console.log(`Live test — ${MODELS.length} finalists, one Send to All (S3-P1 prompt), nothing saved.`);
  const run = await dispatchToAll(promptSet.system_prompt, promptSet.prompts[0].user_prompt, "LIVE-TEST", { strictQuota: true });
  for (const r of run.responses) {
    let shape = "";
    if (!r.error) {
      const t = cleanForCheck(r.text);
      try { const j = JSON.parse(t); shape = ` · valid JSON, ${j.microtasks?.length ?? "?"} microtasks`; } catch { shape = " · NOT valid JSON after cleaning"; }
    }
    console.log(`${r.error ? "FAIL" : "OK  "} ${r.modelId.padEnd(18)} ${String(r.ms).padStart(6)} ms  ${r.upstreamModelId}${shape}${r.error ? "  " + r.error.slice(0, 160) : ""}`);
  }
  if (lastOpenRouterQuota) console.log(`OpenRouter free-model quota before this send: ${lastOpenRouterQuota.remaining}/${lastOpenRouterQuota.limit}`);
  process.exit(run.responses.some((r) => r.error) ? 1 : 0);
}

// Same cleaning rule as the graders (Stage 2 protocol §4): strip a leading
// <thought>…</thought> block and one wrapping ```json fence. Used only to
// report "valid JSON" in the live test; nothing is modified or saved.
function cleanForCheck(raw) {
  let t = String(raw).replace(/^\s*<thought>[\s\S]*?<\/thought>\s*/i, "").trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1].trim() : t;
}

const outDir = path.resolve(root, arg("out") || "stage3-evidence");
const exportsDir = path.join(outDir, "exports");
fs.mkdirSync(exportsDir, { recursive: true });
const io = {
  readExports: async () => fs.readdirSync(exportsDir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(exportsDir, f), "utf8"))),
  save: async (name, text) => fs.writeFileSync(path.join(exportsDir, name), text),
  saveLog: async (text) => fs.writeFileSync(path.join(outDir, "RUN-LOG.md"), text)
};

let stop = false;
process.on("SIGINT", () => { if (stop) process.exit(130); stop = true; console.log("\nStopping after the current send (Ctrl-C again to abort)…"); });

const result = await runStage3Batch({
  promptSet, io, runner: "headless-node", geminiKeyAlias, shouldStop: () => stop,
  delayMs: (Number(arg("delay")) || 20) * 1000,
  only: arg("only") ? arg("only").split(",") : null
});
console.log(JSON.stringify(result.summary.total));
process.exit(result.status === "complete" && !result.summary.total.unresolved ? 0 : 2);
