// Display formatting. Every string the page shows or copies comes from here.
// Underlying exact values are never altered; only the number of displayed
// decimals adapts (1 → 3) so that rounded figures reconcile.

import { mul, rational, roundScaled, sign, type Rational } from './rational'

export const MINUS = '−'
export const MIN_DECIMALS = 1
export const MAX_DECIMALS = 3

const HUNDRED = rational(100)

/** Ratio → percent / percentage points (exact). */
export const toPoints = (ratio: Rational): Rational => mul(ratio, HUNDRED)

const magnitude = (scaled: bigint, decimals: number): string => {
  const digits = (scaled < 0n ? -scaled : scaled).toString().padStart(decimals + 1, '0')
  return `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`
}

const signChar = (value: Rational): string => (sign(value) < 0 ? MINUS : '+')

/**
 * Format a value already in points/percent at `decimals`.
 * Exactly zero has no sign (never "−0.0"). A nonzero value too small to show
 * at this precision renders as "<0.001" (keeping its sign when signed).
 */
export const formatValue = (value: Rational, decimals: number, signed: boolean): string => {
  if (sign(value) === 0) return magnitude(0n, decimals)
  const scaled = roundScaled(value, decimals)
  const prefix = signed ? signChar(value) : sign(value) < 0 ? MINUS : ''
  if (scaled === 0n) return `${prefix}<${magnitude(1n, decimals)}`
  return `${prefix}${magnitude(scaled, decimals)}`
}

export const formatPercent = (ratio: Rational, decimals: number): string =>
  `${formatValue(toPoints(ratio), decimals, false)}%`

/** "4.0" → "4", "3.50" → "3.5"; used only in prose such as the headline. */
export const trimTrailingZeros = (text: string): string => text.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')

const visibleWhenNonzero = (values: Rational[], decimals: number): boolean =>
  values.every((v) => sign(v) === 0 || roundScaled(v, decimals) !== 0n)

/** Rounded previous/current rates must differ by exactly the rounded change. */
export const ratesReconcile = (previous: Rational, current: Rational, change: Rational, decimals: number): boolean =>
  roundScaled(toPoints(current), decimals) - roundScaled(toPoints(previous), decimals) ===
  roundScaled(toPoints(change), decimals)

/** Rounded parts must sum to the rounded whole. */
export const partsReconcile = (a: Rational, b: Rational, whole: Rational, decimals: number): boolean =>
  roundScaled(toPoints(a), decimals) + roundScaled(toPoints(b), decimals) === roundScaled(toPoints(whole), decimals)

/**
 * Smallest decimals in [1, 3] where every reconciliation holds and no nonzero value
 * displays as zero. Otherwise 3 decimals, marked approximate if they still don't reconcile.
 */
export const choosePrecision = (
  reconciles: (decimals: number) => boolean,
  shown: Rational[],
): { decimals: number; approximate: boolean } => {
  for (let d = MIN_DECIMALS; d <= MAX_DECIMALS; d++) {
    if (reconciles(d) && visibleWhenNonzero(shown.map(toPoints), d)) return { decimals: d, approximate: false }
  }
  return { decimals: MAX_DECIMALS, approximate: !reconciles(MAX_DECIMALS) }
}

/** "−2.0 + 6.0 = +4.0", or "≈" when the rounded figures cannot reconcile. */
export const formatEquation = (
  rateEffect: Rational,
  compositionEffect: Rational,
  net: Rational,
  decimals: number,
  approximate: boolean,
): string => {
  const first = formatValue(toPoints(rateEffect), decimals, true)
  const operator = sign(compositionEffect) < 0 ? MINUS : '+'
  const second = formatValue(toPoints(compositionEffect), decimals, false).replace(MINUS, '')
  const relation = approximate ? '≈' : '='
  return `${first} ${operator} ${second} ${relation} ${formatValue(toPoints(net), decimals, true)}`
}
