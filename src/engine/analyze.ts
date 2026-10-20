// Aggregation and the symmetric Kitagawa rate/mix decomposition.
//
// For each group i with share w and rate r in the two periods:
//   w₁r₁ − w₀r₀ = ½(w₀+w₁)(r₁−r₀)  +  ½(r₀+r₁)(w₁−w₀)
//                 └ rate effect ┘     └ composition effect ┘
// The cross terms cancel exactly, so summed over groups the two effects equal
// the change in the overall rate with no residual. Computed in exact rationals.

import { directionOf, classifyPattern } from './classify'
import {
  choosePrecision,
  formatEquation,
  formatPercent,
  formatValue,
  partsReconcile,
  ratesReconcile,
  shareDecimals,
  toPoints,
  trimTrailingZeros,
} from './format'
import { add, equals, mul, rational, sub, sum, toNumber } from './rational'
import type { Analysis, Dataset, GroupResult } from './types'

const HALF = rational(1, 2)
const FLOAT_TOLERANCE_POINTS = 1e-9

export class InvariantError extends Error {}

const totalOf = (counts: { successes: number; total: number }[]) => ({
  successes: counts.reduce((acc, c) => acc + c.successes, 0),
  total: counts.reduce((acc, c) => acc + c.total, 0),
})

export const analyze = (dataset: Dataset): Analysis => {
  const prevTotal = totalOf(dataset.groups.map((g) => g.previous))
  const currTotal = totalOf(dataset.groups.map((g) => g.current))
  const overallPrevRate = rational(prevTotal.successes, prevTotal.total)
  const overallCurrRate = rational(currTotal.successes, currTotal.total)
  const net = sub(overallCurrRate, overallPrevRate)

  const exactGroups = dataset.groups.map((g) => {
    const r0 = rational(g.previous.successes, g.previous.total)
    const r1 = rational(g.current.successes, g.current.total)
    const w0 = rational(g.previous.total, prevTotal.total)
    const w1 = rational(g.current.total, currTotal.total)
    return {
      group: g,
      r0,
      r1,
      w0,
      w1,
      rateTerm: mul(mul(HALF, add(w0, w1)), sub(r1, r0)),
      compositionTerm: mul(mul(HALF, add(r0, r1)), sub(w1, w0)),
    }
  })

  const rateEffect = sum(exactGroups.map((g) => g.rateTerm))
  const compositionEffect = sum(exactGroups.map((g) => g.compositionTerm))

  if (!equals(add(rateEffect, compositionEffect), net)) {
    throw new InvariantError('Rate effect + composition effect must equal the overall change exactly')
  }

  const decompositionPoints = {
    rateEffect: toNumber(toPoints(rateEffect)),
    compositionEffect: toNumber(toPoints(compositionEffect)),
    net: toNumber(toPoints(net)),
  }
  const floats = Object.values(decompositionPoints)
  if (
    !floats.every(Number.isFinite) ||
    Math.abs(decompositionPoints.rateEffect + decompositionPoints.compositionEffect - decompositionPoints.net) > FLOAT_TOLERANCE_POINTS
  ) {
    throw new InvariantError('Floating-point view of the decomposition does not reconcile')
  }

  const groups: GroupResult[] = exactGroups.map(({ group, r0, r1, w0, w1 }) => {
    const change = sub(r1, r0)
    const { decimals, approximate } = choosePrecision((d) => ratesReconcile(r0, r1, change, d), [change])
    const shareD = shareDecimals(w0, w1)
    return {
      name: group.name,
      previous: { ...group.previous, rate: r0, share: w0 },
      current: { ...group.current, rate: r1, share: w1 },
      change,
      direction: directionOf(change),
      display: {
        decimals,
        approximate,
        previousRate: formatPercent(r0, decimals),
        currentRate: formatPercent(r1, decimals),
        change: formatValue(toPoints(change), decimals, true),
        previousShare: formatPercent(w0, shareD),
        currentShare: formatPercent(w1, shareD),
      },
    }
  })

  const overallDirection = directionOf(net)
  const { decimals, approximate } = choosePrecision(
    (d) =>
      partsReconcile(rateEffect, compositionEffect, net, d) && ratesReconcile(overallPrevRate, overallCurrRate, net, d),
    [rateEffect, compositionEffect, net],
  )

  const netUnsigned = formatValue(toPoints(net), decimals, false)

  return {
    overall: {
      previous: { ...prevTotal, rate: overallPrevRate },
      current: { ...currTotal, rate: overallCurrRate },
      change: net,
      direction: overallDirection,
    },
    groups,
    decomposition: { rateEffect, compositionEffect, net },
    decompositionPoints,
    pattern: classifyPattern(
      overallDirection,
      groups.map((g) => g.direction),
    ),
    display: {
      decimals,
      approximate,
      previousRate: formatPercent(overallPrevRate, decimals),
      currentRate: formatPercent(overallCurrRate, decimals),
      net: formatValue(toPoints(net), decimals, true),
      netMagnitude: trimTrailingZeros(netUnsigned.replace('−', '')),
      rateEffect: formatValue(toPoints(rateEffect), decimals, true),
      compositionEffect: formatValue(toPoints(compositionEffect), decimals, true),
      equation: formatEquation(rateEffect, compositionEffect, net, decimals, approximate),
    },
  }
}
