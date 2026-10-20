import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from './analyze'
import { MINUS } from './format'
import { explanation, finding, headline } from './narrative'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from './terms'
import type { Dataset, Pattern } from './types'

const ds = (rows: [number, number, number, number][]): Dataset => ({
  groups: rows.map(([s0, t0, s1, t1], i) => ({
    name: `Group ${String.fromCharCode(65 + i)}`,
    previous: { successes: s0, total: t0 },
    current: { successes: s1, total: t1 },
  })),
})

// One representative dataset per pattern (verified by the pattern assertion below).
const CASES: Record<Pattern, Dataset> = {
  reversal: ds([[80, 100, 156, 200], [40, 100, 19, 50]]),
  consistent: ds([[50, 100, 60, 100], [20, 100, 25, 100], [30, 100, 30, 100]]),
  mixed: ds([[50, 100, 60, 100], [50, 100, 40, 100], [30, 100, 35, 100]]),
  divergent: ds([[80, 100, 158, 200], [40, 100, 40, 100], [40, 100, 19, 50]]),
  groupsUnchanged: ds([[80, 100, 160, 200], [30, 100, 15, 50]]),
}

const TUTORING_WORDS = /tutoring|\bsites?\b|students|pass rate|enrol/i

describe('headline', () => {
  test('flagship', () => {
    expect(headline(analyze(tutoringExample), EXAMPLE_TERMS)).toBe('Pass rates are up 4 points.')
  })
  test('down, singular and unchanged', () => {
    expect(headline(analyze(ds([[60, 100, 59, 100], [10, 100, 10, 100]])), UPLOAD_TERMS)).toBe(
      'Success rates are down 0.5 points.',
    )
    expect(headline(analyze(ds([[50, 100, 51, 100], [50, 100, 51, 100]])), UPLOAD_TERMS)).toBe(
      'Success rates are up 1 point.',
    )
    expect(headline(analyze(ds([[50, 100, 50, 100], [50, 100, 50, 100]])), UPLOAD_TERMS)).toBe(
      'Success rates are unchanged.',
    )
  })
})

describe('finding', () => {
  test('flagship reversal line, exactly as in the PRD', () => {
    expect(finding(analyze(tutoringExample), EXAMPLE_TERMS)).toBe(
      'Every site declined. So why did the overall pass rate rise?',
    )
  })

  test.each(Object.entries(CASES))('%s: honest wording with upload terms', (pattern, data) => {
    const a = analyze(data)
    expect(a.pattern).toBe(pattern)
    const text = finding(a, UPLOAD_TERMS)
    expect(text).not.toMatch(TUTORING_WORDS)
    if (pattern === 'reversal') expect(text).toMatch(/So why did/)
    else expect(text).not.toMatch(/So why did/)
    if (pattern === 'mixed' || pattern === 'divergent') expect(text).toMatch(/not a complete reversal/)
  })

  test('consistent result describes agreement, not a warning', () => {
    expect(finding(analyze(CASES.consistent), UPLOAD_TERMS)).toBe(
      'Two groups improved and one held steady; the overall success rate rose with them. The headline and the groups point the same way.',
    )
  })

  test('mixed result is distinguished from a reversal', () => {
    expect(finding(analyze(CASES.mixed), UPLOAD_TERMS)).toBe(
      'Two groups improved and one declined. The overall success rate rose: a mixed picture, not a complete reversal.',
    )
  })
})

describe('explanation', () => {
  test('flagship explains the mix shift in plain English with on-screen numbers', () => {
    expect(explanation(analyze(tutoringExample), EXAMPLE_TERMS)).toBe(
      `Changes within sites moved the overall pass rate by ${MINUS}2.0 points; the shift in the mix of sites moved it by +6.0 points (${MINUS}2.0 + 6.0 = +4.0). ` +
        "North's share of students grew from 25.0% to 40.0%, while West's fell from 25.0% to 10.0%. " +
        "North has the higher pass rate (80.0% → 78.0%, versus 40.0% → 38.0% at West), so the shift toward it raised the overall pass rate, even though every site's own pass rate fell.",
    )
  })

  test.each(Object.entries(CASES))('%s: no tutoring words and no causal claims with upload terms', (_, data) => {
    const text = explanation(analyze(data), UPLOAD_TERMS)
    expect(text).not.toMatch(TUTORING_WORDS)
    expect(text).not.toMatch(/\bbecause\b|\bcaused\b|\bdue to\b|significan/i)
  })

  test('unchanged mix says so instead of inventing a shift', () => {
    expect(explanation(analyze(CASES.consistent), UPLOAD_TERMS)).toMatch(/mix of groups did not change/)
  })
})
