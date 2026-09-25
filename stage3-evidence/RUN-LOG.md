# Stage 3 formal evaluation — run log

Generated 2026-09-25T05:14:35.690Z by `headless-node` · stage3-v1.0 (4 Stage 2 finalists), export schema 2 — 2026-09-25
Prompt set: stage3/prompts.json (v1.0-draft) · 10 prompts × 3 runs × 4 models = 120 responses
Models: gemini-3-5-flash, gemma-4-26b-a4b, north-mini-code, gemini-2-5-flash

**Status:** paused — gemini-2-5-flash, gemini-3-5-flash hit a quota this session; responses for them are waiting. Run the batch again after the daily reset — it fills the gaps in.

| | Responses |
|---|---:|
| Succeeded on the first pass | 65 |
| Failed first pass, recovered by a re-send | 22 |
| Waiting on a daily-quota reset (run the batch again after it) | 33 |
| Failed, still to be re-sent | 0 |
| Still failing after 2 re-sends (unresolved) | 0 |
| Not sent yet | 0 |
| **Present and usable** | **87 of 120** |

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
| S3-P4-run1 | 3/4 | 5 | gemini-2-5-flash | — |
| S3-P4-run2 | 2/4 | 1 | gemini-2-5-flash | — |
| S3-P4-run3 | 2/4 | 1 | gemini-2-5-flash | — |
| S3-P5-run1 | 0/4 | 2 | gemini-2-5-flash | — |
| S3-P5-run2 | 1/4 | 2 | gemini-2-5-flash | — |
| S3-P5-run3 | 2/4 | 1 | gemini-2-5-flash | — |
| S3-P6-run1 | 1/4 | 3 | gemini-2-5-flash | — |
| S3-P6-run2 | 1/4 | 1 | gemini-2-5-flash | — |
| S3-P6-run3 | 2/4 | 1 | gemini-2-5-flash | — |
| S3-P7-run1 | 2/4 | 1 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P7-run2 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P7-run3 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P8-run1 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P8-run2 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P8-run3 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P9-run1 | 0/4 | 2 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P9-run2 | 1/4 | 1 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P9-run3 | 1/4 | 1 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P10-run1 | 0/4 | 1 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P10-run2 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |
| S3-P10-run3 | 2/4 | 0 | gemini-3-5-flash, gemini-2-5-flash | — |

## API failures (every errored response, in any send)

| Send | Model | ms | Error | Outcome |
|---|---|---:|---|---|
| S3-P1-run2 | gemma-4-26b-a4b | 180012 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P3-run2 | gemini-2-5-flash | 175110 | HTTP 503: [{ "error": { "code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. P | recovered by a later re-send |
| S3-P3-run3 | gemini-2-5-flash | 323 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P3-run3-retry | gemini-2-5-flash | 7196 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P4-run1 | gemini-2-5-flash | 10117 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | re-sent, failed again |
| S3-P4-run1-retry | gemini-2-5-flash | 619 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | re-sent, failed again |
| S3-P4-run1-retry2 | gemini-2-5-flash | 574 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | re-sent, failed again |
| S3-P4-run1-retry3 | gemini-2-5-flash | 654 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | re-sent, failed again |
| S3-P4-run1-retry4 | gemini-2-5-flash | 518 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | re-sent, failed again |
| S3-P4-run1-retry5 | gemini-2-5-flash | 569 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | waiting on quota reset |
| S3-P4-run2 | gemma-4-26b-a4b | 180004 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P4-run2 | gemini-2-5-flash | 550 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | re-sent, failed again |
| S3-P4-run3 | gemma-4-26b-a4b | 180008 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P5-run1 | gemini-3-5-flash | 10525 | fetch failed | recovered by a later re-send |
| S3-P5-run1 | gemma-4-26b-a4b | 10525 | fetch failed | recovered by a later re-send |
| S3-P5-run2 | gemma-4-26b-a4b | 180003 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P6-run1 | gemma-4-26b-a4b | 180005 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P6-run1-retry | gemma-4-26b-a4b | 180009 | Timed out after 180000ms waiting for a response | recovered by a later re-send |
| S3-P6-run2 | gemini-3-5-flash | 1248 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P6-run3 | gemini-3-5-flash | 642 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | recovered by a later re-send |
| S3-P7-run1-retry | gemini-3-5-flash | 642 | HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. For more infor | waiting on quota reset |
| S3-P9-run1 | gemma-4-26b-a4b | 10109 | fetch failed | recovered by a later re-send |
| S3-P10-run1 | gemma-4-26b-a4b | 180005 | Timed out after 180000ms waiting for a response | recovered by a later re-send |

## Events (this session)

- 2026-09-25T05:08:30.155Z sending S3-P4-run1-retry5 to gemini-2-5-flash
- 2026-09-25T05:08:30.742Z gemini-2-5-flash: set aside for this session — daily quota reached (HTTP 429)
- 2026-09-25T05:08:30.742Z S3-P4-run1-retry5: 0/1 OK — failed: gemini-2-5-flash (HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your cur)
- 2026-09-25T05:08:50.762Z sending S3-P6-run3-retry to gemini-3-5-flash
- 2026-09-25T05:09:05.837Z S3-P6-run3-retry: 1/1 OK
- 2026-09-25T05:09:25.856Z sending S3-P7-run1-retry to gemini-3-5-flash
- 2026-09-25T05:09:26.499Z gemini-3-5-flash: set aside for this session — daily quota reached (HTTP 429)
- 2026-09-25T05:09:26.499Z S3-P7-run1-retry: 0/1 OK — failed: gemini-3-5-flash (HTTP 429: [{ "error": { "code": 429, "message": "You exceeded your cur)
- 2026-09-25T05:09:46.950Z sending S3-P9-run1-retry2 to north-mini-code
- 2026-09-25T05:10:03.872Z S3-P9-run1-retry2: 1/1 OK · OpenRouter free quota left before send: 24/50
- 2026-09-25T05:10:24.089Z sending S3-P9-run2-retry to north-mini-code
- 2026-09-25T05:10:30.850Z S3-P9-run2-retry: 1/1 OK · OpenRouter free quota left before send: 24/50
- 2026-09-25T05:10:51.094Z sending S3-P9-run3-retry to north-mini-code
- 2026-09-25T05:10:59.328Z S3-P9-run3-retry: 1/1 OK · OpenRouter free quota left before send: 23/50
- 2026-09-25T05:11:19.610Z sending S3-P10-run1-retry to gemma-4-26b-a4b, north-mini-code
- 2026-09-25T05:12:10.909Z S3-P10-run1-retry: 2/2 OK · OpenRouter free quota left before send: 22/50
- 2026-09-25T05:12:31.341Z sending S3-P10-run2 to gemma-4-26b-a4b, north-mini-code
- 2026-09-25T05:13:22.592Z S3-P10-run2: 2/2 OK · OpenRouter free quota left before send: 20/50
- 2026-09-25T05:13:43.026Z sending S3-P10-run3 to gemma-4-26b-a4b, north-mini-code
- 2026-09-25T05:14:35.687Z S3-P10-run3: 2/2 OK · OpenRouter free quota left before send: 19/50
