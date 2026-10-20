---
doc: prd
status: approved
---

# Metric Mirage — Product Requirements

A single-page investigation tool that shows an operations or program manager whether a rising (or falling) overall success rate hides what happened inside each site, explains the change, and produces a briefing they can copy into a report.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

## The Core Journey

1. **Arrive.** The page opens already loaded with the fictional tutoring-network example, clearly labeled fictional. The first screen shows only the headline finding: "Pass rates are up 4 points." and `62.5% → 66.5%`, with one prominent action, **Look beneath the headline**. No site-level conclusion is visible yet.
2. **Reveal the sites (Step A).** Clicking the action keeps the headline on screen as an anchor and expands the investigation beneath it. Four site rows appear (North 80% → 78%, East 70% → 68%, South 60% → 58%, West 40% → 38%), each showing its decline. The central finding appears: **"Every site declined. So why did the overall rate rise?"**
3. **Explain the change (Step B).** A simple waterfall shows the overall change as two parts: within-site rate change **−2.0 pp** and composition change **+6.0 pp**, netting to **+4.0 pp**, with the equation "−2.0 + 6.0 = +4.0 percentage points" in text. A plain-English sentence explains the composition effect.
4. **Take the outcome (Step C).** An executive-summary block shows a deterministic, numerically accurate briefing paragraph and a **Copy briefing** button. Copying confirms visibly.
5. **Try their own data.** A visible, secondary **Analyze your own CSV** option lets them download a template and upload a file in the fixed format. A valid upload replaces the example and runs the same journey (steps 1–4) on their data, adapting honestly to what that data shows.

Success: within about one minute someone has seen the headline, revealed the site results, understood the change, and copied a briefing.
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

## Screens and Layout

One page, one vertical story. No menus, sidebars, feature grids, or dashboard chrome. Sections, top to bottom:

1. **Masthead.** Small Metric Mirage wordmark with the tagline "Before you report that number."
2. **Headline block.** Small label (`TUTORING NETWORK · PERFORMANCE REVIEW`), large serif headline, the two rates, and the primary action. Generous whitespace; this is the visual anchor and stays visible after the reveal.
3. **Investigation (appears after the click, beneath the headline).** In order: the site comparison, the central finding line, the decomposition graphic with the equation and plain-English explanation, then the executive summary with **Copy briefing**.
4. **Your own data (secondary, near the main experience).** "Analyze your own CSV," a template download, a short plain explanation of the accepted format, and the upload control. Visible from the start but visually secondary to the main action.
5. **Fictional-data label and limitations note.** A clear "Fictional example data" label on the example, and a brief note that this is a descriptive analysis (no causal or significance claims).

On mobile, the same content stacks vertically in the same order with the same meaning; nothing is dropped.
Source: `scope.md > Inspiration & Identity`.

## Look and Feel

Premium editorial data journalism: sophisticated, thoughtful, trustworthy, memorable; an art-directed investigation, not a generic AI-generated SaaS dashboard. Inspiration: Financial Times visual journalism and The Pudding's interactive storytelling, combined with the polish of a premium modern product, as principles only; the identity is original.

- **Typography.** An editorial serif for large headlines (Newsreader or a comparable openly licensed face). A highly readable modern sans-serif (Inter) for explanations, controls, numbers, and data labels. Large headlines, restrained type, intentional whitespace. Numbers are prominent, precisely aligned, and easy to compare.
- **Color.** Warm ivory/cream background (not a black dashboard). Deep charcoal or midnight navy text. Muted teal for improvements, restrained terracotta for declines, a distinct muted indigo/blue for composition effects, neutral gray for supporting text. Color carries meaning, never decoration.
- **Never color alone.** Every direction is also shown by a signed value (+/−), a text label, and a directional indicator.
- **Avoid.** Neon glows, glassmorphism, heavy gradients, blinking alerts, generic AI-dashboard styling.
- **Contrast.** Text and meaningful graphics meet accessibility contrast ratios.
- **Motion.** Gentle transitions only where they clarify the progression (e.g., the expansion beneath the headline). Never required to understand the content.
- **The headline tone.** Initially reassuring, without asserting that every site improved.

