import { expect, test } from '@playwright/test'

test('no console errors or failed requests across the full journey', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => problems.push(`failed: ${r.url()} ${r.failure()?.errorText}`))
  page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url()}`))

  await page.goto('./')
  await page.getByRole('button', { name: 'Look beneath the headline' }).click()
  await expect(page.getByTestId('finding')).toBeVisible()
  const sample = await (await page.request.get('./sample-consistent.csv')).text()
  await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'sample.csv', mimeType: 'text/csv', buffer: Buffer.from(sample) })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Success rates are up/)
  await page.evaluate(() => document.fonts.ready)
  expect(problems).toEqual([])
})
