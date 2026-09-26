#!/usr/bin/env node
/*
  tally_formal.mjs — turns the four raters' filled-in Stage 3 sheets into the
  formal-evaluation result (manuscript Appendix D.1).

  Usage (from the repo root):
    node stage3/tally_formal.mjs [rating-dir] [--raters=a,b,c,d] [--allow-partial]
    rating-dir defaults to stage3-evidence/rating; raters default to those in
    rating-manifest.json.

  Reads:  rating-sheet-A-<rater>.csv  (4 per-response criteria, 1–5)
          rating-sheet-B-<rater>.csv  (consistency per prompt × model, 1–5)
          keys/rating-key-A.csv, keys/rating-key-B.csv
  Writes: results/formal-results.md, results/formal-scores.csv,
          results/formal-ratings-long.csv (every rating, unblinded, one per line)

  Strict by default: a blank, non-integer or out-of-range score, a missing sheet,
  or an unknown ID stops the run and names the cell. --allow-partial skips those
  ratings instead (for a look mid-way; the result is then NOT final).

  Aggregation (D.1: "scores will be averaged across raters and across runs";
  Consistency is one judgment per prompt × model, averaged across raters):
    - Criterion score per model = mean of that criterion over every rating for the model.
    - Overall score (headline) = plain mean of the five criterion scores, so each
      criterion counts equally.
    - The manuscript says only "average across all the ratings", which can also
      mean pooling every raw rating. That weights the four per-response criteria
      12× more than Consistency (480 vs 40 ratings per model), so it is reported
      too, as "pooled". If the two rank the models differently, the report says so.
  Reliability: Krippendorff's alpha, ordinal, per criterion (units = responses or
  prompt×model groups, values = the raters' scores).
*/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseCsv, toCsv, krippendorffAlphaOrdinal, PER_RESPONSE_CRITERIA, ALL_CRITERIA, MODEL_IDS, loadRubric } from "./lib/common.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dir = path.resolve(root, args.find((a) => !a.startsWith("--")) || "stage3-evidence/rating");
const allowPartial = args.includes("--allow-partial");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "rating-manifest.json"), "utf8"));
const raters = (args.find((a) => a.startsWith("--raters="))?.split("=")[1].split(",") || manifest.raters).map((s) => s.trim());
const rubric = loadRubric(root);
const critName = Object.fromEntries(rubric.criteria.map((c) => [c.key, c.name]));

const readCsv = (f) => parseCsv(fs.readFileSync(path.join(dir, f), "utf8"));
const keyA = Object.fromEntries(readCsv("keys/rating-key-A.csv").map((r) => [r.response_id, r]));
const keyB = Object.fromEntries(readCsv("keys/rating-key-B.csv").map((r) => [r.group_id, r]));

/* ---------- read + validate ---------- */
const problems = [];
const long = []; // {sheet,id,model,prompt,run,criterion,rater,score}
const A = {}, B = {}; // A[criterion][id][rater] = score ; B[id][rater]
for (const c of PER_RESPONSE_CRITERIA) A[c] = {};
const parseScore = (v) => { const s = String(v ?? "").trim(); return /^[1-5]$/.test(s) ? Number(s) : null; };

for (const rater of raters) {
  for (const [sheet, idCol, key, criteria] of [["A", "response_id", keyA, PER_RESPONSE_CRITERIA], ["B", "group_id", keyB, ["consistency"]]]) {
    const file = `rating-sheet-${sheet}-${rater}.csv`;
    if (!fs.existsSync(path.join(dir, file))) { problems.push(`${file}: file not found`); continue; }
    const rows = readCsv(file);
    const seen = new Set();
    for (const r of rows) {
      const id = r[idCol];
      if (!key[id]) { problems.push(`${file}: unknown ${idCol} "${id}"`); continue; }
      seen.add(id);
      for (const c of criteria) {
        const raw = String(r[c] ?? "").trim();
        const score = parseScore(raw);
        if (score === null) { problems.push(`${file} ${id} ${c}: ${raw === "" ? "blank" : `"${raw}" is not an integer 1–5`}`); continue; }
        if (sheet === "A") (A[c][id] ||= {})[rater] = score;
        else (B[id] ||= {})[rater] = score;
        const k = key[id];
        long.push({ sheet, id, model_id: k.model_id, prompt_id: k.prompt_id, run: sheet === "A" ? k.run : "", criterion: c, rater, score });
      }
    }
    for (const id of Object.keys(key)) if (!seen.has(id)) problems.push(`${file}: no row for ${id}`);
  }
}
if (problems.length) {
  console.error(`${problems.length} problem(s) in the rating sheets:`);
  for (const p of problems.slice(0, 60)) console.error("  " + p);
  if (problems.length > 60) console.error(`  …and ${problems.length - 60} more`);
  if (!allowPartial) { console.error("\nFix these (or use --allow-partial for a non-final look)."); process.exit(1); }
  console.error("\n--allow-partial: continuing without these ratings. THIS RESULT IS NOT FINAL.\n");
}

