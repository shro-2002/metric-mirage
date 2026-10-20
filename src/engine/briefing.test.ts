import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from './analyze'
import { MINUS } from './format'
import { briefing } from './narrative'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from './terms'
import type { Analysis, Dataset } from './types'

const ds = (rows: [number, number, number, number][]): Dataset => ({
  groups: rows.map(([s0, t0, s1, t1], i) => ({
    name: `Group ${String.fromCharCode(65 + i)}`,
    previous: { successes: s0, total: t0 },
    current: { successes: s1, total: t1 },
  })),
})

const FIXTURES: Dataset[] = [
  ds([[80, 100, 156, 200], [40, 100, 19, 50]]), // reversal
  ds([[50, 100, 60, 100], [20, 100, 25, 100], [30, 100, 30, 100]]), // consistent
  ds([[50, 100, 60, 100], [50, 100, 40, 100], [30, 100, 35, 100]]), // mixed
  ds([[80, 100, 158, 200], [40, 100, 40, 100], [40, 100, 19, 50]]), // divergent
  ds([[80, 100, 160, 200], [30, 100, 15, 50]]), // groups unchanged, mix moves
  ds([[50, 100, 50, 100], [20, 100, 20, 100]]), // nothing changes
  ds([[1, 3, 2, 3], [1, 7, 3, 7], [5, 11, 4, 9]]), // needs extra precision
]

/** Every number-like token printed in a briefing must be one of the on-screen strings. */
const displayedNumbers = (a: Analysis): Set<string> => {
  const strip = (s: string) => s.replace(/^[+−]/, '').replace('%', '')
  const values = [
    a.display.previousRate,
    a.display.currentRate,
    a.display.net,
    a.display.rateEffect,
    a.display.compositionEffect,
    ...a.groups.flatMap((g) => [g.display.previousRate, g.display.currentRate, g.display.previousShare, g.display.currentShare]),
  ]
  return new Set(values.map(strip))
}

describe('briefing', () => {
  test('flagship text, verbatim', () => {
    expect(briefing(analyze(tutoringExample), EXAMPLE_TERMS)).toBe(
      'Tutoring network performance review: the overall pass rate rose from 62.5% to 66.5% (+4.0 percentage points). ' +
        `Within-site pass rates changed by ${MINUS}2.0 points and the mix of students across sites by +6.0 points, which together account for the overall change (${MINUS}2.0 + 6.0 = +4.0). ` +
        "Every site's pass rate declined: North (80.0% → 78.0%), East (70.0% → 68.0%), South (60.0% → 58.0%) and West (40.0% → 38.0%). " +
        "The overall increase reflects a shift in the mix toward higher-performing sites (North's share of students grew from 25.0% to 40.0%; West's fell from 25.0% to 10.0%), not improvement within sites. " +
        'This is a descriptive analysis of two periods; it does not establish causes or statistical significance.',
    )
  })

  test('is deterministic', () => {
    const a = analyze(tutoringExample)
    expect(briefing(a, EXAMPLE_TERMS)).toBe(briefing(analyze(tutoringExample), EXAMPLE_TERMS))
    expect(briefing(a, EXAMPLE_TERMS)).toBe(briefing(a, EXAMPLE_TERMS))
  })

  test.each(FIXTURES.map((d, i) => [i, d] as const))('fixture %i: every figure matches the screen; honest, generic wording', (_, data) => {
    const a = analyze(data)
    const text = briefing(a, UPLOAD_TERMS)
    const allowed = displayedNumbers(a)
    const equationNumbers: string[] = a.display.equation.match(/\d+\.\d+/g) ?? []
    const figures: string[] = text.match(/\d+\.\d+/g) ?? []
    for (const f of figures) expect(allowed.has(f) || equationNumbers.includes(f)).toBe(true)
    expect(text).toContain(a.display.equation)
    expect(text).toMatch(/does not establish causes or statistical significance\.$|may not sum exactly\.$/)
    expect(text).not.toMatch(/tutoring|\bsites?\b|students|pass rate|because|caused|due to/i)
  })

  test('approximate results carry the rounding note', () => {
    const a = analyze(FIXTURES[6]!)
    if (a.display.approximate) expect(briefing(a, UPLOAD_TERMS)).toMatch(/may not sum exactly\.$/)
    else expect(briefing(a, UPLOAD_TERMS)).not.toMatch(/may not sum exactly/)
  })

  test('unchanged overall is stated plainly', () => {
    expect(briefing(analyze(FIXTURES[5]!), UPLOAD_TERMS)).toMatch(/^Performance review: the overall success rate was unchanged at /)
  })
})
