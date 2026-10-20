import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { tutoringExample } from '../data/tutoring-example'
import { analyze } from '../engine/analyze'
import { parseCsvText, readCsvFile } from './parse-csv'

const HEADER = 'period,group,successes,total'
const VALID = [HEADER, 'previous,A,50,100', 'previous,B,20,100', 'current,A,60,100', 'current,B,25,100'].join('\n')
const csv = (...rows: string[]) => [HEADER, ...rows].join('\n')
const messages = (text: string) => {
  const result = parseCsvText(text)
  if (result.ok) throw new Error('expected validation errors')
  return result.errors.map((e) => e.message).join(' | ')
}

describe('parseCsvText — valid input', () => {
  test('a valid file becomes a dataset in first-appearance order', () => {
    const result = parseCsvText(VALID)
    expect(result).toEqual({
      ok: true,
      dataset: {
        groups: [
          { name: 'A', previous: { successes: 50, total: 100 }, current: { successes: 60, total: 100 } },
          { name: 'B', previous: { successes: 20, total: 100 }, current: { successes: 25, total: 100 } },
        ],
      },
    })
  })

  test('tolerates a BOM, CRLF line endings, blank lines, header case/spacing, column order, quoted values and padding', () => {
    const text = '﻿ Total , Period,GROUP,successes\r\n\r\n100,previous,"A",50\r\n 100 , previous ,"B, Inc.",20\r\n100,current,A,60\r\n100,current,"B, Inc.",25\r\n'
    const result = parseCsvText(text)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.dataset.groups.map((g) => g.name)).toEqual(['A', 'B, Inc.'])
  })
})

describe('parseCsvText — every rule rejects with a specific message', () => {
  test.each([
    ['empty file', '', /The file is empty/],
    ['header only', HEADER, /no data rows/],
    ['missing column', 'period,group,successes\nprevious,A,1', /Missing column "total"/],
    ['extra column', `${HEADER},notes\nprevious,A,1,2,x`, /Unexpected column "notes"/],
    ['duplicate column', 'period,group,total,total\nprevious,A,1,2', /appears more than once/],
    ['wrong row width', csv('previous,A,50'), /Row 2 has 3 values; expected 4/],
    ['capitalized period', csv('Previous,A,50,100', 'current,A,60,100', 'previous,B,1,2', 'current,B,1,2'), /Row 2: period is "Previous"\. Use exactly "previous" or "current" \(lowercase\)/],
    ['unknown period', csv('before,A,50,100'), /period is "before"/],
    ['blank group', csv('previous,,50,100'), /group is blank/],
    ['decimal count', csv('previous,A,12.5,100'), /successes is "12.5"\. Use a whole number/],
    ['negative count', csv('previous,A,-1,100'), /successes is "-1"/],
    ['thousands separator', csv('previous,A,"1,200",2000'), /successes is "1,200"/],
    ['blank count', csv('previous,A,,100'), /successes is blank/],
    ['zero total', csv('previous,A,0,0'), /total is 0\. Each total must be at least 1/],
    ['oversized total', csv('previous,A,1,1000001'), /Totals above 1,000,000/],
    ['successes above total', csv('previous,A,120,100'), /successes \(120\) is greater than total \(100\)/],
    ['duplicate row', csv('previous,A,1,2', 'previous,A,1,2', 'current,A,1,2', 'previous,B,1,2', 'current,B,1,2'), /Row 3: "A" already has a "previous" row \(row 2\)/],
    ['missing period for a group', csv('previous,A,1,2', 'current,A,1,2', 'previous,B,1,2'), /"B" has a "previous" row but no "current" row/],
    ['case-collision names', csv('previous,North,1,2', 'current,North,1,2', 'previous,north,1,2', 'current,north,1,2'), /differ only in capitalization/],
    ['single group', csv('previous,A,1,2', 'current,A,1,2'), /Add at least 2 groups/],
    ['unclosed quote', csv('previous,"A,1,2'), /quoted value is not closed/],
  ])('%s', (_, text, expected) => {
    expect(messages(text)).toMatch(expected)
  })

  test('too many groups', () => {
    const rows = Array.from({ length: 51 }, (_, i) => [`previous,G${i},1,2`, `current,G${i},1,2`]).flat()
    expect(messages(csv(...rows))).toMatch(/51 groups\. Up to 50 are supported/)
  })

  test('errors are capped at 10 with a count of the rest', () => {
    const rows = Array.from({ length: 15 }, (_, i) => `later,G${i},1,2`)
    const result = parseCsvText(csv(...rows))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toHaveLength(11)
      expect(result.errors.at(-1)?.message).toMatch(/and 5 more problems/)
    }
  })
})

describe('readCsvFile', () => {
  test('rejects files over 1 MB without reading them', async () => {
    const big = new File(['x'.repeat(1024 * 1024 + 1)], 'big.csv', { type: 'text/csv' })
    const result = await readCsvFile(big)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]?.message).toMatch(/larger than 1 MB/)
  })

  test('reads a File', async () => {
    expect((await readCsvFile(new File([VALID], 'ok.csv'))).ok).toBe(true)
  })
})

describe('shipped CSV files', () => {
  const load = (name: string) => readFileSync(resolve(__dirname, '../../public', name), 'utf8')

  test('the template reproduces the flagship example exactly', () => {
    const result = parseCsvText(load('metric-mirage-template.csv'))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.dataset).toEqual(tutoringExample)
  })

  test('the second sample is valid, different, and not a reversal', () => {
    const result = parseCsvText(load('sample-consistent.csv'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const a = analyze(result.dataset)
    expect(a.pattern).toBe('consistent')
    expect(a.overall.direction).toBe('up')
    expect(result.dataset.groups.map((g) => g.name)).not.toContain('North')
  })
})

describe('error reporting stays focused', () => {
  test('a rejected row does not also produce a misleading "missing period" error', () => {
    const text = csv('Previous,A,50,100', 'current,A,60,100', 'previous,B,120,100', 'current,B,1,2')
    const result = parseCsvText(text)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.map((e) => e.message)).toEqual([
        'Row 2: period is "Previous". Use exactly "previous" or "current" (lowercase).',
        'Row 4: successes (120) is greater than total (100).',
      ])
    }
  })
})
