# Stage 3 — Appendix D.5 prompts (formal evaluation)

**Status:** DRAFT 2026-09-25. Machine-readable copy: `prompts.json` (this is what the batch runner reads).

Two edits to the manuscript's Appendix D.5 are **proposed, not yet confirmed by the group**. The tool uses them operationally so the outputs are parseable JSON; do not treat the manuscript wording as final until the group agrees.

- **Fix A — system prompt.** D.5's system prompt ends with a numbered-list output instruction. It is replaced by the JSON tail already used and tested through Stage 1/2 (below). Otherwise identical.
- **Fix B — prompt 4.** The clause "Create an outline I can base my writing on, and" is dropped, so it asks for one deliverable (microtasks) like the other nine.

## System prompt (all 120 sends)

```
You are an academic task planning assistant. Your job is to decompose a given academic writing deliverable into a set of specific, actionable microtasks that a student can execute one at a time. Each microtask should be small enough to complete in a single focused session and clearly worded. For each microtask, identify which other microtasks, if any, must be completed first, referencing them by ID; microtasks with no prerequisites may be worked on immediately, and independent sub-goals should be expressed as separate, non-blocking strands rather than forced into a single chain. Do not give advice, explanations, or motivational language. Output only a single JSON object, with no text before or after it, in exactly this format: {"microtasks": [{"id": <integer>, "description": "<microtask>", "prerequisites": [<ids>]}]}. Use an empty array for microtasks with no prerequisites.
```

Fixed conditions: `temperature: 0`, `max_tokens: 7400`, no provider JSON mode. 10 prompts × 3 runs × 4 models = 120 responses. Run labels: `S3-P<n>-run<n>` (retries `-retry`, `-retry2`).

## User prompts

### S3-P1 (D.5 #1)

I need to write the Background of the Study section for a research paper on the effects of social media use on teenagers. The paper argues that excessive social media use is linked to increased anxiety and lower self-esteem among teenagers. Break this down into microtasks I can start working on immediately.

### S3-P2 (D.5 #2)

I need to write Chapter 1 of a research paper on social media's effects on teenagers. The paper examines how social media use affects teenagers' mental health and academic performance. Chapter 1 consists of four sections: Background of the Study, Research Objectives, Scope and Limitations, and Significance of the Study. Break this chapter down into microtasks I can execute one at a time, noting which microtasks depend on others and which can be worked on independently.

### S3-P3 (D.5 #3)

I need to write the Significance of the Study section for a research paper on sleep deprivation and academic performance among undergraduate students. The section needs to address significance to the academic community, to university administrators, and to student health services. Give me the most granular breakdown of microtasks possible for writing this section.

### S3-P4 (D.5 #4) — Fix B applied

I am tasked with writing the methodology section for a research paper on the effects of social media on teenagers, in which we will be surveying and interviewing undergraduate students within our college. Break this down into microtasks that are simple to understand and initiate, noting which microtasks depend on others and which can be worked on independently.

### S3-P5 (D.5 #5)

I am writing the scope and limitations section for our research paper on peer pressure and risk-taking behavior among adolescents. We will only have high school students from our partner schools as participants. Another limitation is that we are not measuring long-term behavioral outcomes beyond the school year. Create microtasks that I can accomplish procedurally to complete this section of the paper.

### S3-P6 (D.5 #6)

I need to write the related literature section of our research paper on the effects of social media use on teenagers. I do not know where to start. Create microtasks that would help me write this section of the paper.

### S3-P7 (D.5 #7)

I have to write something about procrastination and self-regulation in college students for my research paper but I'm not sure what part to focus on yet. Help me figure out what to do next.

### S3-P8 (D.5 #8)

I need to write the Results and Discussion chapter for a research paper on group conformity in decision-making among university students. We ran a controlled group experiment with 80 participants and found that individuals were significantly more likely to change their answer when exposed to unanimous incorrect group responses, along with several recurring themes from follow-up interviews about social pressure. Break this down into microtasks for presenting the quantitative results, discussing the qualitative themes, and connecting both back to the research questions, noting which microtasks depend on others and which can be worked on independently.

### S3-P9 (D.5 #9)

I need to write the Conclusion and Recommendations chapter for our research paper on reward-based habit formation among working professionals. The chapter should summarize key findings from our results, discuss implications for employers and HR practitioners, acknowledge study limitations, and suggest directions for future research. Break this down into microtasks. I can complete one at a time, noting which microtasks depend on others and which can be worked on independently.

### S3-P10 (D.5 #10)

I just got my draft of the Introduction chapter back from my thesis adviser, and I am overwhelmed by the required revisions. The adviser left three main comments: 1) The research gap is not clearly explicitly stated, 2) The transition between the background context and the problem statement is abrupt and confusing, and 3) I need to incorporate at least three more recent sources (published between 2024-2026) to justify the severity of the problem. Break this revision process down into actionable microtasks so I can tackle these edits without panicking, noting which microtasks depend on others and which can be worked on independently.
