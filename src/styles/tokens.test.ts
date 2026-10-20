import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

// WCAG 2.x relative luminance and contrast ratio, computed from the real token file.
const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')
const token = (name: string): string => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match?.[1]) throw new Error(`token --${name} not found`)
  return match[1]
}
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('color tokens meet WCAG AA for the pairings the page uses', () => {
  test.each([
    ['ink', 'paper'],
    ['ink', 'paper-deep'],
    ['muted', 'paper'],
    ['muted', 'paper-deep'],
    ['improve', 'paper'],
    ['improve', 'paper-deep'],
    ['decline', 'paper'],
    ['decline', 'paper-deep'],
    ['composition', 'paper'],
    ['composition', 'paper-deep'],
    ['improve-strong', 'improve-wash'],
    ['decline-strong', 'decline-wash'],
    ['paper', 'ink'],
    ['paper', 'composition'],
  ])('%s on %s ≥ 4.5:1', (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5)
  })
})
