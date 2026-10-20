import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from './analyze'
import { MINUS } from './format'
import { rational, toNumber } from './rational'
import type { Dataset } from './types'

// ---------------------------------------------------------------------------
// Independent oracle. Written separately from the engine, with its own fraction
// type, and using a *different derivation*: the symmetric effects are the
// averages of the two one-sided (Laspeyres/Paasche-style) decompositions.
//   rate effect        = ½(Σ w₀Δr + Σ w₁Δr)
//   composition effect = ½(Σ r₀Δw + Σ r₁Δw)
// It also checks the one-sided identity Σ w₀Δr + Σ r₁Δw = ΔR.
// ---------------------------------------------------------------------------
type Frac = [bigint, bigint]
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b))
const norm = ([n, d]: Frac): Frac => {
  const s = d < 0n ? -1n : 1n
  const g = gcd(n, d) || 1n
  return [(s * n) / g, (s * d) / g]
}
const fadd = (a: Frac, b: Frac): Frac => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]])
const fsub = (a: Frac, b: Frac): Frac => fadd(a, [-b[0], b[1]])
const fmul = (a: Frac, b: Frac): Frac => norm([a[0] * b[0], a[1] * b[1]])
const fhalf = (a: Frac): Frac => norm([a[0], a[1] * 2n])
const f = (n: number, d: number): Frac => norm([BigInt(n), BigInt(d)])
const fnum = ([n, d]: Frac) => Number(n) / Number(d)

const oracle = (ds: Dataset) => {
  const T0 = ds.groups.reduce((a, g) => a + g.previous.total, 0)
  const T1 = ds.groups.reduce((a, g) => a + g.current.total, 0)
  const S0 = ds.groups.reduce((a, g) => a + g.previous.successes, 0)
  const S1 = ds.groups.reduce((a, g) => a + g.current.successes, 0)
  let w0dr: Frac = [0n, 1n]
  let w1dr: Frac = [0n, 1n]
  let r0dw: Frac = [0n, 1n]
  let r1dw: Frac = [0n, 1n]
  for (const g of ds.groups) {
    const r0 = f(g.previous.successes, g.previous.total)
    const r1 = f(g.current.successes, g.current.total)
    const w0 = f(g.previous.total, T0)
    const w1 = f(g.current.total, T1)
    w0dr = fadd(w0dr, fmul(w0, fsub(r1, r0)))
    w1dr = fadd(w1dr, fmul(w1, fsub(r1, r0)))
    r0dw = fadd(r0dw, fmul(r0, fsub(w1, w0)))
    r1dw = fadd(r1dw, fmul(r1, fsub(w1, w0)))
  }
  const net = fsub(f(S1, T1), f(S0, T0))
  return { rate: fhalf(fadd(w0dr, w1dr)), composition: fhalf(fadd(r0dw, r1dw)), net, oneSided: fadd(w0dr, r1dw) }
}

// Small deterministic PRNG (mulberry32) so random cases are reproducible.
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const randomDataset = (rand: () => number): Dataset => {
  const groupCount = 2 + Math.floor(rand() * 7)
  const counts = () => {
    const total = 1 + Math.floor(rand() * (rand() < 0.2 ? 1_000_000 : 1000))
    return { successes: Math.floor(rand() * (total + 1)), total }
  }
  return { groups: Array.from({ length: groupCount }, (_, i) => ({ name: `G${i}`, previous: counts(), current: counts() })) }
}

describe('analyze — flagship tutoring example', () => {
  const a = analyze(tutoringExample)

  test('overall rates and change', () => {
    expect(a.overall.previous).toMatchObject({ successes: 625, total: 1000 })
    expect(a.overall.current).toMatchObject({ successes: 665, total: 1000 })
    expect(a.overall.change).toEqual(rational(4, 100))
    expect(a.overall.direction).toBe('up')
  })

  test('exact decomposition: rate −2.0 pp, composition +6.0 pp, net +4.0 pp', () => {
    expect(a.decomposition.rateEffect).toEqual(rational(-2, 100))
    expect(a.decomposition.compositionEffect).toEqual(rational(6, 100))
    expect(a.decomposition.net).toEqual(rational(4, 100))
  })

  test('every site declines by exactly 2.0 points → reversal', () => {
    for (const g of a.groups) {
      expect(g.change).toEqual(rational(-2, 100))
      expect(g.direction).toBe('down')
    }
    expect(a.pattern).toBe('reversal')
  })

  test('displays perfectly at one decimal with no approximation', () => {
    expect(a.display).toEqual({
      decimals: 1,
      approximate: false,
      previousRate: '62.5%',
      currentRate: '66.5%',
      net: '+4.0',
      netMagnitude: '4',
      rateEffect: `${MINUS}2.0`,
      compositionEffect: '+6.0',
      equation: `${MINUS}2.0 + 6.0 = +4.0`,
    })
    expect(a.groups.map((g) => [g.name, g.display.previousRate, g.display.currentRate, g.display.change])).toEqual([
      ['North', '80.0%', '78.0%', `${MINUS}2.0`],
      ['East', '70.0%', '68.0%', `${MINUS}2.0`],
      ['South', '60.0%', '58.0%', `${MINUS}2.0`],
      ['West', '40.0%', '38.0%', `${MINUS}2.0`],
    ])
    expect(a.groups.map((g) => [g.display.previousShare, g.display.currentShare])).toEqual([
      ['25.0%', '40.0%'],
      ['25.0%', '25.0%'],
      ['25.0%', '25.0%'],
      ['25.0%', '10.0%'],
    ])
  })
})

