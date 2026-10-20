import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const scan = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

test('axe: no WCAG A/AA violations on the first screen, after the reveal, and with upload errors', async ({ page }) => {
  await page.goto('/')
  expect(await scan(page)).toEqual([])

  await page.getByRole('button', { name: 'Look beneath the headline' }).click()
  await page.waitForTimeout(1200)
  expect(await scan(page)).toEqual([])

  await page.getByLabel('Choose a CSV file').setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('period,group,successes,total\nPrevious,A,1,2\n'),
  })
  await expect(page.getByRole('alert')).toBeVisible()
  expect(await scan(page)).toEqual([])
})

test('keyboard only: reveal, copy, collapse, reach the upload control', async ({ browser }) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  await page.goto('/')

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Look beneath the headline' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 2, name: 'Beneath the headline' })).toBeFocused()

  // From the investigation heading, Tab reaches the copy button next.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Copy briefing' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/^Copied\./)).toBeVisible()

  // Then the format help's downloads, then the file input, in reading order.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Download the template' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Download a second sample' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Choose a CSV file')).toBeFocused()

  await page.getByRole('button', { name: 'Hide the investigation' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Look beneath the headline' })).toBeFocused()
  await context.close()
})

test('focus indicator is visible on the primary button', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const outline = await page
    .getByRole('button', { name: 'Look beneath the headline' })
    .evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth)
  expect(outline).toBe('solid 3px')
})
