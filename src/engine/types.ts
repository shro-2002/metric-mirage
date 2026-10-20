import type { Rational } from './rational'

export interface GroupCounts {
  successes: number
  total: number
}

export interface DatasetGroup {
  name: string
  previous: GroupCounts
  current: GroupCounts
}

export interface Dataset {
  groups: DatasetGroup[]
}

export type Direction = 'up' | 'down' | 'unchanged'

export type Pattern = 'reversal' | 'consistent' | 'mixed' | 'divergent' | 'groupsUnchanged'

/** Exact values. Rates and shares are ratios in [0, 1]; changes are ratio differences. */
export interface PeriodExact {
  rate: Rational
  share: Rational
}

export interface GroupResult {
  name: string
  previous: GroupCounts & PeriodExact
  current: GroupCounts & PeriodExact
  change: Rational
  direction: Direction
  display: GroupDisplay
}

export interface GroupDisplay {
  decimals: number
  approximate: boolean
  previousRate: string // "80.0%"
  currentRate: string
  change: string // "−2.0"
  previousShare: string // "25.0%"
  currentShare: string
}

export interface Decomposition {
  rateEffect: Rational
  compositionEffect: Rational
  net: Rational
}

export interface OverallDisplay {
  decimals: number
  approximate: boolean
  previousRate: string // "62.5%"
  currentRate: string
  net: string // "+4.0"
  netMagnitude: string // "4" (trailing zeros trimmed, for prose)
  rateEffect: string // "−2.0"
  compositionEffect: string // "+6.0"
  equation: string // "−2.0 + 6.0 = +4.0"
}

export interface Analysis {
  overall: {
    previous: GroupCounts & { rate: Rational }
    current: GroupCounts & { rate: Rational }
    change: Rational
    direction: Direction
  }
  groups: GroupResult[]
  decomposition: Decomposition
  /** Float view of the decomposition in percentage points, for chart geometry only. */
  decompositionPoints: { rateEffect: number; compositionEffect: number; net: number }
  pattern: Pattern
  display: OverallDisplay
}
