# Metric Mirage

**Before you report that number.** A browser tool that shows whether a rising (or falling) overall success rate hides what happened inside each group, splits the change into *within-group performance* and *shifts in mix*, and gives you a briefing you can paste into a report.

The flagship example is a fictional tutoring network whose pass rate rose from 62.5% to 66.5% (+4.0 points) while **every one of its four sites declined by 2.0 points**. The overall rise is real; it comes from more students being at the higher-performing site. Metric Mirage makes that visible in one click:

> −2.0 (change within sites) + 6.0 (shift in the mix of sites) = +4.0 percentage points

It works the same way on your own two-period CSV, and describes ordinary results (everything improving, mixed results, declines) just as honestly as the dramatic ones.

## Try it

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173). The fictional example loads immediately:

1. Read the headline, then click **Look beneath the headline**.
2. See each site's change, the finding, and where the +4.0 points came from.
3. Click **Copy briefing**.
4. Scroll to **Analyze your own CSV**, download the second sample, and upload it.

Everything runs in your browser. Uploaded files are never sent anywhere.

## Your own data

One row per group per period, with exactly these columns:

```csv
period,group,successes,total
previous,North,200,250
current,North,312,400
```

- `period` is exactly `previous` or `current` (lowercase).
- Every group has one row in each period; 2 to 50 groups.
- `successes` and `total` are whole numbers; `successes` ≤ `total`; `total` is between 1 and 1,000,000.

Files that don't fit are rejected with a message naming the row and the problem. Nothing is guessed. Two ready-made files ship in [`public/`](public): [`metric-mirage-template.csv`](public/metric-mirage-template.csv) (the flagship example) and [`sample-consistent.csv`](public/sample-consistent.csv) (a dataset with no reversal).

## How the numbers work

The overall rate is a weighted average of group rates: R = Σ wᵢ·rᵢ, where wᵢ is a group's share of the total. For each group, the change splits exactly:

```
w₁r₁ − w₀r₀ = ½(w₀+w₁)(r₁−r₀)  +  ½(r₀+r₁)(w₁−w₀)
              change within group   shift in mix
```

Summed over groups, these are the *rate effect* and the *composition effect* (the symmetric form of Kitagawa's 1955 decomposition). They add to the observed overall change by algebra, with no leftover term.

Engineering choices that keep it trustworthy:

- **Exact arithmetic.** Every displayed digit comes from exact `BigInt` fractions, rounded half away from zero. The engine checks that rate + composition = overall change exactly, every time.
- **Honest rounding.** Figures show one decimal when the rounded numbers add up. If they don't, precision rises to two or three decimals; if they still can't, the equation uses ≈ with a note. No value is nudged to make a sum work, and "−0.0" is never shown.
- **Exact directions.** A group is "unchanged" only if its rate is exactly equal in both periods. A tiny real change is never rounded into "unchanged".
- **Deterministic wording.** All text (headline, finding, explanation, briefing) is generated from the calculated result by templates, not by AI, so the same data always produces the same words. The "every group declined, so why did the overall rate rise?" framing appears only for a true reversal.
- **Descriptive only.** The tool describes what changed between two periods. It does not establish causes or statistical significance.

## Tests

```bash
npm test            # unit and component tests (Vitest)
npm run typecheck   # strict TypeScript
npm run test:e2e    # browser tests on desktop and mobile (Playwright + axe)
```

The first `test:e2e` run may need `npx playwright install chromium`.

The math is checked against an independent exact-fraction oracle on 500 seeded random datasets, using a different derivation (the average of the two one-sided decompositions). The browser tests cover the full journey, CSV upload and errors, clipboard copy, keyboard-only use, reduced motion, an automated WCAG A/AA scan, and horizontal overflow on a phone-sized viewport.

## Project structure

```
src/engine/   exact rationals, decomposition, classification, formatting, wording
src/csv/      CSV parsing (PapaParse) and strict validation
src/components/  headline, investigation, site table, waterfall, briefing, upload panel
src/data/     the fictional flagship dataset
public/       downloadable template and second sample CSVs
e2e/          Playwright browser tests
devpost/      scope, PRD, technical spec and build checklist
```

Built with React, TypeScript, Vite, PapaParse, and self-hosted Newsreader and Inter fonts (SIL Open Font License). Planned and built with the [Devpost Learn skill pack](https://github.com/challengepost/learn-ai-basics); the planning documents are in [`devpost/`](devpost).

## License

[MIT](LICENSE)
