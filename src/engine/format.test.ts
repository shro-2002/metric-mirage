import { describe, expect, test } from 'vitest'

import { choosePrecision, formatEquation, formatValue, MINUS, partsReconcile, shareDecimals, trimTrailingZeros } from './format'
import { rational } from './rational'

describe('formatValue', () => {
  test('signed positive and negative use + and a true minus', () => {
    expect(formatValue(rational(4), 1, true)).toBe('+4.0')
    expect(formatValue(rational(-2), 1, true)).toBe(`${MINUS}2.0`)
  })

  test('exact zero has no sign, signed or not', () => {
    expect(formatValue(rational(0), 1, true)).toBe('0.0')
    expect(formatValue(rational(-0), 2, true)).toBe('0.00')
  })

  test('a tiny nonzero value never prints as zero', () => {
    expect(formatValue(rational(1, 10_000), 3, true)).toBe('+<0.001')
    expect(formatValue(rational(-1, 10_000), 3, true)).toBe(`${MINUS}<0.001`)
    expect(formatValue(rational(1, 10_000), 3, false)).toBe('<0.001')
  })

  test('a value that rounds to −0.0 is shown as tiny-negative, not "−0.0"', () => {
    expect(formatValue(rational(-4, 100), 1, true)).toBe(`${MINUS}<0.1`)
  })
})

describe('trimTrailingZeros', () => {
  test.each([
    ['4.0', '4'],
    ['3.50', '3.5'],
    ['12.345', '12.345'],
    ['<0.001', '<0.001'],
  ])('%s → %s', (input, expected) => expect(trimTrailingZeros(input)).toBe(expected))
})

describe('choosePrecision', () => {
  test('stays at 1 decimal when everything reconciles', () => {
    expect(choosePrecision(() => true, [rational(4, 100)])).toEqual({ decimals: 1, approximate: false })
  })

  test('escalates to 2 decimals when 1 does not reconcile', () => {
    expect(choosePrecision((d) => d >= 2, [])).toEqual({ decimals: 2, approximate: false })
  })

  test('escalates when a nonzero value would display as zero', () => {
    // 0.0004 as a ratio = 0.04 points: invisible at 1 decimal, visible at 2
    expect(choosePrecision(() => true, [rational(4, 10_000)])).toEqual({ decimals: 2, approximate: false })
  })

  test('falls back to 3 decimals marked approximate when nothing reconciles', () => {
    // parts 0.0004 + 0.0004 points vs whole 0.0008 points: 0 + 0 ≠ 1 at 3 decimals
    const part = rational(4, 1_000_000)
    const whole = rational(8, 1_000_000)
    expect(choosePrecision((d) => partsReconcile(part, part, whole, d), [part, part, whole])).toEqual({
      decimals: 3,
      approximate: true,
    })
  })
})

describe('formatEquation', () => {
  test('flagship shape', () => {
    expect(formatEquation(rational(-2, 100), rational(6, 100), rational(4, 100), 1, false)).toBe(
      `${MINUS}2.0 + 6.0 = +4.0`,
    )
  })

  test('negative second term uses a minus operator, approximate uses ≈', () => {
    expect(formatEquation(rational(3, 100), rational(-1, 100), rational(2, 100), 1, true)).toBe(
      `+3.0 ${MINUS} 1.0 ≈ +2.0`,
    )
  })
})

describe('shareDecimals', () => {
  test('unchanged share stays at 1 decimal', () => {
    expect(shareDecimals(rational(1, 4), rational(1, 4))).toBe(1)
  })
  test('a tiny real change gets enough decimals to show it', () => {
    // 31.25% → 31.27% (Mill in the second sample)
    expect(shareDecimals(rational(500, 1600), rational(505, 1615))).toBe(2)
  })
})
