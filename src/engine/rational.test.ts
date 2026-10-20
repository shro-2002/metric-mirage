import { describe, expect, test } from 'vitest'

import { rational, roundScaled, sign } from './rational'

describe('roundScaled (half away from zero, exact)', () => {
  test.each([
    // [numerator, denominator, decimals, expected scaled integer]
    [4, 1, 1, 40n], // positive whole
    [-2, 1, 1, -20n], // negative whole
    [1, 20, 1, 1n], // 0.05 exactly halfway → 0.1
    [-1, 20, 1, -1n], // −0.05 exactly halfway → −0.1 (away from zero)
    [25, 10, 0, 3n], // 2.5 → 3
    [-25, 10, 0, -3n], // −2.5 → −3
    [499999, 10_000_000, 1, 0n], // 0.0499999 just below halfway → 0.0
    [500001, 10_000_000, 1, 1n], // 0.0500001 just above halfway → 0.1
    [1005, 1000, 2, 101n], // 1.005 → 1.01 (binary floats famously give 1.00)
    [0, 1, 1, 0n], // zero
    [1, 3, 3, 333n], // repeating decimal
    [2, 3, 3, 667n],
    [1, 10_000_000, 3, 0n], // tiny nonzero rounds to zero at 3 decimals
  ])('%i/%i at %i decimals → %s', (n, d, decimals, expected) => {
    expect(roundScaled(rational(n, d), decimals)).toBe(expected)
  })

  test('negative zero cannot arise: −0 normalizes to 0', () => {
    const negativeZero = rational(-0, 5)
    expect(sign(negativeZero)).toBe(0)
    expect(roundScaled(negativeZero, 1)).toBe(0n)
  })

  test('denominators are normalized positive and reduced', () => {
    expect(rational(3, -6)).toEqual({ n: -1n, d: 2n })
  })

  test('zero denominator is rejected', () => {
    expect(() => rational(1, 0)).toThrow(RangeError)
  })
})
