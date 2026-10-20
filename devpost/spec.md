---
doc: spec
status: approved
---

# Metric Mirage — Technical Spec

## How This Works, In Plain Language

Metric Mirage is a static web page. Everything runs in the visitor's browser: there is no server, no database, no account and no outside service. The pieces, in the order data passes through them:

1. **Data in.** Either the built-in fictional tutoring example (a small TypeScript object) or a CSV the user uploads. An uploaded file is read in the browser and never leaves the machine.
2. **Validator.** Checks the CSV against the fixed format (`period, group, successes, total`) and either produces a clean dataset or a list of specific, human-readable errors. Nothing invalid reaches the math.
3. **Math engine.** A pure TypeScript module with no React in it. It takes a clean dataset and returns one **Analysis** object: overall rates and change, each group's rates and change, the exact rate/mix decomposition, a classification of what happened (reversal, consistent, mixed, ...), and a display plan saying how many decimals to show. Every number on the page is derived from this one object.
4. **Narrative generator.** Pure functions that turn the Analysis into the headline, the central finding line, the composition explanation, and the copyable briefing. Text is templated, not AI-written, so the same input always gives the same words.
5. **React interface.** Presents the Analysis: headline block, reveal, site rows, waterfall, briefing. It holds only two pieces of state: where the data came from, and whether the investigation is open.

Why this shape: the product's credibility is the math and the wording. Keeping them in plain functions with no UI dependency means they can be tested exhaustively on their own, and the screen, the waterfall and the clipboard text cannot disagree because they read the same object. Nothing more elaborate is needed to prove the idea.

### Three concepts, short version

