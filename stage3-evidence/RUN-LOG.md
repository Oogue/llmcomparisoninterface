# Stage 3 formal evaluation — run log

Generated 2026-09-26T02:09:02.270Z by `headless-node` · stage3-v1.0 (4 Stage 2 finalists), export schema 2 — 2026-09-25
Prompt set: stage3/prompts.json (v1.0-draft) · 10 prompts × 3 runs × 4 models = 120 responses
Models: gemini-3-5-flash, gemma-4-26b-a4b, north-mini-code, gemini-2-5-flash

**Status:** complete

| | Responses |
|---|---:|
| Succeeded on the first pass | 65 |
| Failed first pass, recovered by a re-send | 55 |
| Waiting on a daily-quota reset (run the batch again after it) | 0 |
| Failed, still to be re-sent | 0 |
| Still failing after 5 re-sends (unresolved) | 0 |
| Not sent yet | 0 |
| **Present and usable** | **120 of 120** |

## Per send

| Send | First-pass OK | Re-sends | Waiting on quota | Unresolved |
|---|---:|---:|---|---|
| S3-P1-run1 | 4/4 | 0 | — | — |
| S3-P1-run2 | 3/4 | 1 | — | — |
| S3-P1-run3 | 4/4 | 0 | — | — |
| S3-P2-run1 | 4/4 | 0 | — | — |
| S3-P2-run2 | 4/4 | 0 | — | — |
| S3-P2-run3 | 4/4 | 0 | — | — |
| S3-P3-run1 | 4/4 | 0 | — | — |
| S3-P3-run2 | 3/4 | 1 | — | — |
| S3-P3-run3 | 3/4 | 2 | — | — |
| S3-P4-run1 | 3/4 | 6 | — | — |
| S3-P4-run2 | 2/4 | 2 | — | — |
| S3-P4-run3 | 2/4 | 2 | — | — |
| S3-P5-run1 | 0/4 | 3 | — | — |
| S3-P5-run2 | 1/4 | 3 | — | — |
| S3-P5-run3 | 2/4 | 2 | — | — |
| S3-P6-run1 | 1/4 | 4 | — | — |
| S3-P6-run2 | 1/4 | 2 | — | — |
| S3-P6-run3 | 2/4 | 2 | — | — |
| S3-P7-run1 | 2/4 | 3 | — | — |
| S3-P7-run2 | 2/4 | 3 | — | — |
| S3-P7-run3 | 2/4 | 1 | — | — |
| S3-P8-run1 | 2/4 | 10 | — | — |
| S3-P8-run2 | 2/4 | 4 | — | — |
| S3-P8-run3 | 2/4 | 2 | — | — |
| S3-P9-run1 | 0/4 | 5 | — | — |
| S3-P9-run2 | 1/4 | 9 | — | — |
| S3-P9-run3 | 1/4 | 10 | — | — |
| S3-P10-run1 | 0/4 | 3 | — | — |
| S3-P10-run2 | 2/4 | 2 | — | — |
| S3-P10-run3 | 2/4 | 2 | — | — |

## API failures (every errored response, in any send)

