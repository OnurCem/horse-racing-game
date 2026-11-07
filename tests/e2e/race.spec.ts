import { expect, test } from '@playwright/test'

import { fastForwardOneResult } from './race-helpers'
import { fixtureQuery } from './fixtures'

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

  test('fits the heading, controls, and track on a 390 × 844 phone while racing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${fixtureQuery(true)}`)
    await page.getByRole('button', { name: 'Generate' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await page.evaluate(() => window.__HORSE_RACING_TEST__?.advanceTime(1_000))

    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    const heading = await page.getByRole('heading', { name: /^Round 1 of 6/ }).boundingBox()
    const pause = await page.getByRole('button', { name: 'Pause' }).boundingBox()
    const track = await page.locator('.race-track').boundingBox()
    expect(heading).not.toBeNull()
    expect(pause).not.toBeNull()
    expect(track).not.toBeNull()

    expect(heading!.y).toBeGreaterThanOrEqual(0)
    expect(pause!.y + pause!.height).toBeLessThanOrEqual(track!.y)
    expect(track!.y + track!.height).toBeLessThanOrEqual(844)
    expect(track!.x + track!.width).toBeLessThanOrEqual(390)
  })

  test('keeps the track inside a 320 px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(`/${fixtureQuery(true)}`)
    await page.getByRole('button', { name: 'Generate' }).click()

    const track = await page.locator('.race-track').boundingBox()
    const finish = await page.locator('.finish-line').boundingBox()
    expect(track!.x).toBeGreaterThanOrEqual(0)
    expect(track!.x + track!.width).toBeLessThanOrEqual(320)
    expect(finish!.x + finish!.width).toBeLessThanOrEqual(320)
    await expect(page.locator('.lane-label').first()).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  })

  test('expands the mobile schedule, roster, and full results', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${fixtureQuery(true)}`)
    await page.getByRole('button', { name: 'Generate' }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await fastForwardOneResult(page)

    const schedule = page.getByRole('button', { name: /Schedule · 6 rounds/ })
    await expect(schedule).toHaveAttribute('aria-expanded', 'false')
    await schedule.click()
    await expect(schedule).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.schedule-row')).toHaveCount(6)
    await expect(page.locator('.schedule-row').first()).toBeVisible()

    const roster = page.getByRole('button', { name: /Horse roster · 20/ })
    await roster.click()
    await expect(roster).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.roster-table tbody tr').nth(19)).toBeAttached()
    await expect(page.locator('.roster-table tbody tr').first()).toBeVisible()

    const resultRows = page.locator('.results-table tbody tr')
    await expect(resultRows).toHaveCount(3)
    await page.getByRole('button', { name: 'Show all 10' }).click()
    await expect(resultRows).toHaveCount(10)

    const rowHeights = await resultRows.evaluateAll((rows) =>
      rows.map((row) => row.getBoundingClientRect().height),
    )
    for (const height of rowHeights) {
      expect(height).toBeGreaterThanOrEqual(44)
    }
  })

  test.describe('with reduced motion', () => {
    test('moves horses in discrete 10% steps', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/${fixtureQuery(true)}`)
      expect(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      ).toBe(true)
      await page.getByRole('button', { name: 'Generate' }).click()
      await page.getByRole('button', { name: 'Start' }).click()

      const ratios: number[] = []
      for (let step = 0; step < 8; step += 1) {
        await page.evaluate(() => window.__HORSE_RACING_TEST__?.advanceTime(330))
        ratios.push(
          ...(await page.locator('.lane-horse').evaluateAll((horses) =>
            horses.map((horse) => {
              const track = horse.parentElement as HTMLElement
              const travel = track.clientWidth - 32
              const x = new DOMMatrixReadOnly(getComputedStyle(horse).transform).m41
              return x / travel
            }),
          )),
        )
      }

      expect(ratios.some((ratio) => ratio > 0)).toBe(true)
      for (const ratio of ratios) {
        expect(Math.abs(ratio * 10 - Math.round(ratio * 10))).toBeLessThan(0.01)
      }
    })
  })
})
