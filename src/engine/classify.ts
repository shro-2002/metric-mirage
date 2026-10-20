import { sign, type Rational } from './rational'
import type { Direction, Pattern } from './types'

/** Exact direction of a change; "unchanged" only when the change is exactly zero. */
export const directionOf = (change: Rational): Direction => {
  const s = sign(change)
  if (s > 0) return 'up'
  if (s < 0) return 'down'
  return 'unchanged'
}

const opposite = (d: Direction): Direction => (d === 'up' ? 'down' : d === 'down' ? 'up' : 'unchanged')

/**
 * Pattern of the overall direction against the group directions, evaluated in a
 * fixed order (see spec.md > Classification). Every combination maps to exactly one.
 */
export const classifyPattern = (overall: Direction, groups: Direction[]): Pattern => {
  const up = groups.filter((d) => d === 'up').length
  const down = groups.filter((d) => d === 'down').length
  const unchanged = groups.length - up - down

  if (unchanged === groups.length) return 'groupsUnchanged'
  if (overall !== 'unchanged' && unchanged === 0 && groups.every((d) => d === opposite(overall))) {
    return 'reversal'
  }
  if (up > 0 && down > 0) return 'mixed'
  if (overall !== 'unchanged' && groups.every((d) => d !== opposite(overall))) return 'consistent'
  return 'divergent'
}
