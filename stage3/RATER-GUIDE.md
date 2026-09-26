# Stage 3 formal evaluation — rater guide

For the four raters: **Allen, Nian, Lui, Emman.** Each of you scores every item, independently, on a 1–5 scale
(manuscript Appendix D.1). Everyone gets the same items in the same order.

## What you rate

You each get two CSV files (files are in `stage3-evidence/rating/`; use the ones with your name):

| Sheet | File | Rows | What you score |
|---|---|---:|---|
| **A** | `rating-sheet-A-<name>.csv` | 120 | One response at a time: `task_decomposition`, `sequencing_logic`, `actionability`, `cognitive_load` (each 1–5) |
| **B** | `rating-sheet-B-<name>.csv` | 40 | One prompt × model at a time, showing its 3 runs side by side: `consistency` (1–5), judged **across the three runs together** |

Open `rating-view-A.html` / `rating-view-B.html` to read the items comfortably (microtasks as a numbered list, with
what each one needs and unlocks, and the D.1 score descriptors at the top). **Type your scores in your CSV**, on
the row with the matching ID (`R001…`, `G01…`); the HTML pages are read-only.

## How to rate

1. **Do Sheet A first, then Sheet B.** Sheet B shows a model's three runs together, so finishing B first can make
   some Sheet A responses recognisable.
2. Scores are **whole numbers 1–5** (5 is best). No blanks, decimals or text — the tally rejects them and names the cell.
3. Use the descriptors in D.1 (shown at the top of each HTML page) — score against them, not against the other
   responses.
4. **Don't discuss ratings** with the other raters until all four sheets are in.
5. The `notes` column is optional; use it for anything unclear.
6. Save as CSV (UTF-8), **keep the file name**, and don't add, delete or reorder rows or columns.
7. **Don't open `keys/`.** It says which model wrote what. It stays closed until all eight sheets are in.

## After everyone is done

```
node stage3/tally_formal.mjs
```

reads all eight sheets and writes `stage3-evidence/rating/results/` (results table, per-model scores, every rating).
A blank, non-integer or out-of-range score stops it and names the cell.
