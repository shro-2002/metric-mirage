---
doc: scope
status: approved
---

# Metric Mirage

Before you report that number: a browser tool that shows whether a rising overall success rate hides declines inside the groups that make it up, explains why, and hands you a briefing you can use.

## The Unique Kernel
The **rate-versus-mix explanation, delivered through a "Look beneath the headline" reveal**. Not another dashboard that displays statistics: someone sees a positive number, investigates it with one action, and discovers what they would otherwise have missed, then gets an exact split of the overall change into "groups got better/worse" vs. "the mix of groups shifted." The reveal earns attention; the explanation is what makes it useful; the copyable briefing turns the discovery into a decision.

## Who It's For
An operations or program manager at a multi-site organization preparing a monthly performance report. Today they report the aggregate success rate (often from a spreadsheet pivot) and may never check whether every site moved the opposite way, so they can misread an improvement or misallocate resources.

## The Core Loop
Open the app → see the headline change → click **Look beneath the headline** → see each group's result and the rate/mix split → copy the briefing. The explanation adapts honestly to whatever the data shows (reversal, consistent direction, mixed, or decline). They come back each reporting cycle with a new two-period CSV before putting a number in front of leadership.

## Inspiration & Identity
Editorial, premium, executive-briefing feel; polished and reliable, like a complete small product rather than a stats demo. Understandable in under a minute with no knowledge of Simpson's paradox or decomposition. Honest language: the aggregate improvement is real; the misleading inference is that individual sites improved. No causal claims.

## Why This Matters to the Learner
"I don't want to build another dashboard that simply displays statistics." The learner wants to practice plan-first, spec-driven development by making the key product and design decisions, and to ship "a small but complete application with an exceptional user experience, rather than a large application with many unfinished features."

## What "Working" Looks Like
Someone opens Metric Mirage and immediately sees a fictional tutoring network reporting a **+4.0 percentage-point** improvement (62.5% → 66.5%). They click **Look beneath the headline**; the screen transforms to show that **every site declined** (each by 2.0 pp). They see:

- Overall change: **+4.0 pp**
- Composition (mix) effect: **+6.0 pp**
- Within-site rate change: **−2.0 pp**

…and understand the improvement is real but comes from a shift toward the better-performing site, not from sites improving. They click **Copy briefing** and get a concise, accurate paragraph for a management report. Then they upload a different two-period CSV and the same analysis runs on it, proving it isn't a canned demo. All of it reads within a minute.

## The POC Boundary
- One-click fictional tutoring-network example (clearly labeled fictional)
- Headline-to-subgroup reveal, understandable without animation
- Exact, tested rate/mix calculations (rate + mix = overall change) and plain-language explanation
- **Honest analysis for every valid dataset, not just the flagship.** The dramatic reveal is the signature demo, but credibility depends on explaining ordinary results accurately: if the overall rate and all site rates improve, say their directions are consistent (no forced warning); if the overall rate declines, explain the negative change just as accurately; if some sites improve and others decline, call it a mixed result and distinguish it from a complete reversal. The rate/mix decomposition and the copyable briefing work for every valid dataset.
- Deterministic copyable management briefing (template-based, no AI-generated analysis)
- **Basic CSV upload in one fixed format**, tightly constrained: one row per group per period with columns like `period, group, successes, total`; exactly two periods; every group present in both; whole-number counts with successes ≤ total and total > 0. Anything else is rejected with a clear, specific error message, not guessed at. No column mapping, no Excel, no auto-detection.
- One second valid sample CSV that differs from the flagship, plus downloadable template

## Later
- Historical kidney-stone case (Charig et al., BMJ 1986), only with verified source counts and careful handling of "two cohorts" vs. "two time periods"
- Interactive composition slider (clearly labeled hypothetical)

## Explicitly Cut
- **Generative AI chat / LLM analysis** — the briefing must be deterministic and exactly match the math.
- **User accounts** — nothing needs saving; data stays in the browser.
- **Complex dashboards** — the opposite of the kernel.
- **Forecasting** — descriptive tool, not predictive.
- **Multiple scenarios / more than two periods** — one comparison keeps the explanation clear.
- **Paid APIs** — unnecessary and outside the budget.
- **Flexible CSV handling** (column mapping, extra periods, missing groups, XLSX) — big edge-case surface for little proof value; the fixed format is enough to show reusability.
