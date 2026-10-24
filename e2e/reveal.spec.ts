import { expect, test } from '@playwright/test'

test('headline → reveal: sites, finding and decomposition', async ({ page }, testInfo) => {
  await page.goto('./')
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
  // The discovery leads: the finding sits in the upper part of the viewport, not below the hero.
  const findingTop = (await page.getByTestId('finding').boundingBox())!.y
  expect(findingTop).toBeLessThan(page.viewportSize()!.height * 0.3)
  expect(findingTop).toBeGreaterThan(0)
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-2a-reveal-first-view.png` })
  await page.screenshot({ path: `test-results/screens/${testInfo.project.name}-2-revealed.png`, fullPage: true })

  // Composition wording describes changing shares, never students moving.
  await expect(page.getByTestId('two-forces')).toContainText('North, the higher-performing site, accounted for a larger share of students, up from 25.0% to 40.0%')
  await expect(page.getByText('How the distribution of students changed across sites')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/ended up at|moved between|the stronger site/)

  // Collapsing keeps focus on the toggle, which remains in place.
  const toggle = page.getByRole('button', { name: 'Hide the investigation' })
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Look beneath the headline' })).toBeFocused()
  await expect(page.getByTestId('finding')).toHaveCount(0)
})

test('reduced motion: everything is visible immediately', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('./')
  await page.getByRole('button', { name: 'Look beneath the headline' }).click()
  const opacity = await page.getByTestId('finding').evaluate((el) => getComputedStyle(el.parentElement!).opacity)
  expect(opacity).toBe('1')
  await context.close()
})
