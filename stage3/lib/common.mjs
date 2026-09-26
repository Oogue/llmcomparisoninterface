// Shared helpers for the Stage 3 rating scripts. No external dependencies.
// cleanOutput / parseCsv / toCsv / loadRuns are adapted from Stage 2's
// stage2/lib/common.mjs (S2 labels -> S3 labels, 7 models -> the 4 finalists).
import fs from "fs";
import path from "path";

export const RATERS_DEFAULT = ["allen", "nian", "lui", "emman"];
export const MODEL_IDS = ["gemini-3-5-flash", "gemma-4-26b-a4b", "north-mini-code", "gemini-2-5-flash"];
export const PER_RESPONSE_CRITERIA = ["task_decomposition", "sequencing_logic", "actionability", "cognitive_load"];
export const GROUP_CRITERIA = ["consistency"];
export const ALL_CRITERIA = [...PER_RESPONSE_CRITERIA, ...GROUP_CRITERIA];

/* ---------- output cleaning (same rule as Stage 2 protocol §4) ----------
   Remove a leading <thought>…</thought> block (Gemma embeds its reasoning that
   way) and a single wrapping ```json code fence. Nothing else is touched. */
export function cleanOutput(raw) {
  if (typeof raw !== "string") return "";
  let t = raw.replace(/^\s*<thought>[\s\S]*?<\/thought>\s*/i, "").trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  return t;
}

/* ---------- prompts / rubric ---------- */
export function loadPromptSet(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "stage3/prompts.json"), "utf8"));
}
export function loadRubric(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "stage3/rubric.json"), "utf8"));
}

/* ---------- run files ----------
   Labels: S3-P<n>-run<n>, optionally -retry / -retry2 / … Merge rule, per
   prompt + run + model (same as Stage 2): the ORIGINAL run's response is used
   whenever it succeeded; a retry only replaces an original that failed with an
   API error (earliest successful retry wins). Returns one record per response. */
export function loadResponses(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const all = [];
  for (const f of files) {
    const run = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const label = run.runLabel || path.basename(f, ".json");
    const m = /^(S3-P\d+)-run(\d+)(?:-retry(\d*))?$/.exec(label);
    if (!m) throw new Error(`Run label "${label}" (file ${f}) is not S3-P<n>-run<n>[-retry<n>]`);
    const retry = m[3] === undefined ? 0 : Number(m[3] || 1);
    for (const r of run.responses) {
      all.push({ file: f, label, promptId: m[1], run: Number(m[2]), retry, timestamp: run.timestamp,
        modelId: r.modelId, upstreamModelId: r.upstreamModelId ?? "", ms: r.ms, error: r.error ?? "", text: r.text ?? "" });
    }
  }
  const groups = new Map();
  for (const r of all) {
    const k = `${r.promptId}|${r.run}|${r.modelId}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const rows = [];
  for (const g of groups.values()) {
    g.sort((a, b) => a.retry - b.retry || String(a.timestamp).localeCompare(String(b.timestamp)));
    const original = g.find((r) => r.retry === 0);
    const pick = original && !original.error ? original : g.find((r) => !r.error) || original || g[0];
    rows.push({ ...pick });
  }
  return rows;
}

/* ---------- seeded shuffle (mulberry32 + Fisher–Yates) ---------- */
export function seededShuffle(items, seed) {
  let s = seed | 0;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- CSV ---------- */
export function toCsv(headers, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n") + "\n";
}

export function parseCsv(text) {
  text = text.replace(/^﻿/, ""); // Excel's "CSV UTF-8" byte-order mark
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  return rows.filter((r) => r.some((v) => v !== "")).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

/* ---------- Krippendorff's alpha, ordinal metric ----------
   units: array of arrays — each inner array is the ratings (numbers 1..maxScore)
   the raters gave ONE unit (a response, or a prompt×model group). Missing
   ratings are simply left out; units with fewer than 2 ratings are ignored.
   Returns { alpha, n_units, n_pairable } (alpha null if it can't be computed). */
export function krippendorffAlphaOrdinal(units, maxScore = 5) {
  const cats = Array.from({ length: maxScore }, (_, i) => i + 1);
  const o = Array.from({ length: maxScore }, () => new Array(maxScore).fill(0)); // coincidence matrix
  let usedUnits = 0;
  for (const u of units) {
    const vals = u.filter((v) => Number.isInteger(v) && v >= 1 && v <= maxScore);
    const m = vals.length;
    if (m < 2) continue;
    usedUnits++;
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) o[vals[i] - 1][vals[j] - 1] += 1 / (m - 1);
  }
  const n_c = o.map((row) => row.reduce((a, b) => a + b, 0));
  const n = n_c.reduce((a, b) => a + b, 0);
  if (n < 2) return { alpha: null, n_units: usedUnits, n_pairable: n };
  // ordinal distance between categories c and k
  const delta2 = (c, k) => {
    if (c === k) return 0;
    const [lo, hi] = c < k ? [c, k] : [k, c];
    let sum = 0;
    for (let g = lo; g <= hi; g++) sum += n_c[g - 1];
    return (sum - (n_c[lo - 1] + n_c[hi - 1]) / 2) ** 2;
  };
  let Do = 0, De = 0;
  for (const c of cats) for (const k of cats) {
    if (c === k) continue;
    Do += o[c - 1][k - 1] * delta2(c, k);
    De += n_c[c - 1] * n_c[k - 1] * delta2(c, k);
  }
  Do /= n; De /= n * (n - 1);
  return { alpha: De === 0 ? null : 1 - Do / De, n_units: usedUnits, n_pairable: n };
}
