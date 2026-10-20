// Strict validation of the fixed CSV format:
//   period,group,successes,total   (one row per group per period)
// Anything that doesn't fit is rejected with a specific, human-readable message.
// Nothing is guessed or repaired.

import type { Dataset, DatasetGroup, GroupCounts } from '../engine/types'

export const REQUIRED_COLUMNS = ['period', 'group', 'successes', 'total'] as const
export const PERIODS = ['previous', 'current'] as const
export const MAX_TOTAL = 1_000_000
export const MIN_GROUPS = 2
export const MAX_GROUPS = 50
export const MAX_ERRORS = 10

type Period = (typeof PERIODS)[number]
type Column = (typeof REQUIRED_COLUMNS)[number]

export interface ValidationError {
  message: string
  row?: number // 1-based line number in the file; the header is row 1
}

export type ValidationResult = { ok: true; dataset: Dataset } | { ok: false; errors: ValidationError[] }

const WHOLE_NUMBER = /^\d+$/
const isBlank = (cells: string[]) => cells.every((c) => c.trim() === '')
const quote = (value: string) => `"${value}"`

const checkHeader = (header: string[]): { columns?: Record<Column, number>; errors: ValidationError[] } => {
  const names = header.map((h) => h.trim().toLowerCase())
  const errors: ValidationError[] = []
  const expected = `The first row must be exactly: ${REQUIRED_COLUMNS.join(',')}`

  const seen = new Set<string>()
  for (const name of names) {
    if (seen.has(name)) errors.push({ row: 1, message: `Column ${quote(name)} appears more than once. ${expected}.` })
    seen.add(name)
  }
  for (const name of names) {
    if (!(REQUIRED_COLUMNS as readonly string[]).includes(name)) {
      errors.push({ row: 1, message: `Unexpected column ${quote(name || '(blank)')}. ${expected}.` })
    }
  }
  for (const column of REQUIRED_COLUMNS) {
    if (!names.includes(column)) errors.push({ row: 1, message: `Missing column ${quote(column)}. ${expected}.` })
  }
  if (errors.length > 0) return { errors }

  const columns = Object.fromEntries(REQUIRED_COLUMNS.map((c) => [c, names.indexOf(c)])) as Record<Column, number>
  return { columns, errors }
}

const parseCount = (raw: string, column: 'successes' | 'total', row: number): number | ValidationError => {
  if (!WHOLE_NUMBER.test(raw)) {
    const shown = raw === '' ? 'blank' : quote(raw)
    return { row, message: `Row ${row}: ${column} is ${shown}. Use a whole number with no decimals, signs, spaces or thousands separators.` }
  }
  return Number(raw)
}

const withCap = (errors: ValidationError[]): ValidationResult =>
  errors.length <= MAX_ERRORS
    ? { ok: false, errors }
    : { ok: false, errors: [...errors.slice(0, MAX_ERRORS), { message: `…and ${errors.length - MAX_ERRORS} more problems.` }] }

/** Validate parsed CSV rows (`rows[0]` is the header). */
export const validateRows = (rows: string[][]): ValidationResult => {
  const nonBlank = rows.filter((r) => !isBlank(r))
  if (nonBlank.length === 0) return { ok: false, errors: [{ message: 'The file is empty.' }] }

  const headerIndex = rows.findIndex((r) => !isBlank(r))
  const { columns, errors: headerErrors } = checkHeader(rows[headerIndex]!)
  if (!columns) return { ok: false, errors: headerErrors }

  const errors: ValidationError[] = []
  const groups = new Map<string, { name: string; previous?: GroupCounts & { row: number }; current?: GroupCounts & { row: number } }>()
  let dataRows = 0

  rows.forEach((cells, index) => {
    if (index <= headerIndex || isBlank(cells)) return
    const row = index + 1
    dataRows++
    if (cells.length !== REQUIRED_COLUMNS.length) {
      errors.push({ row, message: `Row ${row} has ${cells.length} values; expected ${REQUIRED_COLUMNS.length} (${REQUIRED_COLUMNS.join(', ')}).` })
      return
    }
    const value = (c: Column) => cells[columns[c]]!.trim()
    const period = value('period')
    const name = value('group')
    const rowErrors: ValidationError[] = []

    if (!(PERIODS as readonly string[]).includes(period)) {
      rowErrors.push({
        row,
        message: `Row ${row}: period is ${period === '' ? 'blank' : quote(period)}. Use exactly "previous" or "current" (lowercase).`,
      })
    }
    if (name === '') rowErrors.push({ row, message: `Row ${row}: group is blank. Give every row a group name.` })

    const successes = parseCount(value('successes'), 'successes', row)
    const total = parseCount(value('total'), 'total', row)
    if (typeof successes !== 'number') rowErrors.push(successes)
    if (typeof total !== 'number') rowErrors.push(total)
    if (typeof total === 'number' && total < 1) rowErrors.push({ row, message: `Row ${row}: total is 0. Each total must be at least 1.` })
    if (typeof total === 'number' && total > MAX_TOTAL) {
      rowErrors.push({ row, message: `Row ${row}: total is ${total}. Totals above ${MAX_TOTAL.toLocaleString('en-US')} are not supported.` })
    }
    if (typeof successes === 'number' && typeof total === 'number' && successes > total) {
      rowErrors.push({ row, message: `Row ${row}: successes (${successes}) is greater than total (${total}).` })
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      return
    }

    const entry = groups.get(name) ?? { name }
    const existing = entry[period as Period]
    if (existing) {
      errors.push({ row, message: `Row ${row}: ${quote(name)} already has a ${quote(period)} row (row ${existing.row}). Each group needs exactly one row per period.` })
      return
    }
    entry[period as Period] = { successes: successes as number, total: total as number, row }
    groups.set(name, entry)
  })

  if (dataRows === 0) errors.push({ message: 'The file has a header but no data rows.' })

  // Cross-row checks would only echo the row errors above (a rejected row looks like a
  // missing period), so they run only once every row is individually valid.
  if (errors.length > 0) return withCap(errors)

  const byLowerCase = new Map<string, string>()
  for (const name of groups.keys()) {
    const other = byLowerCase.get(name.toLowerCase())
    if (other) errors.push({ message: `Groups ${quote(other)} and ${quote(name)} differ only in capitalization. Use one spelling.` })
    else byLowerCase.set(name.toLowerCase(), name)
  }

  for (const entry of groups.values()) {
    for (const period of PERIODS) {
      if (!entry[period]) {
        const other = period === 'previous' ? 'current' : 'previous'
        errors.push({ message: `${quote(entry.name)} has a ${quote(other)} row but no ${quote(period)} row. Every group needs both periods.` })
      }
    }
  }

  if (errors.length === 0 && groups.size < MIN_GROUPS) {
    errors.push({ message: `The file has ${groups.size} group. Add at least ${MIN_GROUPS} groups so there is something beneath the headline.` })
  }
  if (groups.size > MAX_GROUPS) {
    errors.push({ message: `The file has ${groups.size} groups. Up to ${MAX_GROUPS} are supported.` })
  }

  if (errors.length > 0) return withCap(errors)

  const datasetGroups: DatasetGroup[] = [...groups.values()].map((g) => ({
    name: g.name,
    previous: { successes: g.previous!.successes, total: g.previous!.total },
    current: { successes: g.current!.successes, total: g.current!.total },
  }))
  return { ok: true, dataset: { groups: datasetGroups } }
}
