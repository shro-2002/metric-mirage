import Papa from 'papaparse'

import { validateRows, type ValidationResult } from './validate'

export const MAX_FILE_BYTES = 1024 * 1024

/** CSV text → validated dataset or errors. PapaParse only tokenizes (quotes, delimiters, line endings). */
export const parseCsvText = (text: string): ValidationResult => {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ''), { header: false, skipEmptyLines: false })
  const quoteError = result.errors.find((e) => e.type === 'Quotes')
  if (quoteError) {
    const row = (quoteError.row ?? 0) + 1
    return { ok: false, errors: [{ row, message: `Row ${row}: a quoted value is not closed. Check for a stray quotation mark.` }] }
  }
  return validateRows(result.data)
}

export const readCsvFile = async (file: File): Promise<ValidationResult> => {
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, errors: [{ message: 'This file is larger than 1 MB. Metric Mirage expects a small summary table (up to 50 groups).' }] }
  }
  return parseCsvText(await file.text())
}
