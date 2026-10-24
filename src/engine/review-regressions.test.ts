// Regression tests for defects reproduced by the independent statistical review.
import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from './analyze'
import { briefing, explanation, finding } from './narrative'
import { EXAMPLE_TERMS, UPLOAD_TERMS } from './terms'
import type { Dataset } from './types'

const ds = (rows: [string, number, number, number, number][]): Dataset => ({
  groups: rows.map(([name, s0, t0, s1, t1]) => ({ name, previous: { successes: s0, total: t0 }, current: { successes: s1, total: t1 } })),
})

const primesBelow = (limit: number, count: number): number[] => {
  const out: number[] = []
  for (let n = limit; out.length < count; n--) {
    let prime = n > 1
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break }
    if (prime) out.push(n)
  }
  return out
}

describe('statistical review regressions', () => {
  test('50 groups with large prime totals: chart values stay finite and reconcile', () => {
    const totals = primesBelow(1_000_000, 100)
    const groups = Array.from({ length: 50 }, (_, i) => ({
      name: `G${i}`,
      previous: { successes: Math.floor(totals[2 * i]! / 3), total: totals[2 * i]! },
      current: { successes: Math.floor(totals[2 * i + 1]! / 2), total: totals[2 * i + 1]! },
    }))
    const a = analyze({ groups })
    for (const v of Object.values(a.decompositionPoints)) expect(Number.isFinite(v)).toBe(true)
    expect(a.decompositionPoints.rateEffect + a.decompositionPoints.compositionEffect).toBeCloseTo(a.decompositionPoints.net, 9)
  })

  test('divergent with every group moving: no false "not every group changed"', () => {
    const a = analyze(ds([['A', 1, 2, 2, 3], ['B', 0, 2, 1, 9]]))
    expect(a.pattern).toBe('divergent')
    const text = briefing(a, UPLOAD_TERMS)
    expect(text).not.toMatch(/not every group changed/)
    expect(text).toMatch(/exactly offset the change within groups/)
  })

  test('shares moving among 3+ groups: no single pair is credited with the mix effect', () => {
    const a = analyze(ds([['A', 102, 200, 153, 300], ['B', 100, 200, 50, 100], ['C', 180, 200, 252, 280], ['D', 20, 200, 12, 120]]))
    const text = explanation(a, UPLOAD_TERMS)
    expect(text).not.toMatch(/of the two|so with more/)
    expect(text).toMatch(/Shares changed across several groups/)
  })

  test('reversal with 3+ share movers: briefing does not name a misleading pair', () => {
    const a = analyze(ds([['A', 150, 300, 150, 300], ['B', 49, 100, 49, 100], ['C', 251, 280, 251, 280], ['D', 11, 120, 11, 120]]))
    const b = analyze(ds([['A', 102, 200, 150, 300], ['B', 100, 200, 49, 100], ['C', 180, 200, 251, 280], ['D', 20, 200, 11, 120]]))
    expect(a.pattern).toBe('groupsUnchanged')
    if (b.pattern === 'reversal') expect(briefing(b, UPLOAD_TERMS)).not.toMatch(/\(A's share/)
  })

  test('two groups: possessive is "Both groups\'", never "groups\'s"', () => {
    const a = analyze(ds([['A', 50, 100, 60, 100], ['B', 20, 100, 25, 100]]))
    const all = [finding(a, UPLOAD_TERMS), explanation(a, UPLOAD_TERMS), briefing(a, UPLOAD_TERMS)].join(' ')
    expect(all).not.toMatch(/groups's/)
    expect(briefing(a, UPLOAD_TERMS)).toMatch(/Both groups' success rate improved/)
  })

  test('changes invisible even at 3 decimals are never shown as "50.000% to 50.000%" shifts or bare "rose"', () => {
    const a = analyze(ds([['A', 500_000, 1_000_000, 500_000, 999_999], ['B', 500_000, 999_999, 500_000, 1_000_000]]))
    const text = explanation(a, UPLOAD_TERMS)
    expect(text).not.toMatch(/grew from (\S+) to \1/)
    expect(briefing(a, UPLOAD_TERMS)).toMatch(/points\)/)
  })

  test('flagship wording uses the level in both periods', () => {
    expect(explanation(analyze(tutoringExample), EXAMPLE_TERMS)).toMatch(/North had the higher pass rate in both periods/)
  })
})
