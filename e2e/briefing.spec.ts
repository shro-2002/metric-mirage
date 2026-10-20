import { expect, test } from '@playwright/test'

test('Copy briefing puts the exact on-screen briefing on the clipboard', async ({ browser }) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByRole('button', { name: 'Look beneath the headline' }).click()

  const shown = (await page.getByTestId('briefing').locator('p, li').allTextContents()).join(' ')
  expect(shown).toContain('the overall pass rate rose from 62.5% to 66.5% (+4.0 percentage points)')

  await page.getByRole('button', { name: 'Copy briefing' }).click()
  await expect(page.getByText(/^Copied\./)).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toBe(shown)
  await context.close()
})
