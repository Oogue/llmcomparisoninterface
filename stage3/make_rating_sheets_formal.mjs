#!/usr/bin/env node
/*
  make_rating_sheets_formal.mjs — blind rating sheets for the Stage 3 formal
  evaluation (manuscript Appendix D.1: 1–5 scores, every team member rates).

  Usage (from the repo root):
    node stage3/make_rating_sheets_formal.mjs [exports-dir] [--out=DIR] [--raters=a,b,c,d]
                                               [--seed-a=N] [--seed-b=N] [--force]
    exports-dir defaults to stage3-evidence/exports, --out to stage3-evidence/rating,
    --raters to allen,nian,lui,emman.

  Two sheet types per rater, the SAME rows in the SAME order for every rater
  (decided 2026-09-26):
    Sheet A  rating-sheet-A-<rater>.csv   120 rows, one per response. Scores
             task_decomposition, sequencing_logic, actionability, cognitive_load (1–5).
    Sheet B  rating-sheet-B-<rater>.csv    40 rows, one per prompt × model, showing
             that model's three runs side by side. Scores consistency (1–5),
             judged across the three runs together (D.1: not derived from the others).
  Plus, shared by everyone: rating-view-A.html / rating-view-B.html (read-only
  pages with the D.1 score descriptors; ratings still go in the CSV), and
  rating-manifest.json (seeds, raters, counts).

  Keys (response_id / group_id -> model) go in <out>/keys/ — keep that folder away
  from the raters until every sheet is in.

  Blinding: IDs are shuffled with a seed (A and B use different seeds, so
  Sheet B's order says nothing about Sheet A's). Seeds are never the ones Stage 2
  used (20260916, 20260923). Refuses to overwrite existing sheets without --force
  — regenerating after ratings have started would scramble them.
*/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadResponses, loadPromptSet, loadRubric, cleanOutput, seededShuffle, toCsv,
  RATERS_DEFAULT, MODEL_IDS, PER_RESPONSE_CRITERIA } from "./lib/common.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const exportsDir = path.resolve(root, args.find((a) => !a.startsWith("--")) || "stage3-evidence/exports");
const outDir = path.resolve(root, opt("out") || "stage3-evidence/rating");
const keysDir = path.join(outDir, "keys");
const raters = (opt("raters") ? opt("raters").split(",") : RATERS_DEFAULT).map((s) => s.trim()).filter(Boolean);
const seedA = Number(opt("seed-a") || 20260926);
const seedB = Number(opt("seed-b") || 20260927);
if ([20260916, 20260923].includes(seedA) || [20260916, 20260923].includes(seedB)) { console.error("Refusing to reuse a Stage 2 shuffle seed."); process.exit(1); }
if (seedA === seedB) { console.error("--seed-a and --seed-b must differ."); process.exit(1); }

if (fs.existsSync(path.join(outDir, "rating-manifest.json")) && !args.includes("--force")) {
  console.error(`${outDir} already has sheets. Regenerating would scramble any ratings already made. Use --force only if nobody has started.`);
  process.exit(1);
}

const promptSet = loadPromptSet(root);
const rubric = loadRubric(root);
const promptText = Object.fromEntries(promptSet.prompts.map((p) => [p.id, p.user_prompt]));
const rows = loadResponses(exportsDir);

// Every one of the 120 must exist and have succeeded.
const bad = [], have = new Set(rows.filter((r) => !r.error).map((r) => `${r.promptId}|${r.run}|${r.modelId}`));
for (const p of promptSet.prompts) for (let run = 1; run <= promptSet.runs_per_prompt; run++) for (const id of MODEL_IDS) {
  if (!have.has(`${p.id}|${run}|${id}`)) bad.push(`${p.id}-run${run} ${id}`);
}
if (bad.length) { console.error(`Not all 120 responses are present and usable (${bad.length} missing):\n  ` + bad.join("\n  ")); process.exit(1); }
const usable = rows.filter((r) => !r.error && MODEL_IDS.includes(r.modelId));
if (usable.length !== 120) { console.error(`Expected 120 usable responses, found ${usable.length}.`); process.exit(1); }

fs.mkdirSync(keysDir, { recursive: true });

