# Stage 3 rating sheets — proposal (now built; decisions below)

**Status 2026-09-26: confirmed and built.** Decisions from Allen:

1. **Order:** one shared order for all four raters.
2. **Overall score:** "average across all the ratings". Implemented as the mean of the five criterion scores (each
   criterion counts equally) as the headline, with the pooled mean of every raw rating reported alongside, since
   the wording can mean either and they weight Consistency very differently. The results say if they rank the
   models differently.
3. **Raters:** Allen, Nian, Lui, Emman.
4. **Reliability:** Krippendorff's α (ordinal), per criterion.
5. **Sheet A before Sheet B:** not answered; written into the rater guide as the default.

Built: `stage3/make_rating_sheets_formal.mjs`, `stage3/tally_formal.mjs`, `stage3/lib/common.mjs`,
`stage3/rubric.json` (D.1 descriptors, extracted from the manuscript), `stage3/RATER-GUIDE.md`.
Generated: `stage3-evidence/rating/` (seeds 20260926 for Sheet A, 20260927 for Sheet B).

The rest of this file is the original proposal.

## 1. What the Stage 2 scripts assume today

Read from `~/Downloads/stage2/` (`make_rating_sheets.mjs`, `tally.mjs`, `lib/common.mjs`,
`render_rating_view.mjs`, `render_disagreements.mjs`, `make_resolved_draft.mjs`, `grade_format.mjs`).

| Assumption | Where | Why it doesn't fit formal evaluation |
|---|---|---|
| **Two raters** | `tally.mjs` refuses to run with fewer than 2 sheets and then takes only the **first two** (`[a, b] = sheets`). A 3rd/4th sheet in the folder is **silently ignored**, not an error. `render_disagreements.mjs` hard-codes two verdict columns. | We have 4 raters. Running `tally.mjs` on 4 sheets would look like it worked and use 2 of them. |
| **Binary pass/fail** | `norm()` maps `pass/fail/p/f/1/0/yes/no/true/false` to two values. Cohen's κ, the "fails in ≥ 2 of 3 runs" rule and the finalist cut all depend on it. Note it also reads `1` as *pass* — a 1–5 score of `1` would be read as a pass. | D.1 is 1–5 ordinal, averaged. There is no pass/fail and no cut. |
| **One flat row per response** | `rating-sheet-<rater>.csv`: `response_id, prompt_id, prompt, response, c2_pass, c3_pass, notes`. | Right shape for the four per-response criteria; wrong for Consistency (below). |
| **Stage 2 IDs and model list baked in** | `lib/common.mjs`: `PROMPT_IDS = S2-P1..P5`, `STAGE1` (7 models), label regex `^(S2-P\d+)[-_]run(\d+)(-retry\d*)?$`. `loadRuns()` throws on any other label. | Stage 3 labels are `S3-P1..P10`, 4 models. |
| **Prompt text and signals from Stage 2 files** | `prompts.json` (5 prompts), `STAGE2-PROMPTS.md` §3 pass/fail signals for the HTML views. | Need `stage3/prompts.json` and the D.1 score descriptors instead. |
| **Shuffle seed** | `make_rating_sheets.mjs` in `~/Downloads/stage2/` uses `20260916`. The `20260923` seed named in the brief isn't in any script on this machine (presumably the v2 script). | Either way: fresh seeds, neither reused. |
| **Resolution step** | `rating-resolved.csv` overrides raters' verdicts after a meeting. | D.1 averages across raters; no forced consensus is described. |

What **is** reusable as-is: `cleanOutput()`, `parseCsv()`/`toCsv()`, the retry-merge rule in `loadRuns()`
(original wins unless it was an API failure), the blinding approach (shuffled IDs, key file kept apart),
and the read-only HTML view idea.

## 2. What formal evaluation needs (D.1, quoted in the brief)

- **Four criteria per individual response** — Task Decomposition Quality, Sequencing Logic,
  Actionability, Cognitive Load Reduction Potential: 120 responses × 4 criteria × 4 raters = **1,920 scores**.
- **Consistency once per (prompt × model)**, judging the 3 runs together: 40 groups × 4 raters = **160 judgments**.
- 1–5 integers everywhere; scores averaged across raters and runs (Consistency across raters only).

## 3. Proposed shape

Two sheet types per rater, blinded like Stage 2's, new seeds.

**Sheet A — `rating-sheet-A-<rater>.csv`, 120 rows** (per response)

`response_id, prompt_id, prompt, response, task_decomposition, sequencing_logic, actionability, cognitive_load, notes`

- `response_id` shuffled, no model names, output already cleaned (`<thought>` block and ` ```json ` fence stripped).
- Seed A: new, recorded in the key file's header.

**Sheet B — `rating-sheet-B-<rater>.csv`, 40 rows** (per prompt × model)

`group_id, prompt_id, prompt, run1, run2, run3, consistency, notes`

- The three cleaned outputs from the same model on the same prompt, side by side; the model is hidden.
- `group_id` shuffled with a **different** seed (Seed B), so Sheet B's order says nothing about Sheet A's.

**Keys** — `rating-key-A.csv` (response_id → prompt, run, model, source file) and `rating-key-B.csv`
(group_id → prompt, model, the three response_ids). Kept from raters until all 8 sheets are in.

**Read-only HTML views** (as `render_rating_view.mjs` does now), with the D.1 score descriptors shown
next to the boxes so each rater scores against the same anchors.

**Scripts** — new, side by side with Stage 2's rather than edits to them (Stage 2 evidence stays
reproducible):

1. `make_rating_sheets_formal.mjs` — builds A and B for N raters (`--raters=` any count), writes keys.
2. `tally_formal.mjs` — reads N sheet-A and N sheet-B files and:
   - **rejects** blanks, non-integers and values outside 1–5, naming the cell (no silent skips);
   - reports mean and SD per model per criterion (rater-mean, then run-mean, per D.1);
   - reports Consistency separately (rater-mean per group, then across prompts);
   - flags any response where raters spread by ≥ 2 points, for a look, **not** a forced resolution;
   - reports inter-rater reliability suited to 4 raters and ordinal scores (Krippendorff's α, ordinal),
     replacing Cohen's κ.
3. `lib/common.mjs` gets its label regex and prompt/model lists read from `stage3/prompts.json` and the
   `MODELS` finalist list instead of Stage 2 constants (a new `lib/common_s3.mjs` copy is the safer route).

## 4. Questions for Allen / Nathanael

1. **Same order for all four raters, or independent shuffles per rater?** Stage 2 used one shared order.
   Independent orders reduce order effects; a shared order makes comparing raters simpler. Suggest shared.
2. **Overall score.** The manuscript says "the model with the highest overall score will be selected" but
   D.1 doesn't say how the five criteria combine (equal-weight mean? weights? Consistency treated the same?).
   Needed before `tally_formal.mjs` can rank models. Suggest reporting the five criterion means and an
   equal-weight overall, clearly labelled, until the group decides.
3. **Rater names** for the four file labels.
4. **Sheet A vs. B order.** Sheet B shows a model's three runs together, so a rater who has finished B
   can partly recognise those responses when rating A. Suggest everyone rates Sheet A first, then B.
5. **Reliability statistic:** OK to use Krippendorff's α (ordinal) in place of Cohen's κ?