/* ---------- helpers ---------- */
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const sd = (xs) => { if (xs.length < 2) return null; const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
const f2 = (v) => (v === null || v === undefined ? "—" : v.toFixed(2));
const vals = (o) => Object.values(o || {});

/* ---------- per-model, per-criterion scores ---------- */
// unit-level rater-mean first (so a response with a missing rating isn't over/under-counted), then mean over units
const perModel = {};
for (const m of MODEL_IDS) {
  perModel[m] = { crit: {}, sd: {}, n: {}, raw: [], byPrompt: {} };
  for (const c of ALL_CRITERIA) {
    const unitMeans = [];
    const ids = c === "consistency" ? Object.keys(keyB).filter((g) => keyB[g].model_id === m) : Object.keys(keyA).filter((r) => keyA[r].model_id === m);
    for (const id of ids) {
      const scores = vals(c === "consistency" ? B[id] : A[c][id]);
      if (!scores.length) continue;
      unitMeans.push(mean(scores));
      perModel[m].raw.push(...scores);
      const p = (c === "consistency" ? keyB[id] : keyA[id]).prompt_id;
      ((perModel[m].byPrompt[p] ||= {})[c] ||= []).push(mean(scores));
    }
    perModel[m].crit[c] = mean(unitMeans);
    perModel[m].sd[c] = sd(unitMeans);
    perModel[m].n[c] = unitMeans.length;
  }
  perModel[m].overall = mean(ALL_CRITERIA.map((c) => perModel[m].crit[c]).filter((v) => v !== null));
  perModel[m].pooled = mean(perModel[m].raw);
}
const rank = (key) => [...MODEL_IDS].sort((a, b) => (perModel[b][key] ?? -1) - (perModel[a][key] ?? -1));
const rankOverall = rank("overall"), rankPooled = rank("pooled");
const sameRank = rankOverall.every((m, i) => m === rankPooled[i]);

/* ---------- reliability ---------- */
const alpha = {};
for (const c of PER_RESPONSE_CRITERIA) alpha[c] = krippendorffAlphaOrdinal(Object.keys(keyA).map((id) => vals(A[c][id])));
alpha.consistency = krippendorffAlphaOrdinal(Object.keys(keyB).map((id) => vals(B[id])));
const alphaWord = (a) => (a === null ? "n/a" : a >= 0.8 ? "good" : a >= 0.667 ? "tentative" : "low");

/* ---------- rater severity + big disagreements ---------- */
const raterMeans = {};
for (const rater of raters) {
  raterMeans[rater] = {};
  for (const c of ALL_CRITERIA) raterMeans[rater][c] = mean(long.filter((l) => l.rater === rater && l.criterion === c).map((l) => l.score));
}
const spread = []; // responses/groups where raters differ by >= 2 on some criterion
for (const c of PER_RESPONSE_CRITERIA) for (const id of Object.keys(A[c])) { const v = vals(A[c][id]); if (v.length > 1 && Math.max(...v) - Math.min(...v) >= 2) spread.push({ id, c, model: keyA[id].model_id, range: `${Math.min(...v)}–${Math.max(...v)}` }); }
for (const id of Object.keys(B)) { const v = vals(B[id]); if (v.length > 1 && Math.max(...v) - Math.min(...v) >= 2) spread.push({ id, c: "consistency", model: keyB[id].model_id, range: `${Math.min(...v)}–${Math.max(...v)}` }); }
const totalUnits = PER_RESPONSE_CRITERIA.length * Object.keys(keyA).length + Object.keys(keyB).length;

/* ---------- write results ---------- */
const outDir = path.join(dir, "results");
fs.mkdirSync(outDir, { recursive: true });
const L = [];
L.push("# Stage 3 formal evaluation — results", "");
L.push(`**Generated:** ${new Date().toISOString().slice(0, 10)} · **Raters:** ${raters.join(", ")} · **Scale:** 1–5 (D.1)`);
if (problems.length) L.push("", `⚠️ **NOT FINAL** — ${problems.length} rating(s) missing or invalid (run with --allow-partial).`);
L.push("", "## Overall score per model", "");
L.push("| Rank | Model | Overall (mean of 5 criteria) | Pooled (mean of every rating) |", "|---:|---|---:|---:|");
rankOverall.forEach((m, i) => L.push(`| ${i + 1} | ${m} | **${f2(perModel[m].overall)}** | ${f2(perModel[m].pooled)} |`));
L.push("", sameRank
  ? "Both readings of \"average across all the ratings\" rank the models the same way."
  : `⚠️ The two readings rank the models **differently** (pooled: ${rankPooled.join(" > ")}). Pooling weights the four per-response criteria 12× more than Consistency. The group should confirm which one the manuscript means before naming a winner.`);
L.push("", "## Per criterion (mean, with SD across responses/groups)", "");
L.push("| Model | " + ALL_CRITERIA.map((c) => critName[c]).join(" | ") + " |", "|---|" + ALL_CRITERIA.map(() => "---:").join("|") + "|");
for (const m of rankOverall) L.push(`| ${m} | ` + ALL_CRITERIA.map((c) => `${f2(perModel[m].crit[c])} (±${f2(perModel[m].sd[c])})`).join(" | ") + " |");
L.push("", "## Inter-rater reliability — Krippendorff's α (ordinal)", "");
L.push("| Criterion | α | Reading | Units | Ratings compared |", "|---|---:|---|---:|---:|");
for (const c of ALL_CRITERIA) L.push(`| ${critName[c]} | ${f2(alpha[c].alpha)} | ${alphaWord(alpha[c].alpha)} | ${alpha[c].n_units} | ${alpha[c].n_pairable.toFixed(0)} |`);
L.push("", "α = 1 means the raters agree perfectly; 0 means no better than chance. Krippendorff's usual guide: ≥ 0.80 good, 0.667–0.80 tentative, below that low.");
L.push("", "## Each rater's average score (spots strict / lenient raters)", "");
L.push("| Rater | " + ALL_CRITERIA.map((c) => critName[c]).join(" | ") + " |", "|---|" + ALL_CRITERIA.map(() => "---:").join("|") + "|");
for (const r of raters) L.push(`| ${r} | ` + ALL_CRITERIA.map((c) => f2(raterMeans[r][c])).join(" | ") + " |");
L.push("", "## Large rater disagreements (scores ≥ 2 points apart)", "");
L.push(`${spread.length} of ${totalUnits} response/criterion (or group) ratings — flagged for a look, not forced to consensus.`);
if (spread.length) {
  const byModel = {}; for (const s of spread) byModel[s.model] = (byModel[s.model] || 0) + 1;
  L.push("", "By model: " + MODEL_IDS.map((m) => `${m} ${byModel[m] || 0}`).join(" · "), "");
  L.push("| ID | Criterion | Model | Range |", "|---|---|---|---|");
  for (const s of spread.slice(0, 40)) L.push(`| ${s.id} | ${critName[s.c]} | ${s.model} | ${s.range} |`);
  if (spread.length > 40) L.push(`| …${spread.length - 40} more | | | |`);
}
L.push("", "## Mean score by prompt (mean of the five criteria)", "");
const promptIds = [...new Set(Object.values(keyA).map((k) => k.prompt_id))].sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")));
L.push("| Prompt | " + MODEL_IDS.join(" | ") + " |", "|---|" + MODEL_IDS.map(() => "---:").join("|") + "|");
for (const p of promptIds) L.push(`| ${p} | ` + MODEL_IDS.map((m) => f2(mean(ALL_CRITERIA.map((c) => mean(perModel[m].byPrompt[p]?.[c] || [])).filter((v) => v !== null)))).join(" | ") + " |");
L.push("", "Inputs: " + raters.map((r) => `\`rating-sheet-A-${r}.csv\`, \`rating-sheet-B-${r}.csv\``).join(", ") + ", `keys/`.");
fs.writeFileSync(path.join(outDir, "formal-results.md"), L.join("\n") + "\n");

fs.writeFileSync(path.join(outDir, "formal-scores.csv"), toCsv(["model", ...ALL_CRITERIA, "overall_mean_of_criteria", "pooled_mean_all_ratings"],
  MODEL_IDS.map((m) => ({ model: m, ...Object.fromEntries(ALL_CRITERIA.map((c) => [c, perModel[m].crit[c]?.toFixed(4) ?? ""])), overall_mean_of_criteria: perModel[m].overall?.toFixed(4) ?? "", pooled_mean_all_ratings: perModel[m].pooled?.toFixed(4) ?? "" }))));
fs.writeFileSync(path.join(outDir, "formal-ratings-long.csv"), toCsv(["sheet", "id", "model_id", "prompt_id", "run", "criterion", "rater", "score"], long));

console.log(L.join("\n"));
console.log(`\nWrote ${path.relative(root, outDir)}/formal-results.md, formal-scores.csv, formal-ratings-long.csv`);
if (problems.length) process.exitCode = 2;