| Send | Model | ms | Error | Outcome |
|---|---|---:|---|---|
| S3-P1-run2 | gemma-4-26b-a4b | 180012 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P3-run2 | gemini-2-5-flash | 175110 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P3-run3 | gemini-2-5-flash | 323 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P3-run3-retry | gemini-2-5-flash | 7196 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1 | gemini-2-5-flash | 10117 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1-retry | gemini-2-5-flash | 619 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1-retry2 | gemini-2-5-flash | 574 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1-retry3 | gemini-2-5-flash | 654 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1-retry4 | gemini-2-5-flash | 518 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1-retry5 | gemini-2-5-flash | 569 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run2 | gemma-4-26b-a4b | 180004 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P4-run2 | gemini-2-5-flash | 550 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run3 | gemma-4-26b-a4b | 180008 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P5-run1 | gemini-3-5-flash | 10525 | fetch failed | recovered by a later re-send |
| S3-P5-run1 | gemma-4-26b-a4b | 10525 | fetch failed | recovered by a later re-send |
| S3-P5-run2 | gemma-4-26b-a4b | 180003 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P6-run1 | gemma-4-26b-a4b | 180005 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P6-run1-retry | gemma-4-26b-a4b | 180009 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P6-run2 | gemini-3-5-flash | 1248 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P6-run3 | gemini-3-5-flash | 642 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P7-run1-retry | gemini-3-5-flash | 642 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P7-run1-retry2 | gemini-3-5-flash | 128100 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P7-run2-retry | gemini-3-5-flash | 39674 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P7-run2-retry2 | gemini-3-5-flash | 193697 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P8-run1-retry | gemini-3-5-flash | 259582 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P8-run1-retry2 | gemini-3-5-flash | 34028 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P8-run1-retry3 | gemini-3-5-flash | 659506 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P8-run1-retry4 | gemini-3-5-flash | 541 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P8-run1-retry5 | gemini-3-5-flash | 8094 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P8-run1-retry6 | gemini-3-5-flash | 16771 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P8-run1-retry7 | gemini-3-5-flash | 514 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P8-run1-retry8 | gemini-3-5-flash | 416 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P8-run1-retry9 | gemini-3-5-flash | 529 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P8-run2-retry | gemini-3-5-flash | 10522 | fetch failed | recovered by a later re-send |
| S3-P8-run2-retry | gemini-2-5-flash | 10521 | fetch failed | recovered by a later re-send |
| S3-P8-run2-retry2 | gemini-3-5-flash | 3212895 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P8-run2-retry2 | gemini-2-5-flash | 3212894 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P8-run2-retry3 | gemini-3-5-flash | 635 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P9-run1 | gemma-4-26b-a4b | 10109 | fetch failed | recovered by a later re-send |
| S3-P9-run1-retry3 | gemini-2-5-flash | 935723 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P9-run2-retry2 | gemini-2-5-flash | 944381 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P9-run2-retry3 | gemini-2-5-flash | 622 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P9-run2-retry4 | gemini-2-5-flash | 958866 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P9-run2-retry5 | gemini-2-5-flash | 490 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P9-run2-retry6 | gemini-2-5-flash | 7574 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P9-run2-retry7 | gemini-2-5-flash | 571 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P9-run3-retry2 | gemini-2-5-flash | 377 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P9-run3-retry3 | gemini-3-5-flash | 43627 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P9-run3-retry3 | gemini-2-5-flash | 256 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P9-run3-retry4 | gemini-2-5-flash | 133 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P9-run3-retry5 | gemini-2-5-flash | 146 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P9-run3-retry6 | gemini-2-5-flash | 189 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P9-run3-retry7 | gemini-2-5-flash | 402 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P9-run3-retry8 | gemini-2-5-flash | 257 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P9-run3-retry9 | gemini-2-5-flash | 281 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |
| S3-P10-run1 | gemma-4-26b-a4b | 180005 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P10-run1-retry2 | gemini-2-5-flash | 255 | HTTP 404: [{ "error": { "code": 404, "message": "This model models/gemini-2.5-flash is no longer available to new users. Please update your  | recovered by a later re-send |

## Events (this session)

- 2026-09-26T02:06:24.220Z sending S3-P9-run3-retry10 to gemini-2-5-flash
- 2026-09-26T02:06:50.422Z S3-P9-run3-retry10: 1/1 OK
- 2026-09-26T02:07:10.445Z sending S3-P10-run1-retry3 to gemini-2-5-flash
- 2026-09-26T02:07:38.412Z S3-P10-run1-retry3: 1/1 OK
- 2026-09-26T02:07:58.432Z sending S3-P10-run2-retry2 to gemini-2-5-flash
- 2026-09-26T02:08:10.480Z S3-P10-run2-retry2: 1/1 OK
- 2026-09-26T02:08:30.498Z sending S3-P10-run3-retry2 to gemini-2-5-flash
- 2026-09-26T02:09:02.268Z S3-P10-run3-retry2: 1/1 OK
