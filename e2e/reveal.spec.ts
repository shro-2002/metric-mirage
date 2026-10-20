import { expect, test } from '@playwright/test'

test('headline → reveal: sites, finding and decomposition', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pass rates are up 4 points.')
  await expect(page.getByTestId('finding')).toHaveCount(0)
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-1-headline.png`, fullPage: true })

  await page.getByRole('button', { name: 'Look beneath the headline' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Beneath the headline' })).toBeFocused()
  await expect(page.getByTestId('finding')).toHaveText('Every site declined⁠—even though the overall pass rate rose.')
  await expect(page.getByTestId('equation')).toContainText('−2.0 + 6.0 = +4.0')
  await expect(page.getByRole('row')).toHaveCount(5)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)

  await page.waitForTimeout(1200) // let the smooth scroll and staged fade settle
  // What a viewer sees immediately after clicking: the finding and the comparison must be on screen.
  await expect(page.getByTestId('finding')).toBeInViewport()
  await expect(page.getByTestId('change-summary')).toBeInViewport({ ratio: 0.9 })
  if (testInfo.project.name === 'desktop') await expect(page.locator('#headline-figures')).toBeInViewport()
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-2a-reveal-first-view.png` })
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-2-revealed.png`, fullPage: true })
})

test('reduced motion: everything is visible immediately', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByRole('button', { name: 'Look beneath the headline' }).click()
  const opacity = await page.getByTestId('finding').evaluate((el) => getComputedStyle(el.parentElement!).opacity)
  expect(opacity).toBe('1')
  await context.close()
})
