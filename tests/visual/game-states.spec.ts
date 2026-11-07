import { expect, test } from '@playwright/test'

import { fastForwardToComplete } from '../e2e/race-helpers'
import { fixtureQuery } from '../e2e/fixtures'

async function prepareInitial(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/${fixtureQuery(true)}`)
  await expect(page.getByRole('heading', { name: 'Horse Racing', level: 1 })).toBeVisible()
  await expect(page.getByText('Generate a schedule to begin')).toBeVisible()
}

async function prepareReady(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/${fixtureQuery(true)}`)
  await page.getByRole('button', { name: 'Generate' }).click()
  await expect(page.getByRole('heading', { name: /Round 1 of 6/ })).toBeVisible()
}

async function preparePausedMidRace(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/${fixtureQuery(true)}`)
  await page.getByRole('button', { name: 'Generate' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.waitForFunction(() => window.__HORSE_RACING_TEST__ !== undefined)
  await page.evaluate(() => {
    window.__HORSE_RACING_TEST__?.advanceTime(2_400)
  })
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.getByRole('heading', { name: /Paused/ })).toBeVisible()
}

async function prepareComplete(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/${fixtureQuery(true)}`)
  await page.getByRole('button', { name: 'Generate' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await fastForwardToComplete(page)
  await expect(page.getByRole('heading', { name: 'Race complete' })).toBeVisible()
}

const states = [
  { id: 'initial', prepare: prepareInitial },
  { id: 'ready', prepare: prepareReady },
  { id: 'paused-mid-race', prepare: preparePausedMidRace },
  { id: 'complete', prepare: prepareComplete },
] as const

for (const state of states) {
  test(`desktop screenshot · ${state.id} @desktop`, async ({ page }) => {
    await state.prepare(page)
    await expect(page).toHaveScreenshot(`${state.id}-desktop.png`, { fullPage: true })
  })

  test(`mobile screenshot · ${state.id} @mobile`, async ({ page }) => {
    await state.prepare(page)
    if (state.id === 'complete') {
      await page.getByRole('button', { name: 'Show all 10' }).click()
    }
    await expect(page).toHaveScreenshot(`${state.id}-mobile.png`, { fullPage: true })
  })
}