**Kitagawa decomposition.** Overall rate R = Σ wᵢ·rᵢ (wᵢ is group i's share of the total, rᵢ its rate). For one group, the change in a product splits exactly: w₁r₁ − w₀r₀ = ½(w₀+w₁)(r₁−r₀) + ½(r₀+r₁)(w₁−w₀). Expand the right side and the cross terms cancel; there is no leftover. Sum over groups: the first sum is the **rate effect** (each group's own change, weighted by its average share); the second is the **composition effect** (each group's change in share, valued at its average rate). The two always add to the observed overall change, by algebra, not by approximation. Averaging the two periods ("symmetric") avoids having to pick one period as the baseline, which would leave an interaction residual.

**React state.** The page is one component tree. `revealed` is a boolean held with `useState`. Clicking the button calls `setRevealed(true)`; React re-renders and the investigation components appear below the headline. No URL changes and no page load. The Analysis is not state: it is derived from the data with `useMemo`, so there is one source of truth and nothing to keep in sync.

**Data flow for an upload.** `File` → text → PapaParse rows → validator → `Dataset` → `analyze()` → `Analysis` → narrative functions → components and clipboard. Each arrow is a pure function or a single React event handler; an invalid file stops at the validator and the previous view stays.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. **Arrive.** `App` initializes `source = example`. `analyze(exampleDataset)` runs once (memoized). `HeadlineBlock` renders the headline and rates from the Analysis; `Investigation` is not rendered because `revealed = false`.
2. **Click "Look beneath the headline."** `setRevealed(true)`. `Investigation` mounts below the headline; focus moves to its heading so keyboard and screen-reader users land at the new content. CSS adds a short fade only when `prefers-reduced-motion` is not set.
3. **Step A.** `SiteComparison` renders one row per group from `analysis.groups`; `FindingCallout` renders `narrative.finding`.
4. **Step B.** `Waterfall` (SVG) renders `analysis.decomposition` using the display plan; `narrative.explanation` is the plain-English paragraph.
5. **Step C.** `BriefingCard` renders `narrative.briefing`; **Copy briefing** calls `navigator.clipboard.writeText` with exactly that string.
6. **Upload.** `DataPanel` reads the file, runs the validator. Valid: `source = upload`, `revealed = false`, everything above recomputes from the new data. Invalid: an error list is shown and `source` and `revealed` are untouched.

## Stack

| Choice | Purpose | Docs |
|---|---|---|
| TypeScript (strict) | All code; types make the Analysis contract explicit | https://www.typescriptlang.org/docs/ |
| React 19 | UI components and the two state values | https://react.dev |
| Vite | Dev server and static build | https://vite.dev |
| PapaParse | CSV tokenizing only (quotes, delimiters, line endings) | https://www.papaparse.com |
| Fontsource (`@fontsource-variable/newsreader`, `@fontsource-variable/inter`) | Self-hosted fonts, SIL OFL, no third-party requests | https://fontsource.org |
| Vitest + Testing Library + jsdom | Unit and component/integration tests | https://vitest.dev |
| Playwright + `@axe-core/playwright` | End-to-end, screenshots, accessibility scan | https://playwright.dev |
| Plain CSS with custom properties | Styling and design tokens; no CSS framework | https://developer.mozilla.org/docs/Web/CSS/--* |

Learner choices (agreed): React + TypeScript + Vite; pure TypeScript math engine independent of React; plain CSS with tokens; self-hosted Newsreader and Inter; hand-built SVG waterfall; PapaParse; strict fixed-format validation; Vitest; Playwright; browser-only, no paid APIs; free static deployment, preferably GitHub Pages.

Versions seen on npm on 2026-10-21: vite 8.3.4, react 19.3.1, typescript 7.0.2, vitest 5.0.5, @playwright/test 1.64.1, papaparse 5.7.0, @vitejs/plugin-react 6.1.2, @axe-core/playwright 4.14.0, Fontsource Newsreader/Inter 5.3.0. **Not yet verified:** that this exact set installs and runs together (notably TypeScript 7 with Vite 8 / Vitest 5 / the React plugin). First build step: install, pin exact versions in `package.json`, run a trivial typecheck/test/build, and fall back to the nearest known-compatible version if anything conflicts. Dependencies are pinned exactly and the lockfile is committed.

Dependencies deliberately not added: router, state library, chart library, CSS framework, component library, date library, lodash, analytics, ESLint/Prettier configuration (typecheck is the gate).

## Where It Runs and How Someone Tries It

- **Runtime:** a modern browser. Build and test tooling needs Node 22 or newer (the dev machine has Node 26.3, npm 11.16).
- **Run locally:** `npm install`, then `npm run dev`, then open the printed local URL (Vite default `http://localhost:5173`). The fictional example loads immediately.
- **Other commands:** `npm test` (Vitest), `npm run typecheck`, `npm run build`, `npm run preview` (serves the production build), `npm run test:e2e` (Playwright against the preview build).
- **Demo recording:** run `npm run dev` or `npm run preview`, record the browser: headline → reveal → copy briefing → upload the second sample CSV. Detailed shot list is for `6-ship`.
- **Submission requirements:** a short demo video and a public GitHub repository are required and are separate from deployment.
- **Deployment (optional, agreed preference):** GitHub Pages via a GitHub Actions workflow that builds with Vite and publishes `dist/`. `vite.config.ts` uses `base: './'` so the site works at any repository path. Free; needs the repo to be public and Pages enabled. Exact Actions versions to be checked at `6-ship`.

## Look and Feel

Carried from `prd.md > Look and Feel`; no new design decisions.

- **Direction:** premium editorial data journalism (FT visual journalism, The Pudding as principles; original identity). Spacious, calm, high hierarchy; one idea per screen-height.
- **Type:** Newsreader (variable, serif) for the masthead, headline and central finding; Inter (variable, sans) for body, labels, controls and all numbers. Numbers use `font-variant-numeric: tabular-nums` so columns align. Fallbacks: Georgia/serif and system-ui/sans so a failed font load does not break layout; `font-display: swap`.
- **Color tokens** (initial values, to be verified by an automated contrast test and adjusted if any pair misses WCAG AA 4.5:1 for text, 3:1 for graphics):
  - `--paper` warm ivory `#FAF6EE`; `--ink` deep navy-charcoal `#1B2430`; `--muted` neutral gray `#5B6470`
  - `--improve` muted teal `#1F6F6B`; `--decline` restrained terracotta `#B4472B`; `--composition` muted indigo `#3F4A9A`
- **Meaning, never color alone:** every change shows a sign (`+`/`−`, a true minus), a word (up / down / unchanged), and a directional glyph; waterfall bars carry text labels.
- **Motion:** only a short fade/slide of the investigation sections using `opacity` and `transform`; none under `prefers-reduced-motion: reduce`. The waterfall is static.
- **Avoid:** glows, glassmorphism, gradients as decoration, blinking, dashboard chrome.
- **Copy tone:** plain, calm, precise; no jargon in primary text (no "Kitagawa" or "Simpson's paradox" on the main path; "composition" is introduced with its plain meaning).
- **Responsive:** single column at every width, content order unchanged; max reading width about 70ch for prose; minimum 44px touch targets; no horizontal scroll at 320px.

## Components

### Math engine — `src/engine/`
Pure functions; no React, DOM or I/O. PRD ref: `prd.md > Honest analysis for every valid dataset`, `prd.md > The reveal and the decomposition`.

#### Types — `types.ts`
- `GroupCounts { successes: number; total: number }`
- `Dataset { groups: { name: string; previous: GroupCounts; current: GroupCounts }[] }`
- `Analysis` (see Data Model).

#### Decomposition and aggregation — `analyze.ts`
- Aggregates group counts into overall counts and rates; computes per-group and overall rates and changes.
- Computes the symmetric Kitagawa decomposition in full-precision floating point: `rateEffect = Σ ½(w₀ᵢ+w₁ᵢ)(r₁ᵢ−r₀ᵢ)`, `compositionEffect = Σ ½(r₀ᵢ+r₁ᵢ)(w₁ᵢ−w₀ᵢ)`, and `net = R₁ − R₀` computed independently from the aggregate counts.
- **Invariant:** `|rateEffect + compositionEffect − net| ≤ 1e-12` (on the 0–1 rate scale). If violated, `analyze` throws (a programming error, never shown as a valid result).
- Per-group share (`w`) values are kept for the narrative.

#### Classification — `classify.ts`
- **Direction is exact, not tolerance-based.** A group (or overall) is `unchanged` only if its rate is exactly equal, decided with integer cross-multiplication `s₁·t₀ === s₀·t₁`. Input limits (below) keep every product under 2⁵³, so this is exact. A very small real change is therefore never labeled unchanged because it rounds to 0.0.
- Pattern, evaluated in this order (U = groups up, D = down, Z = unchanged, o = overall direction):
  1. `groupsUnchanged` — every group in Z (overall may still move, due to mix alone, or not).
  2. `reversal` — o ≠ 0, Z empty, every group moves opposite to o.
  3. `mixed` — U and D both non-empty.
  4. `consistent` — o ≠ 0 and no group moves against o (some groups may be unchanged).
  5. `divergent` — everything else: the groups that moved all moved one way while the overall rate moved the other way or not at all, and at least one group was unchanged (or overall is unchanged). Described honestly and **not** called a complete reversal.
- Exhaustiveness is checked by test over all direction combinations.

#### Display plan and formatting — `format.ts`
Implements the agreed rounding strategy. Underlying values are never modified.
- Work in percentage points (pp = 100 × ratio difference) and percent (rates).
- **Rounding is exact, with no floating-point nudge.** Every displayed quantity (rates, changes, rate effect, composition effect, net, group changes) is also computed as an exact rational number (`BigInt` numerator/denominator) from the integer counts. Rounding to `d` decimals is half away from zero performed on that rational with integer arithmetic, so a true halfway value is decided exactly and a value just below or above halfway can never land on the wrong side. Floating-point `number` values are used only for the invariant check and chart geometry, never to decide a displayed digit. The rounding helper (`roundRational(value, d)`) is tested directly: positive, negative, exactly halfway (e.g. ±0.05 at 1 decimal), near-halfway (e.g. 0.0499999 and 0.0500001), the classic binary-float trap (1.005 → 1.01), zero and negative-zero, and tiny nonzero values.
- **Overall display precision `d`** = smallest `d ∈ {1, 2, 3}` for which, in integers at that precision: `round(rate) + round(composition) = round(net)` **and** `round(R₁) − round(R₀) = round(net)`. Flagship result: `d = 1`.
- **If no `d ≤ 3` reconciles:** use `d = 3`, mark `approximate = true`, show the equation with `≈` and a note ("Figures are rounded and may not sum exactly"); the briefing carries the same note. Underlying values are unchanged.
- **Each group row** chooses its own `d ∈ {1, 2, 3}` the same way (`round(r₁) − round(r₀) = round(Δ)`).
- **Tiny nonzero changes:** a nonzero value that rounds to zero at `d` is shown at the next precision; if still zero at 3 decimals it is shown as `<0.001 pp` with its direction word. It is never classified `unchanged` for display reasons.
- **No negative zero:** formatting normalizes `-0` to `0`; an exactly-zero change is shown as `0.0 pp` with the word "unchanged" and no sign.
- Signed output uses a true minus (`−`) and an explicit `+`.
- Rates display as fixed decimals (`80.0%`) so columns align; the headline sentence may drop a trailing `.0` (`4 points`) but is the same value as the equation's `+4.0 pp`.
- All strings shown or copied come from these formatters, never from ad hoc `toFixed` calls elsewhere.

#### Narrative — `narrative.ts`
Pure functions from `(Analysis, Terms)` to strings. `Terms` = `{ metric, group, groups, unit, eyebrow }`: the example uses "pass rate", "site", "sites", "students"; uploads use "success rate", "group", "groups", "total count". No tutoring wording exists outside the example's `Terms`. PRD ref: `prd.md > The headline block`, `prd.md > The executive briefing`.
- `headline` — e.g. "Pass rates are up 4 points." / "Success rates are down 1.2 points." / "Success rates are unchanged." Reassuring in tone for the example without claiming sites improved.
- `finding` — keyed by pattern: reversal → "Every site declined. So why did the overall rate rise?" (direction words computed); consistent → states directions agree, no paradox; mixed → "Some sites rose and others fell"; divergent and groupsUnchanged → their own honest sentences. Never shows the reversal framing unless `pattern === reversal`.
- `explanation` — plain-English composition paragraph built from findings: the group with the largest share gain and the one with the largest share loss, their share change, and whether the composition effect pushed the overall rate up, down, or not at all; always states that the rate effect and composition effect together equal the overall change.
- `briefing` — deterministic paragraph: overall change; which groups rose, fell or were unchanged with their rates; rate and composition components with the equation; one limitations sentence ("descriptive analysis of two periods; does not establish causes or statistical significance"); the rounding note when `approximate`. Flagship expected text (to be asserted verbatim in tests):

  > Tutoring network performance review: the overall pass rate rose from 62.5% to 66.5% (+4.0 percentage points). Within-site pass rates changed by −2.0 points and composition (the mix of students across sites) by +6.0 points, which together account for the overall change (−2.0 + 6.0 = +4.0). Every site's pass rate declined: North (80.0% → 78.0%), East (70.0% → 68.0%), South (60.0% → 58.0%), West (40.0% → 38.0%). The overall increase reflects a shift in enrollment toward higher-performing sites (North's share of students grew from 25.0% to 40.0%; West's fell from 25.0% to 10.0%), not improvement within sites. This is a descriptive analysis of two periods; it does not establish causes or statistical significance.

  The final wording is fixed in the build by tests; the numbers must always match the on-screen values.
- No causal language anywhere ("because", "due to", "caused by" are not used about the data).

### CSV input — `src/csv/`
PRD ref: `prd.md > CSV upload`.

#### Parser wrapper — `parse-csv.ts`
`File` → text (BOM stripped; rejects files over 1 MB) → PapaParse (`header: true`, `skipEmptyLines: 'greedy'`, values kept as strings). Parser-level problems (bad quoting, unterminated field) become validation errors.

#### Validator — `validate.ts`
Returns `{ ok: true, dataset } | { ok: false, errors }`, with up to the first 10 errors, each carrying a plain message and a row number where applicable (row 1 is the header). Rules:
- Header is exactly `period,group,successes,total` (names trimmed, compared case-insensitively; no missing or extra columns).
- `period` is exactly `previous` or `current` after whitespace trim (anything else: error naming the row and the value found, and the two allowed values).
- `group` non-empty; names compared exactly after trimming; two names differing only by letter case are an error (likely typo).
- `successes` and `total` match `^\d+$` (whole numbers; no decimals, negatives, thousands separators, scientific notation, or blanks).
- `total` ≥ 1 and ≤ 1,000,000; `successes` ≤ `total`.
- Each (`period`, `group`) pair appears exactly once.
- Both periods present; every group present in both periods; at least 2 and at most 50 groups.
- Limits keep all integer arithmetic exact (max cross-product ≈ 2.5 × 10¹⁵ < 2⁵³).

### UI — `src/`
PRD ref: `prd.md > Screens and Layout`.

#### App — `App.tsx` and `useInvestigation.ts`
State: `source: { kind: 'example' } | { kind: 'upload'; fileName: string; dataset: Dataset }` and `revealed: boolean`. Derived with `useMemo`: `analysis`, `terms`, `narrative`. Uploading a valid file sets `source` and `revealed=false`; **Return to the example** resets both. PRD ref: `prd.md > States and Boundaries`.

#### Masthead — `components/Masthead.tsx`
Wordmark and tagline "Before you report that number." PRD ref: `prd.md > Screens and Layout`.

#### Headline block — `components/HeadlineBlock.tsx`
Eyebrow label, `h1` headline, `62.5% → 66.5%`, the fictional-example label (or the uploaded file name), the primary button (`aria-expanded`, `aria-controls`; label "Look beneath the headline", changes to "Hide the investigation" when open). Shows what is measured, which periods are compared, and "Fictional example data" with the example. Shows no group-level result. PRD ref: `prd.md > The headline block`.

#### Investigation — `components/Investigation.tsx`
Container with an `h2` that receives focus on reveal (`tabIndex={-1}`). Contains the four children below in order. PRD ref: `prd.md > The reveal and the decomposition`.

#### Site comparison — `components/SiteComparison.tsx`
Semantic list or table (header cells with `scope`), one row per group: name, previous → current rate, signed change, direction word and glyph, small share-of-total change. Teal/terracotta/neutral is supplemental to sign and words.

#### Finding callout — `components/FindingCallout.tsx`
The large serif central finding (`narrative.finding`).

#### Waterfall — `components/Waterfall.tsx`
Hand-built SVG: bars for within-group rate effect (terracotta when negative), composition effect (indigo), and net (ink), on a shared signed axis, each labeled with its signed value; the equation in text below. `role="img"` with `<title>`/`<desc>` summarizing the numbers, plus the equation and values as real text so nothing depends on the image. Scales to container width (`viewBox`); labels stay legible at 320px. Uses `analysis.display` strings only.

#### Briefing card — `components/BriefingCard.tsx`
Shows `narrative.briefing` in a selectable block and a **Copy briefing** button. On success a visible status message ("Copied") in an `aria-live="polite"` region; on failure or no clipboard API, the text is auto-selected and a message explains how to copy manually. PRD ref: `prd.md > The executive briefing`.

#### Data panel — `components/DataPanel.tsx`
Secondary section near the main experience: "Analyze your own CSV"; format explanation (columns and rules in plain language); **Download template** and **Download second sample** (static files in `public/`); file input (native, labeled); error list rendered in a `role="alert"` region naming rows and values; **Return to the example** when an upload is active. Keyboard operable, visible focus. PRD ref: `prd.md > CSV upload`.

#### Limitations note — in `App.tsx` footer
Short statement that the analysis is descriptive. PRD ref: `prd.md > Screens and Layout`.

### Styles — `src/styles/`
`tokens.css` (colors, type scale, spacing, motion durations, `@media (prefers-reduced-motion: reduce)` zeroing transitions), `base.css` (reset, typography, focus ring ≥3:1), component CSS files beside components. Mobile-first, one breakpoint set. Visible `:focus-visible` outlines everywhere.

### Sample data — `src/data/`, `public/`
- `src/data/tutoring-example.ts` — the flagship counts exactly as given in the PRD and scope (previous: North 200/250, East 175/250, South 150/250, West 100/250; current: North 312/400, East 170/250, South 145/250, West 38/100), labeled fictional.
- `public/metric-mirage-template.csv` — format example (the flagship data in the fixed format).
- `public/sample-consistent.csv` — a second valid dataset that is **not** a reversal (e.g., most groups improving), so a demo upload shows the honest "no paradox" path.

## Data Model

```ts
type Direction = 'up' | 'down' | 'unchanged'
type Pattern = 'reversal' | 'consistent' | 'mixed' | 'divergent' | 'groupsUnchanged'

interface GroupResult {
  name: string
  previous: { successes: number; total: number; rate: number; share: number }
  current:  { successes: number; total: number; rate: number; share: number }
  change: number            // full precision, percentage points
  direction: Direction      // exact
  display: { d: number; previousRate: string; currentRate: string; change: string }
}

interface Analysis {
  overall: { previousRate: number; currentRate: number; change: number; direction: Direction }
  groups: GroupResult[]
  decomposition: { rateEffect: number; compositionEffect: number; net: number }  // pp, full precision
  pattern: Pattern
  display: { d: number; approximate: boolean; previousRate: string; currentRate: string;
             net: string; rateEffect: string; compositionEffect: string; equation: string }
}
```

- **Where data lives:** in memory only. The example dataset is a constant; an uploaded dataset lives in `App` state; `Analysis` and narrative are derived and never stored.
- **Updated when:** the user uploads a valid file or returns to the example.
- **After leaving and returning:** everything resets to the fictional example on reload. Nothing is persisted (PRD: `States and Boundaries > Persistence`).

## File Structure

```
metric-mirage/                    # repository root (this project folder)
├── devpost/                      # Devpost learning workspace (scope, PRD, spec, checklist)
├── src/
│   ├── engine/
│   │   ├── types.ts              # Dataset, Analysis, Pattern
│   │   ├── analyze.ts            # aggregation + symmetric Kitagawa decomposition + invariant
│   │   ├── classify.ts           # exact direction and pattern
│   │   ├── format.ts             # display precision, signed/negative-zero-safe formatting
│   │   ├── narrative.ts          # headline, finding, explanation, briefing templates
│   │   ├── terms.ts              # example vs. upload wording
│   │   └── *.test.ts             # unit + property tests beside each module
│   ├── csv/
│   │   ├── parse-csv.ts          # File → rows (PapaParse)
│   │   ├── validate.ts           # rows → Dataset | errors
│   │   └── *.test.ts
│   ├── data/
│   │   └── tutoring-example.ts   # flagship fictional dataset
│   ├── components/               # Masthead, HeadlineBlock, Investigation, SiteComparison,
│   │                             # FindingCallout, Waterfall, BriefingCard, DataPanel (+ CSS, tests)
│   ├── styles/                   # tokens.css, base.css
│   ├── App.tsx
│   ├── useInvestigation.ts       # source + revealed state, memoized analysis
│   └── main.tsx
├── public/
│   ├── metric-mirage-template.csv
│   └── sample-consistent.csv
├── e2e/                          # Playwright specs: journey, upload, invalid CSV, keyboard,
│                                 # reduced motion, mobile viewport, axe scan
├── .github/workflows/deploy.yml  # GitHub Pages deploy (added at ship)
├── index.html
├── package.json                  # exact versions; scripts listed above
├── tsconfig.json
├── vite.config.ts                # base: './'
├── playwright.config.ts          # webServer runs `vite preview`
├── skills-lock.json, .claude/, .agents/   # official skill pack (kept for provenance)
├── LICENSE
└── README.md
```

## External Services and Dependencies

None at runtime: no API, key, cost or rate limit. Fonts are bundled from npm packages. Documentation links are in the Stack table. Background reference: Kitagawa, E. M. (1955), "Components of a Difference Between Two Rates," *Journal of the American Statistical Association* 50(272), 1168–1194. Cited as the method's origin; the symmetric (average-weight) form used here is a standard variant, and its exactness is verified by tests, not by citation.

## Important Failure Modes

- **Rounded equation would not balance** → precision raises to 2–3 decimals; if still unreconcilable, `≈` with a rounding note. Underlying values unchanged.
- **Invalid or unreadable CSV** → specific error list naming rows and values; previous view preserved; template link and "Return to the example" available.
- **Clipboard unavailable or denied** → briefing text is selectable and auto-selected; message explains manual copy.
- **Font fails to load** → serif/sans system fallbacks; layout still works.
- **Invariant violated in `analyze` (a bug)** → throws in development and tests; tests cover this so it cannot ship silently.
- **JavaScript disabled** → a `<noscript>` message states the tool needs JavaScript.

## Verification Plan

Evidence the build must produce (detailed ordering is in `5-build`):
- **Flagship:** previous 62.5%, current 66.5%, net +4.0 pp, rate −2.0, composition +6.0, equation, all four group changes −2.0 pp, display precision `d = 1`, no `approximate`; briefing text matches the expected paragraph.
- **Independent oracle:** an exact-rational (BigInt fraction) implementation inside the tests recomputes the decomposition; engine output must match within 1e-12 on seeded random datasets (own small seeded PRNG, no extra dependency).
- **Edge cases:** equal composition; equal group rates; every group declining; no reversal; each pattern including `divergent` and `groupsUnchanged`; unchanged-vs-tiny-change (exact classification); zero overall change; very small changes that round to 0.0; rounding boundaries (x.x5 cases); negative zero never printed; precision escalation; the `approximate` path; narrative uses upload terms, never tutoring words; displayed values equal copied values.
- **CSV:** each validation rule has a passing and failing fixture, including wrong period labels, missing group in one period, successes > total, zero total, negative/decimal counts, duplicate rows, case-collision group names, BOM, quoted fields, extra columns, empty file, oversized file.
- **Browser (Playwright, with screenshots inspected):** desktop and mobile viewports; initial load; reveal; upload valid and invalid; briefing copy; keyboard-only run; reduced-motion; axe scan with no serious/critical violations; contrast test for the color tokens.

## What Was Simplified and Why

- **One page, no router** instead of multiple views — the story is a single scroll; routes would add nothing.
- **Two pieces of state in `useState`** instead of a state library — nothing is shared across distant components.
- **Hand-built SVG** instead of a chart library — exact control over labeling and accessibility; a library costs bundle size and a custom look.
- **Templated narrative** instead of generated text — the briefing must equal the math, deterministically.
- **Fixed-format CSV** instead of flexible import — agreed in scope; flexible parsing is a large edge-case surface.
- **No persistence or accounts** — nothing needs to be saved; uploads never leave the browser.
- **No ESLint/Prettier setup** — strict TypeScript plus tests are the quality gate; formatting is consistent by convention.
- **Deferred** (from `scope.md > Later`): historical kidney-stone case and composition slider.

## Decisions and Open Issues

Decisions made here, by whom, and the tradeoff accepted:

- **React + TypeScript + Vite** — learner's choice; trades a bit of framework weight for a component model and good test tooling.
- **Pure engine independent of React** — learner approved; extra structure is cheap and makes the math testable alone.
- **Rounding strategy — learner's modification of the agent's proposal.** The agent proposed nudging a displayed component by 0.1 pp so rounded figures sum; the learner rejected altering a correct component. Chosen instead: keep full precision; escalate display precision to 2–3 decimals; if still unreconciled, show `≈` with a rounding note. Tradeoff: some uploaded datasets will show more decimals than one; accepted for mathematical accuracy.
- **Exact (integer) direction classification, with input caps (1,000,000 per count, 50 groups)** — agent-derived implementation detail following from the learner's requirement that tiny changes are never "unchanged"; trades a hard upper limit on input size for exactness.
- **`divergent` pattern** — agent-derived implementation detail needed so the learner's reversal definition stays strict while every other case is still described honestly.
- **Rates shown as fixed decimals (`80.0%`)** for column alignment, where the PRD example wrote `80% → 78%` — agent-derived presentation detail; flagged for the learner to confirm at review.
- **Headline sentence may drop a trailing `.0` ("4 points")** — same value as the equation; agent-derived.
- **Button label toggles to "Hide the investigation" when open** — agent-derived accessibility detail; not a new feature.
- **Rounding helper refinement (learner).** Replaced the proposed `+1e-9` nudge with exact rational rounding (see `format.ts`), because a nudge can push a near-halfway value across the boundary. Tradeoff: a small `BigInt` rational helper (a few dozen lines) in exchange for provably correct digits.
- **Repository hygiene before the first commit (learner).** `research/`, `.remember/`, `devpost/learner-profile.md`, secrets/env files, local tool state and generated output are ignored from the start, and the first commit is checked (`git status`, `git check-ignore`, a secrets scan) before it is made, because committed content stays in Git history. `scope.md`, `prd.md`, `spec.md` and `checklist.md` are committed (required by the hackathon). Supersedes the earlier "decide at `6-ship`" note about `research/` and `.remember/`.
- **Free static deployment, preferably GitHub Pages** — learner's preference; final hosting decision at `6-ship`.

**Learner's learning questions (from `learner-profile.md > Desired Learning Outcome` and this interview):** how Kitagawa decomposition separates within-group from composition change and why it sums; how React state drives the reveal without navigation; how uploaded data flows through validation, analysis, visualization and the briefing. Clarified in this spec's "Three concepts, short version" and the "Core Journey"; to be reinforced during the build by walking through `engine/analyze.ts` with its tests, `useInvestigation.ts`, and the CSV validator. Evidence to look for: the oracle test in `engine/analyze.test.ts` confirming `rate + composition = net`.

**Still open (none blocks approval):**
- Exact dependency versions compatible together (TypeScript 7 / Vite 8 / Vitest 5): verify at the first build step.
- Final copy for narrative templates beyond the flagship: written during the build, reviewed in browser QA, asserted by tests.
