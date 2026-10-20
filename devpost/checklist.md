---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast (chosen by learner; pause after slice 2 for design feedback and at final review)

## Slices

- [x] **1. Open the app and see the flagship headline, computed by a tested engine**
  Becomes usable: A running page with the masthead and headline block: "Pass rates are up 4 points.", `62.5% → 66.5%`, the fictional-data label and the primary button. Every number comes from `analyze()` on the flagship dataset, and the full decomposition is computed and proven by tests (rate −2.0, composition +6.0, net +4.0).
  Why now: Two biggest risks first. (a) Untested combination of current dependency versions (TypeScript 7, Vite 8, Vitest 5, React plugin), which must install and run together before anything else. (b) The math is the product's credibility; the exact-rational rounding and the decomposition invariant must be right before any UI depends on them. Bootstrapping is folded in here.
  PRD ref: `prd.md > The Core Journey` (step 1), `prd.md > The headline block`
  Spec ref: `spec.md > Stack`, `spec.md > Math engine — src/engine/` (`Types`, `Decomposition and aggregation`, `Classification`, `Display plan and formatting`), `spec.md > Sample data — src/data/, public/`, `spec.md > Headline block — components/HeadlineBlock.tsx`, `spec.md > Masthead — components/Masthead.tsx`, `spec.md > File Structure`
  Build: Scaffold Vite + React + TypeScript; install and pin exact versions that work together; add typecheck/test/build scripts. Implement the engine: exact rational helper and `roundRational`, `analyze` (aggregation + symmetric decomposition + invariant), exact `classify` (all five patterns), `format` (adaptive precision 1→3, `≈` fallback, no negative zero, tiny nonzero display). Add the flagship dataset, design tokens, and self-hosted fonts. Render Masthead and HeadlineBlock from the Analysis.
  Verify (mechanical): `npm run typecheck`, `npm test`, `npm run build` all pass. Tests cover: flagship values and `d = 1`; independent exact-fraction oracle versus engine on seeded random datasets (≤1e-12); invariant; every classification pattern; rounding helper cases (positive, negative, exactly halfway, near-halfway, 1.005 → 1.01, zero, negative zero, tiny nonzero); precision escalation and the approximate path. Dev server starts and the page shows `62.5% → 66.5%` (checked in the browser).
  Learner check: Run `npm run dev`, open the local URL, and confirm the headline and both rates appear in the editorial style. Then open `src/engine/analyze.test.ts` and find the test that proves rate effect + composition effect = overall change.
  Commit: `feat: scaffold app and tested rate/mix engine with flagship headline`

- [x] **2. Look beneath the headline: the signature reveal**
  Becomes usable: Clicking **Look beneath the headline** keeps the headline in place and opens the investigation beneath it. You see four site rows each showing a 2.0-point decline, the finding "Every site declined. So why did the overall rate rise?", the waterfall (−2.0 + 6.0 = +4.0) and a plain-English composition explanation. Works with the keyboard and without animation.
  Why now: This is the unique kernel (rate-versus-mix explanation delivered through the reveal). It comes immediately after the engine exists so the most important experience gets the most iteration and early feedback.
  PRD ref: `prd.md > The Core Journey` (steps 2–3), `prd.md > The reveal and the decomposition`, `prd.md > Look and Feel`, `prd.md > Honest analysis for every valid dataset`
  Spec ref: `spec.md > App — App.tsx and useInvestigation.ts`, `spec.md > Investigation — components/Investigation.tsx`, `spec.md > Site comparison — components/SiteComparison.tsx`, `spec.md > Finding callout — components/FindingCallout.tsx`, `spec.md > Waterfall — components/Waterfall.tsx`, `spec.md > Narrative — narrative.ts`, `spec.md > Look and Feel`
  Build: `useInvestigation` state (`source`, `revealed`); headline/finding/explanation narrative functions with example and upload `Terms` for all patterns; Investigation, SiteComparison, FindingCallout and the accessible SVG Waterfall; focus moves to the investigation heading; fade only when motion is allowed.
  Verify (mechanical): Unit tests for narrative output per pattern (no tutoring words with upload terms; the reversal line appears only for `reversal`). Component test: clicking the button reveals the section, sets `aria-expanded`, and moves focus. Browser: screenshot of the desktop reveal inspected.
  Learner check: Click **Look beneath the headline** and tell me whether the moment lands: do you understand why the overall rate rose within about 15 seconds? Then press Tab to the button and press Enter to try it by keyboard.
  Commit: `feat: add headline reveal with site comparison, finding and rate/mix waterfall`

