import { expect, test } from '@playwright/test'

import { fastForwardOneResult } from './race-helpers'
import { FIXTURE_SEED, fixtureQuery } from './fixtures'

test.describe('horse racing flows', () => {
  test('loads a roster of 20 horses', async ({ page }) => {
    await page.goto(`/${fixtureQuery(false)}`)
    await expect(page.getByRole('heading', { name: 'Horse Racing', level: 1 })).toBeVisible()
    const rows = page.locator('.roster-table tbody tr')
    await expect(rows).toHaveCount(20)
  })

  test('generates, runs, pauses movement, and resumes', async ({ page }) => {
    await page.goto(`/${fixtureQuery(false)}`)
    await page.getByRole('button', { name: 'Generate' }).click()
    await expect(page.getByRole('heading', { name: /Round 1 of 6/ })).toBeVisible()

    await page.getByRole('button', { name: 'Start' }).click()
    const horse = page.locator('.lane-horse').first()
    await expect(horse).toBeVisible({ timeout: 15_000 })
    const progressTransform = async (): Promise<string> =>
      horse.evaluate((node) => getComputedStyle(node).transform)

    await expect.poll(progressTransform).not.toBe('none')

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByRole('heading', { name: /Paused/ })).toBeVisible()
    const pausedTransform = await progressTransform()
    await page.waitForTimeout(500)
    await expect(horse).toHaveCSS('transform', pausedTransform)

    await page.getByRole('button', { name: 'Resume' }).click()
    await expect.poll(progressTransform).not.toBe(pausedTransform)
  })

  test('appends one result per round and finishes with six groups', async ({ page }) => {
    await page.goto(`/${fixtureQuery(true)}`)
    await page.getByRole('button', { name: 'Generate' }).click()
    await page.getByRole('button', { name: 'Start' }).click()

    for (let round = 1; round <= 6; round += 1) {
      await fastForwardOneResult(page)
      await expect(page.locator('.result-group')).toHaveCount(round)
      await expect(page.locator('.results-table tbody tr')).toHaveCount(10)
    }

    await expect(page.getByRole('heading', { name: 'Race complete' })).toBeVisible()
    await page.getByRole('button', { name: 'Generate' }).click()
    await expect(page.getByText('Results appear after each round')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled()
  })

  test('generate while paused discards the in-progress game', async ({ page }) => {
    await page.goto(`/${fixtureQuery(true)}`)
    await page.getByRole('button', { name: 'Generate' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await page.evaluate(() => window.__HORSE_RACING_TEST__?.advanceTime(500))
    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByRole('heading', { name: /Paused/ })).toBeVisible()

    await page.getByRole('button', { name: 'Generate' }).click()
    await expect(page.getByRole('heading', { name: /^Round 1 of 6/ })).toBeVisible()
    await expect(page.getByText('Results appear after each round')).toBeVisible()
  })

  test('mobile panels expand and the track fits the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${fixtureQuery(true)}`)
    await page.getByRole('button', { name: 'Generate' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await fastForwardOneResult(page)

    await page.getByRole('button', { name: /Schedule · 6 rounds/ }).click()
    await page.getByRole('button', { name: /Horse roster · 20/ }).click()
    await page.getByRole('button', { name: 'Show all 10' }).click()

    const controls = page.locator('.race-controls')
    const track = page.locator('.race-track')
    const controlsBox = await controls.boundingBox()
    const trackBox = await track.boundingBox()
    expect(controlsBox).not.toBeNull()
    expect(trackBox).not.toBeNull()

    const bottom = (trackBox?.y ?? 0) + (trackBox?.height ?? 0)
    expect(bottom).toBeLessThanOrEqual(844)
  })

  test('uses the fixture seed in the query string', () => {
    expect(fixtureQuery(true)).toContain(String(FIXTURE_SEED))
  })
})
