// Exact rational arithmetic on BigInt. Used for every value whose digits are
// displayed, so rounding decisions never depend on binary floating point.

export interface Rational {
  readonly n: bigint
  readonly d: bigint // always > 0
}

const abs = (x: bigint): bigint => (x < 0n ? -x : x)

const gcd = (a: bigint, b: bigint): bigint => {
  let x = abs(a)
  let y = abs(b)
  while (y !== 0n) {
    ;[x, y] = [y, x % y]
  }
  return x
}

export const rational = (n: bigint | number, d: bigint | number = 1n): Rational => {
  let num = BigInt(n)
  let den = BigInt(d)
  if (den === 0n) throw new RangeError('Rational denominator cannot be zero')
  if (den < 0n) {
    num = -num
    den = -den
  }
  const g = gcd(num, den) || 1n
  return { n: num / g, d: den / g }
}

export const ZERO = rational(0)

export const add = (a: Rational, b: Rational): Rational => rational(a.n * b.d + b.n * a.d, a.d * b.d)
export const sub = (a: Rational, b: Rational): Rational => rational(a.n * b.d - b.n * a.d, a.d * b.d)
export const mul = (a: Rational, b: Rational): Rational => rational(a.n * b.n, a.d * b.d)
export const div = (a: Rational, b: Rational): Rational => rational(a.n * b.d, a.d * b.n)
export const sum = (values: Rational[]): Rational => values.reduce(add, ZERO)

export const sign = (a: Rational): -1 | 0 | 1 => (a.n < 0n ? -1 : a.n > 0n ? 1 : 0)
export const equals = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d

const FLOAT_SCALE = 10n ** 18n

/**
 * Approximate value, for chart geometry and float cross-checks only.
 * Divides in BigInt first: numerator and denominator can each exceed the
 * float range (e.g. 50 groups with large prime totals) even when the value is small.
 */
export const toNumber = (a: Rational): number => Number((a.n * FLOAT_SCALE) / a.d) / Number(FLOAT_SCALE)

/**
 * Round `value × 10^decimals` to the nearest integer, ties away from zero,
 * using integer arithmetic only. Returns the scaled integer (e.g. 4.05 at 1 → 41n).
 */
export const roundScaled = (value: Rational, decimals: number): bigint => {
  const scaled = abs(value.n) * 10n ** BigInt(decimals)
  const quotient = scaled / value.d
  const remainder = scaled % value.d
  const rounded = 2n * remainder >= value.d ? quotient + 1n : quotient
  return value.n < 0n ? -rounded : rounded
}