/* ---------- Sheet A ---------- */
const shuffledA = seededShuffle(usable, seedA);
const sheetA = [], keyA = [], idOf = new Map();
shuffledA.forEach((r, i) => {
  const id = "R" + String(i + 1).padStart(3, "0");
  idOf.set(`${r.promptId}|${r.run}|${r.modelId}`, id);
  sheetA.push({ response_id: id, prompt_id: r.promptId, prompt: promptText[r.promptId], response: cleanOutput(r.text),
    task_decomposition: "", sequencing_logic: "", actionability: "", cognitive_load: "", notes: "" });
  keyA.push({ response_id: id, prompt_id: r.promptId, run: r.run, model_id: r.modelId, upstream_model_id: r.upstreamModelId,
    source_file: r.file, retry: r.retry, ms: r.ms });
});

/* ---------- Sheet B ---------- */
const groups = [];
for (const p of promptSet.prompts) for (const id of MODEL_IDS) groups.push({ promptId: p.id, modelId: id });
const shuffledB = seededShuffle(groups, seedB);
const sheetB = [], keyB = [];
shuffledB.forEach((g, i) => {
  const gid = "G" + String(i + 1).padStart(2, "0");
  const runs = [1, 2, 3].map((n) => usable.find((r) => r.promptId === g.promptId && r.modelId === g.modelId && r.run === n));
  sheetB.push({ group_id: gid, prompt_id: g.promptId, prompt: promptText[g.promptId],
    run1: cleanOutput(runs[0].text), run2: cleanOutput(runs[1].text), run3: cleanOutput(runs[2].text), consistency: "", notes: "" });
  keyB.push({ group_id: gid, prompt_id: g.promptId, model_id: g.modelId,
    response_ids: runs.map((r) => idOf.get(`${r.promptId}|${r.run}|${r.modelId}`)).join(" ") });
});

/* ---------- write CSVs (identical rows for every rater) ---------- */
const headA = ["response_id", "prompt_id", "prompt", "response", ...PER_RESPONSE_CRITERIA, "notes"];
const headB = ["group_id", "prompt_id", "prompt", "run1", "run2", "run3", "consistency", "notes"];
for (const rater of raters) {
  fs.writeFileSync(path.join(outDir, `rating-sheet-A-${rater}.csv`), toCsv(headA, sheetA));
  fs.writeFileSync(path.join(outDir, `rating-sheet-B-${rater}.csv`), toCsv(headB, sheetB));
}
fs.writeFileSync(path.join(keysDir, "rating-key-A.csv"), toCsv(["response_id", "prompt_id", "run", "model_id", "upstream_model_id", "source_file", "retry", "ms"], keyA));
fs.writeFileSync(path.join(keysDir, "rating-key-B.csv"), toCsv(["group_id", "prompt_id", "model_id", "response_ids"], keyB));