describe('analyze — independent oracle on 500 seeded random datasets', () => {
  const rand = mulberry32(20261026)
  const datasets = Array.from({ length: 500 }, () => randomDataset(rand))

  test('exact effects match the oracle and always sum to the net change', () => {
    for (const ds of datasets) {
      const a = analyze(ds)
      const o = oracle(ds)
      expect([a.decomposition.rateEffect.n, a.decomposition.rateEffect.d]).toEqual(o.rate)
      expect([a.decomposition.compositionEffect.n, a.decomposition.compositionEffect.d]).toEqual(o.composition)
      expect([a.decomposition.net.n, a.decomposition.net.d]).toEqual(o.net)
      expect(o.oneSided).toEqual(o.net)
    }
  })

  test('float view agrees with the oracle within 1e-12 points', () => {
    for (const ds of datasets) {
      const a = analyze(ds)
      const o = oracle(ds)
      expect(Math.abs(a.decompositionPoints.rateEffect - 100 * fnum(o.rate))).toBeLessThan(1e-12)
      expect(Math.abs(a.decompositionPoints.compositionEffect - 100 * fnum(o.composition))).toBeLessThan(1e-12)
      expect(Math.abs(a.decompositionPoints.net - 100 * fnum(o.net))).toBeLessThan(1e-12)
    }
  })

  test('displayed equation always reconciles unless explicitly marked approximate', () => {
    const parse = (s: string) => Number(s.replace(MINUS, '-').replace('+', '').replace('%', ''))
    for (const ds of datasets) {
      const { display } = analyze(ds)
      if (display.approximate || display.equation.includes('<')) continue
      const sumOfParts = parse(display.rateEffect) + parse(display.compositionEffect)
      expect(sumOfParts).toBeCloseTo(parse(display.net), display.decimals + 2)
      expect(parse(display.currentRate) - parse(display.previousRate)).toBeCloseTo(parse(display.net), display.decimals + 2)
      expect(display.equation).not.toMatch(new RegExp(`${MINUS}0\\.0+(?!\\d)`)) // no negative zero
    }
  })
})

describe('analyze — edge cases', () => {
  const ds = (rows: [number, number, number, number][]): Dataset => ({
    groups: rows.map(([s0, t0, s1, t1], i) => ({
      name: `G${i}`,
      previous: { successes: s0, total: t0 },
      current: { successes: s1, total: t1 },
    })),
  })

  test('equal composition → composition effect is exactly zero', () => {
    const a = analyze(ds([[50, 100, 60, 100], [20, 100, 25, 100]]))
    expect(a.decomposition.compositionEffect).toEqual(rational(0))
    expect(a.display.compositionEffect).toBe('0.0')
    expect(a.pattern).toBe('consistent')
  })

  test('equal group rates → rate effect zero, change comes only from mix', () => {
    const a = analyze(ds([[80, 100, 160, 200], [30, 100, 15, 50]]))
    expect(a.decomposition.rateEffect).toEqual(rational(0))
    expect(a.pattern).toBe('groupsUnchanged')
    expect(a.overall.direction).toBe('up')
  })

  test('every group declining with overall decline → consistent, not a reversal', () => {
    const a = analyze(ds([[80, 100, 70, 100], [60, 100, 50, 100]]))
    expect(a.pattern).toBe('consistent')
    expect(a.overall.direction).toBe('down')
  })

  test('mixed group directions', () => {
    expect(analyze(ds([[50, 100, 60, 100], [50, 100, 40, 100]])).pattern).toBe('mixed')
  })

  test('no change at all', () => {
    const a = analyze(ds([[50, 100, 50, 100], [20, 100, 20, 100]]))
    expect(a.pattern).toBe('groupsUnchanged')
    expect(a.overall.direction).toBe('unchanged')
    expect(a.display.net).toBe('0.0')
    expect(a.display.equation).toBe('0.0 + 0.0 = 0.0')
  })

  test('a tiny real change is never classified or displayed as unchanged', () => {
    const a = analyze(ds([[500_000, 1_000_000, 500_001, 1_000_000], [10, 100, 10, 100]]))
    const tiny = a.groups[0]!
    expect(tiny.direction).toBe('up')
    expect(tiny.display.change).toBe('+<0.001')
    expect(a.overall.direction).toBe('up')
    expect(a.display.net).not.toBe('0.0')
  })

  test('precision escalates beyond one decimal when needed and stays exact', () => {
    // rates 1/3 → 2/3 style values that do not reconcile at 1 decimal
    const a = analyze(ds([[1, 3, 2, 3], [1, 7, 3, 7], [5, 11, 4, 9]]))
    expect(a.display.decimals).toBeGreaterThanOrEqual(1)
    expect(toNumber(a.decomposition.net)).toBeCloseTo(
      toNumber(a.decomposition.rateEffect) + toNumber(a.decomposition.compositionEffect),
      15,
    )
  })
})