- [ ] **3. Copy a management briefing**
  Becomes usable: Beneath the waterfall, an executive summary shows a deterministic briefing paragraph whose numbers match the screen. **Copy briefing** puts it on the clipboard and says "Copied"; if copying isn't available, the text is selected for manual copy.
  Why now: Completes the core journey end to end on the flagship (headline → reveal → briefing), so the whole PRD story is demonstrable before CSV work begins.
  PRD ref: `prd.md > The Core Journey` (step 4), `prd.md > The executive briefing`
  Spec ref: `spec.md > Narrative — narrative.ts` (briefing), `spec.md > Briefing card — components/BriefingCard.tsx`, `spec.md > Important Failure Modes`
  Build: Briefing template (all patterns, approximate note, limitations sentence), BriefingCard with clipboard and fallback, `aria-live` status.
  Verify (mechanical): Flagship briefing equals the expected text verbatim; briefing determinism test; test that every number in the briefing equals the displayed strings; component test for success and fallback paths; browser check that the clipboard receives the text.
  Learner check: Click **Copy briefing**, paste it into any document, and judge whether you'd send it to a manager as-is.
  Commit: `feat: add deterministic copyable management briefing`

- [ ] **4. Analyze your own CSV**
  Becomes usable: The secondary "Analyze your own CSV" section: format explanation, template and second-sample downloads, file upload. A valid file replaces the example (generic "success rate / group" wording) and runs the same headline → reveal → briefing journey with honest wording for whatever the data shows. An invalid file shows specific errors naming rows and values and keeps the current view. **Return to the example** restores the flagship.
  Why now: Proves the analysis is reusable rather than a canned demo, which completes `What We're Building`. Depends on the engine and narrative from slices 1–3, which are already proven.
  PRD ref: `prd.md > CSV upload`, `prd.md > Honest analysis for every valid dataset`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > CSV input — src/csv/` (`Parser wrapper`, `Validator`), `spec.md > Data panel — components/DataPanel.tsx`, `spec.md > Sample data — src/data/, public/`, `spec.md > App — App.tsx and useInvestigation.ts`
  Build: PapaParse wrapper (BOM, size limit, parser errors), validator (all rules, up to 10 errors with row numbers), DataPanel with downloads and error region, template and `sample-consistent.csv`, upload/return state transitions.
  Verify (mechanical): Validator tests with a passing and a failing fixture per rule (wrong period labels, missing group, successes > total, zero total, negative/decimal counts, duplicates, case-collision names, BOM, quoted fields, extra/missing columns, empty and oversized files). Integration test: uploading the sample shows non-tutoring wording and correct numbers. Playwright: upload the valid sample, upload an invalid file, return to the example.
  Learner check: Download the second sample, upload it, and check the result is honest (no forced warning). Then edit a period label to `Previous` (capital P), upload it, and judge whether the error message tells you exactly what to fix.
  Commit: `feat: add fixed-format CSV upload with strict validation and samples`

- [ ] **5. Works for everyone, on every screen**
  Becomes usable: The complete journey works on a phone-width screen, by keyboard only, with reduced motion, and passes an automated accessibility scan; the color tokens meet contrast targets; the README explains how to run it.
  Why now: Accessibility and responsiveness are PRD requirements, not polish; checking them across the finished journey in one pass catches interactions between components that per-slice checks miss. Last before final review because it needs every surface to exist.
  PRD ref: `prd.md > States and Boundaries` (keyboard, reduced motion, mobile), `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Styles — src/styles/`, `spec.md > Verification Plan`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Playwright e2e specs (full journey desktop and mobile, keyboard-only run, reduced motion, axe scan, upload paths); token contrast test; responsive and focus fixes found by inspecting screenshots; `<noscript>` message; README with run, test and CSV format instructions; up to three focused visual-improvement passes driven by screenshots.
  Verify (mechanical): `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e` all pass; axe reports no serious or critical violations; desktop (1440) and mobile (375) screenshots of initial, revealed and upload-error states inspected.
  Learner check: Open the app on your phone-width browser window (or your phone), run the whole journey, then repeat using only the keyboard.
  Commit: `feat: verify responsive, keyboard and reduced-motion journey with e2e and a11y checks`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (the reveal), so the signature moment and visual direction can still shape slices 3–5
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions
- Slice 2 checkpoint feedback applied — learner asked for a stronger at-a-glance reveal, headline continuity, focus return on collapse, and a less repetitive explanation. Added a neutral standfirst beside the headline (desktop read as unfinished), terracotta change pills, headline-anchored scroll on reveal, a focus-return test, and an explanation that interprets the split instead of restating the equation. No scope change.