Design targets (not reasons to remove qualifications): **2-second test**, a judge understands what headline is being investigated; **15-second test**, a judge sees something surprising and understands why it matters without statistics knowledge; **60-second test**, a user has revealed the site results, understood the change, and copied a briefing.
Source: `scope.md > Inspiration & Identity`.

## Features and Behavior

### The headline block
- As a program manager, I want to see the headline change first so that I immediately know what number is being investigated.
  - [ ] The first screen shows the label, headline, the two rates (`62.5% → 66.5%`), and one prominent primary action, with no site-level results visible.
  - [ ] The example is loaded automatically on arrival and labeled as fictional.
  - [ ] The headline direction and size are computed from the data (e.g., "up 4 points", "down N points"), never hard-coded for uploads.
  - [ ] The information needed to interpret the number (what it measures, that the example is fictional, which periods are compared) is visible without clicking.

### The reveal and the decomposition
- As a program manager, I want to look beneath the headline so that I can see what happened at each site and why the overall number moved.
  - [ ] Clicking **Look beneath the headline** keeps the headline visible and expands the investigation beneath it; it does not navigate to a different page.
  - [ ] Each site row shows previous rate → current rate and its signed change with a text/indicator for direction.
  - [ ] The central finding line is generated from the data (e.g., "Every site declined. So why did the overall rate rise?" for the example).
  - [ ] The decomposition shows within-site change, composition change, and net change, and the net equals the overall change shown in the headline.
  - [ ] The equation is shown in text (`−2.0 + 6.0 = +4.0 percentage points`) alongside the graphic.
  - [ ] A plain-English sentence explains the composition effect using the actual data (which site's share grew or shrank), avoiding statistical jargon.
  - [ ] The overall observed change and the explanation of its components are always visually and verbally distinct.

### The executive briefing
- As a program manager, I want a ready-to-use summary so that I can communicate the finding in a management report.
  - [ ] A deterministic briefing paragraph states: the observed overall change, which sites increased or declined, the within-site and composition components, and a limitations sentence (descriptive only, no causal claims, no significance claim).
  - [ ] The briefing's numbers exactly match the numbers on screen.
  - [ ] **Copy briefing** places the text on the clipboard and gives visible confirmation; if copying is unavailable, the text is selectable so the user can copy it manually.
  - [ ] The same input always produces the same briefing text.

### Honest analysis for every valid dataset
- As a program manager, I want accurate results for my own data so that I can trust the tool beyond the demo.
  - [ ] Every valid dataset shows the rate/mix explanation and a briefing.
  - [ ] **All sites improve and overall improves:** directions are described as consistent, with a positive but appropriately qualified explanation. No warning or paradox is manufactured.
  - [ ] **Overall declines:** the negative change is explained as accurately as a positive one.
  - [ ] **Some sites improve, others decline:** described as a mixed result, and distinguished from a complete reversal.
  - [ ] **Complete reversal** (every site moved one direction while the overall rate moved the opposite direction): highlighted as such.
  - [ ] The signature "Every site declined. So why did the overall rate rise?" framing appears only when the data actually shows a reversal.
  - [ ] No causal claims or statistical-significance claims are made anywhere.

### CSV upload
- As a program manager, I want to analyze my own two-period data so that I can use the tool on my real report.
  - [ ] A template CSV can be downloaded, with a plain explanation of the accepted format beside it.
  - [ ] A valid file replaces the example; all headline, site, decomposition, and briefing content reflect the uploaded data (no hard-coded tutoring-network text remains).
  - [ ] An invalid file is rejected with a specific, human-readable message naming the problem (and the row or column where possible); the previous view stays intact.
  - [ ] A second valid sample file (different from the flagship) is available and produces correct results.

Accepted format (fixed): one row per group per period, columns `period, group, successes, total`; exactly two periods; every group present in both periods; whole-number counts; successes ≤ total; total > 0.
Source: `scope.md > The POC Boundary`.

## States and Boundaries

- **First use.** Example loaded, labeled fictional, only the headline and primary action visible.
- **After the reveal.** Headline stays as anchor; investigation visible beneath it; focus and reading order follow the story.
- **Uploaded data, valid.** Same journey on the user's data; labels say it is their data, not fictional.
- **Uploaded data, invalid.** Clear error naming the issue; example/previous view preserved; a way to try again or return to the example.
- **Return to the example.** The user can get back to the fictional example after uploading.
- **Reduced motion / no animation.** All investigation content is revealed directly with proper headings and sensible focus movement; nothing depends on animation.
- **Keyboard use.** All actions (reveal, copy, download, upload, return to example) are reachable and operable by keyboard with visible focus.
- **Mobile.** Same content stacked vertically, same order, same meaning.
- **Persistence.** Nothing is saved; uploaded data stays in the browser and is gone when the page closes.
- **Copy unavailable.** Briefing text remains selectable.

## Product Decisions

- Single-page "executive briefing" with no navigation or dashboard chrome — "I don't want to build another dashboard that simply displays statistics."
- The headline stays visible as the anchor while the investigation expands beneath it — the reveal should feel like one story, not a different screen.
- The explanation (rate vs. mix) matters more than animation; the reveal must work without any animation.
- Warm ivory, charcoal/navy, muted teal (improve), terracotta (decline), muted indigo (composition); editorial serif + Inter; never color alone.
- CSV upload is in the first version so the product reads as reusable, not a canned demo; the format is deliberately fixed and tight.
- The dramatic example must not shape how other datasets behave; unremarkable results are explained as honestly as dramatic ones.
- The first screen hides the site-level conclusion but not information needed to interpret the number.
- The decomposition graphic is a simple waterfall; clarity over visual complexity.

## What We're Building

- One-page experience: masthead, headline block, expandable investigation (sites → decomposition → briefing)
- Fictional tutoring-network example loaded on arrival and labeled fictional
- Honest, data-driven analysis and language for consistent, mixed, declining, and reversal cases
- Exact rate/mix decomposition (symmetric), checked so components sum to the overall change
- Deterministic copyable briefing
- Fixed-format CSV upload with template download, format explanation, specific validation errors, and a way back to the example
- A second valid sample CSV
- Responsive layout, keyboard access, reduced-motion behavior, accessible contrast and non-color cues

## Deferred From the POC

- **Historical kidney-stone case** — requires source verification and careful two-cohort vs. two-period treatment; later if the core is solid.
- **Interactive composition slider** — optional enhancement; must be labeled hypothetical.
- **Flexible CSV handling** (column mapping, more than two periods, missing groups, Excel) — large edge-case surface for little proof value.

## Possible Later Enhancements

- Historical validation case with citation.
- Composition slider (hypothetical illustration).
- Print/export of the briefing.

## Non-Goals

- No generative AI analysis or chat — the briefing must match the math exactly.
- No user accounts or saved data — nothing needs to persist.
- No complex dashboards, forecasting, or multiple scenarios — they dilute the investigation.
- No paid APIs.
- No causal claims, significance tests, or confidence badges — this is a descriptive analysis.
- No medical or policy recommendations.

## Open Questions

Resolved by the learner at PRD approval:

1. **Period labels.** The CSV `period` column must contain exactly `previous` and `current`. No order inference and no swap control. A downloadable example shows the structure; wrong labels produce a clear validation error.
2. **Metric terminology.** Uploads use "success rate" and "group"; the fictional example uses "pass rate" and "site." All calculations, comparisons, and briefing text adapt to the actual data, and tutoring-specific wording is never reused for uploads.
3. **Unchanged and reversal.** A change of exactly zero is "unchanged." A complete reversal requires a nonzero overall change in one direction and a nonzero change in the opposite direction for every group. Mixed, consistent, and unchanged outcomes are described honestly.

Requirements carried into `4-spec`: exact underlying calculations with a stated numerical tolerance; rounding must never produce visibly contradictory decomposition totals or equations; all explanations are generated from calculated findings; nothing implies the decomposition establishes causation.