/* ---------- HTML views ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function renderTasks(text) {
  let tasks;
  try { tasks = JSON.parse(text).microtasks; } catch { tasks = null; }
  if (!Array.isArray(tasks) || !tasks.length) {
    return `<p class="warn">Couldn't read this as a microtask list. Raw output:</p><pre>${esc(text || "(empty response)")}</pre>`;
  }
  const unlocks = {};
  for (const t of tasks) for (const p of t.prerequisites || []) (unlocks[p] ||= []).push(t.id);
  const starts = tasks.filter((t) => !(t.prerequisites || []).length).length;
  const items = tasks.map((t) => {
    const pre = t.prerequisites || [];
    const needs = pre.length ? `needs ${pre.join(", ")}` : `<span class="start">no prerequisites</span>`;
    const next = unlocks[t.id] ? ` · unlocks ${unlocks[t.id].join(", ")}` : "";
    return `<li><span class="num">${esc(t.id)}</span><div><div class="desc">${esc(t.description)}</div><div class="deps">${needs}${next}</div></div></li>`;
  }).join("");
  return `<p class="summary">${tasks.length} microtasks · ${starts} with no prerequisites</p><ol class="tasks">${items}</ol>
    <details><summary>Raw JSON</summary><pre>${esc(text)}</pre></details>`;
}

const rubricHtml = (keys) => rubric.criteria.filter((c) => keys.includes(c.key)).map((c) => `
  <h3>${esc(c.name)}</h3>
  <table>${[5, 4, 3, 2, 1].map((n) => `<tr><th>${n}</th><td>${esc(c.descriptors[n])}</td></tr>`).join("")}</table>`).join("");

const css = `
:root{--bg:#fff;--fg:#1c2230;--muted:#5b6577;--line:#d9dee7;--card:#f6f8fb;--accent:#2f6fed;--warn:#b45309}
@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e6e8ee;--muted:#9aa3b2;--line:#262d3a;--card:#161a22;--accent:#6ea8fe;--warn:#f0b429}}
body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;margin:0;padding:16px}
main{max-width:1100px;margin:0 auto}h1{font-size:20px}h2{font-size:17px;margin:0 0 6px}h3{font-size:14px;margin:14px 0 4px}
section{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin:16px 0}
.pid{color:var(--muted);font-weight:400;font-size:13px}.prompt{color:var(--muted)}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid var(--line);padding:4px 8px;text-align:left;vertical-align:top}th{width:2.2em;text-align:center}
ol.tasks{list-style:none;padding:0;margin:8px 0}ol.tasks li{display:flex;gap:10px;padding:5px 0;border-top:1px solid var(--line)}
.num{min-width:1.8em;color:var(--accent);font-weight:600}.deps{font-size:12.5px;color:var(--muted)}.start{color:var(--accent)}
.summary{font-size:13px;color:var(--muted);margin:4px 0}.warn{color:var(--warn)}pre{white-space:pre-wrap;font-size:12px}
.runs{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}.run{border:1px solid var(--line);border-radius:6px;padding:8px;background:var(--bg)}
.run h3{margin-top:0}.note{background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:8px 12px;font-size:13px}`;
const page = (title, intro, keys, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body><main>
<h1>${esc(title)}</h1><p class="note">${intro} Model identity is hidden. This page is read-only — <b>type your scores in your own CSV</b>, matching the ID shown on each card.</p>
<details><summary>Score descriptors (manuscript Appendix D.1) — 5 is best</summary>${rubricHtml(keys)}</details>${body}</main></body></html>`;

const cardsA = sheetA.map((r) => `<section id="${r.response_id}"><h2>${r.response_id} <span class="pid">${r.prompt_id}</span></h2>
<details><summary>Prompt</summary><p class="prompt">${esc(r.prompt)}</p></details>${renderTasks(r.response)}</section>`).join("\n");
const cardsB = sheetB.map((r) => `<section id="${r.group_id}"><h2>${r.group_id} <span class="pid">${r.prompt_id}</span></h2>
<details><summary>Prompt</summary><p class="prompt">${esc(r.prompt)}</p></details>
<div class="runs">${[r.run1, r.run2, r.run3].map((t, i) => `<div class="run"><h3>Run ${i + 1}</h3>${renderTasks(t)}</div>`).join("")}</div></section>`).join("\n");

fs.writeFileSync(path.join(outDir, "rating-view-A.html"),
  page("Stage 3 — Sheet A (per response)", `Score each response 1–5 on ${PER_RESPONSE_CRITERIA.length} criteria: task_decomposition, sequencing_logic, actionability, cognitive_load. ${sheetA.length} responses.`, PER_RESPONSE_CRITERIA, cardsA));
fs.writeFileSync(path.join(outDir, "rating-view-B.html"),
  page("Stage 3 — Sheet B (consistency across runs)", `Score how stable this model's output is across its three runs, 1–5 (one <b>consistency</b> score per card, judged across all three runs together). ${sheetB.length} cards.`, ["consistency"], cardsB));

/* ---------- manifest + checks ---------- */
fs.writeFileSync(path.join(outDir, "rating-manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(), raters, seedA, seedB, order: "shared by all raters",
  sheetA_rows: sheetA.length, sheetB_rows: sheetB.length, source_exports_dir: path.relative(root, exportsDir),
  rubric: rubric.source, note: "keys/ holds the model mapping — keep away from raters until all sheets are in."
}, null, 2) + "\n");

let notJson = 0;
for (const r of sheetA) { try { JSON.parse(r.response).microtasks.length; } catch { notJson++; } }
// Whole words only: "coherent" / "Google Scholar" are ordinary content, not model identity.
const leak = sheetA.filter((r) => /\b(gemini|gemma|north[- ]mini(-code)?|cohere)\b|\bgoogle\b(?! scholar)/i.test(r.response)).length;
console.log(`Sheet A: ${sheetA.length} rows · Sheet B: ${sheetB.length} rows · raters: ${raters.join(", ")} (same order for all)`);
console.log(`Seeds: A=${seedA}, B=${seedB} · written to ${path.relative(root, outDir)}/ (keys in keys/)`);
console.log(`Responses that are not a valid microtask JSON after cleaning: ${notJson} (shown raw in the HTML view; raters still score them)`);
console.log(`Responses whose text mentions a model/provider name: ${leak}${leak ? "  ← check these for blinding leaks" : ""}`);
