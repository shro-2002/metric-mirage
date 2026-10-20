import { describe, expect, test } from 'vitest'

import { classifyPattern } from './classify'
import type { Direction } from './types'

const DIRECTIONS: Direction[] = ['up', 'down', 'unchanged']

const allTuples = (length: number): Direction[][] =>
  length === 0 ? [[]] : allTuples(length - 1).flatMap((t) => DIRECTIONS.map((d) => [...t, d]))

describe('classifyPattern — exhaustive over 1–4 groups × 3 overall directions', () => {
  const cases = [1, 2, 3, 4].flatMap((n) => allTuples(n).flatMap((groups) => DIRECTIONS.map((overall) => ({ overall, groups }))))

  test.each(cases)('$overall vs $groups', ({ overall, groups }) => {
    const pattern = classifyPattern(overall, groups)
    const up = groups.filter((d) => d === 'up').length
    const down = groups.filter((d) => d === 'down').length
    const unchanged = groups.length - up - down
    const opposite = overall === 'up' ? 'down' : overall === 'down' ? 'up' : null

    // Each definition, restated independently of the implementation's ordering.
    const isGroupsUnchanged = unchanged === groups.length
    const isReversal = !isGroupsUnchanged && opposite !== null && groups.every((g) => g === opposite)
    const isMixed = !isGroupsUnchanged && !isReversal && up > 0 && down > 0
    const isConsistent =
      !isGroupsUnchanged && !isReversal && !isMixed && opposite !== null && groups.every((g) => g !== opposite)

    if (isGroupsUnchanged) expect(pattern).toBe('groupsUnchanged')
    else if (isReversal) expect(pattern).toBe('reversal')
    else if (isMixed) expect(pattern).toBe('mixed')
    else if (isConsistent) expect(pattern).toBe('consistent')
    else expect(pattern).toBe('divergent')
  })

  test('complete reversal requires a nonzero overall change and every group moving the other way', () => {
    expect(classifyPattern('up', ['down', 'down'])).toBe('reversal')
    expect(classifyPattern('up', ['down', 'unchanged'])).toBe('divergent')
    expect(classifyPattern('unchanged', ['down', 'down'])).toBe('divergent')
  })
})
