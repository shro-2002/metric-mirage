import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from './analyze'
import { MINUS } from './format'
import { briefing, briefingSentences, decisionNote, explanation, finding, forces } from './narrative'
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

describe('forces', () => {
  test('flagship, verbatim', () => {
    expect(forces(analyze(tutoringExample), EXAMPLE_TERMS)).toEqual([
      { key: 'rate', label: 'Site performance', value: `${MINUS}2.0`, text: "Every site's pass rate fell by 2.0 points." },
      {
        key: 'composition',
        label: 'Changing distribution of students',
        value: '+6.0',
        text: "North, the highest-performing site, accounted for 40.0% of students instead of 25.0%, while West's share fell from 25.0% to 10.0%. A larger share for a higher-performing site raises the overall pass rate.",
      },
      {
        key: 'net',
        label: 'Overall result',
        value: '+4.0',
        text: 'The changing distribution outweighed the decline within sites, so the overall pass rate rose even though every site declined.',
      },
    ])
  })

  test.each(CASES.map((d, i) => [i, d] as const))('case %i uses on-screen figures and no tutoring words', (_, data) => {
    const a = analyze(data)
    const items = forces(a, UPLOAD_TERMS)
    expect(items.map((f) => f.value)).toEqual([a.display.rateEffect, a.display.compositionEffect, a.display.net])
    expect(items.map((f) => f.text).join(' ')).not.toMatch(/tutoring|\bsites?\b|students|pass rate|because|caused/i)
  })
})

describe('share changes are never confused with effects', () => {
  // A share moving 25.0% to 40.0% is 15 points of share; the composition effect (+6.0) is a different
  // quantity. Text must never put an effect right after a share, and the distribution step talks
  // only in shares, leaving its effect size to the value column.
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  test.each([tutoringExample, ...CASES].map((d, i) => [i, d] as const))('case %i', (_, data) => {
    const a = analyze(data)
    for (const terms of [EXAMPLE_TERMS, UPLOAD_TERMS]) {
      const composition = forces(a, terms).find((f) => f.key === 'composition')!
      expect(composition.text).not.toMatch(/points?\b/)
      const prose = [...forces(a, terms).map((f) => f.text), explanation(a, terms), ...briefingSentences(a, terms)].join(' ')
      for (const share of a.groups.flatMap((g) => [g.display.previousShare, g.display.currentShare])) {
        expect(prose).not.toMatch(new RegExp(`${escape(share)}\\)?,? \\(?[+\u2212]\\d`))
      }
    }
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
      const text = [finding, explanation, decisionNote, briefing].map((f) => f(a, terms)).concat(forces(a, terms).map((f) => f.text)).join(' ')
      expect(text).not.toMatch(MOVEMENT)
    }
  })
})
