import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from './analyze'
import { MINUS } from './format'
import { briefing, decisionNote, explanation, finding, twoForces } from './narrative'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from './terms'
import type { Dataset } from './types'

const ds = (rows: [number, number, number, number][]): Dataset => ({
  groups: rows.map(([s0, t0, s1, t1], i) => ({ name: `G${i}`, previous: { successes: s0, total: t0 }, current: { successes: s1, total: t1 } })),
})
const CASES: Dataset[] = [
  ds([[80, 100, 156, 200], [40, 100, 19, 50]]),
  ds([[50, 100, 60, 100], [20, 100, 25, 100], [30, 100, 30, 100]]),
  ds([[50, 100, 60, 100], [50, 100, 40, 100], [30, 100, 35, 100]]),
  ds([[80, 100, 158, 200], [40, 100, 40, 100], [40, 100, 19, 50]]),
  ds([[80, 100, 160, 200], [30, 100, 15, 50]]),
  ds([[50, 100, 50, 100], [20, 100, 20, 100]]),
]

describe('twoForces', () => {
  test('flagship, verbatim', () => {
    expect(twoForces(analyze(tutoringExample), EXAMPLE_TERMS)).toBe(
      `Two things changed at once: each site got slightly worse (${MINUS}2.0 points), and North, the higher-performing site, accounted for a larger share of students, up from 25.0% to 40.0% (+6.0 points). The second outweighed the first.`,
    )
  })

  test.each(CASES.map((d, i) => [i, d] as const))('case %i uses on-screen figures and no tutoring words', (_, data) => {
    const a = analyze(data)
    const text = twoForces(a, UPLOAD_TERMS)
    expect(text).toContain(a.display.rateEffect)
    expect(text).toContain(a.display.compositionEffect)
    expect(text).not.toMatch(/tutoring|\bsites?\b|students|pass rate|because|caused/i)
  })
})

describe('decisionNote', () => {
  test('flagship states the funding stakes without inventing outcomes', () => {
    expect(decisionNote(analyze(tutoringExample), EXAMPLE_TERMS)).toBe(
      "If next year's site funding followed this headline, it would reward an improvement that no site achieved: every site's own pass rate fell. The rise came from the changing distribution of students across sites, not from how the sites performed.",
    )
  })

  test.each(CASES.map((d, i) => [i, d] as const))('case %i: reversal language only for a reversal', (_, data) => {
    const a = analyze(data)
    const text = decisionNote(a, UPLOAD_TERMS)
    expect(text).not.toMatch(/tutoring|\bsites?\b|students|pass rate|funding/i)
    if (a.pattern === 'reversal') expect(text).toMatch(/no group/)
    else expect(text).not.toMatch(/no group (achieved|had)/)
  })
})

describe('composition wording', () => {
  // The data shows counts and shares changing between periods, not individuals moving or why.
  const MOVEMENT = /moved between|ended up|transferr|relocat|stronger|weaker|where the \w+ (were|sat)|because|caused/i
  const all = [tutoringExample, ...CASES]
  test.each(all.map((d, i) => [i, d] as const))('case %i never implies movement or cause', (_, data) => {
    const a = analyze(data)
    for (const terms of [EXAMPLE_TERMS, UPLOAD_TERMS]) {
      const text = [finding, twoForces, explanation, decisionNote, briefing].map((f) => f(a, terms)).join(' ')
      expect(text).not.toMatch(MOVEMENT)
    }
  })
})
