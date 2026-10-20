import { expect, test } from '@playwright/test'

test('upload the second sample, see an honest non-reversal result, then return to the example', async ({ page }, testInfo) => {
  await page.goto('/')
  const sample = await (await page.request.get('/sample-consistent.csv')).text()
  await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'sample-consistent.csv', mimeType: 'text/csv', buffer: Buffer.from(sample) })

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Success rates are up/)
  await expect(page.getByText('Your file: sample-consistent.csv')).toBeVisible()
  await page.getByRole('button', { name: 'Look beneath the headline' }).click()
  await expect(page.getByTestId('finding')).toContainText('point the same way')
  await expect(page.getByTestId('finding')).not.toContainText('So why')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-3-upload.png`, fullPage: true })

  await page.getByRole('button', { name: 'Return to the example' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pass rates are up 4 points.')
})

test('an invalid file explains exactly what to fix and changes nothing', async ({ page }, testInfo) => {
  await page.goto('/')
  const bad = 'period,group,successes,total\nPrevious,A,50,100\ncurrent,A,60,100\nprevious,B,120,100\ncurrent,B,1,2\n'
  await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'typo.csv', mimeType: 'text/csv', buffer: Buffer.from(bad) })

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Row 2: period is "Previous"')
  await expect(alert).toContainText('Row 4: successes (120) is greater than total (100).')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pass rates are up 4 points.')
  await alert.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-4-invalid.png`, fullPage: false })
})

test('template and sample downloads are served', async ({ page }) => {
  await page.goto('/')
  for (const name of ['metric-mirage-template.csv', 'sample-consistent.csv']) {
    const response = await page.request.get(`/${name}`)
    expect(response.ok()).toBe(true)
    expect(await response.text()).toMatch(/^period,group,successes,total\n/)
  }
})
