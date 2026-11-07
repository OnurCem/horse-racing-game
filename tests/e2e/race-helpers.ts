import type { Page } from '@playwright/test'

export async function fastForwardToComplete(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__HORSE_RACING_TEST__ !== undefined)
  await page.evaluate(() => {
    const api = window.__HORSE_RACING_TEST__
    if (!api) {
      throw new Error('Test API missing')
    }
    let guard = 0
    while (api.getStore().status !== 'complete' && guard < 200_000) {
      api.advanceTime(50)
      guard += 1
    }
    if (api.getStore().status !== 'complete') {
      throw new Error('Race did not complete')
    }
  })
}

export async function fastForwardOneResult(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__HORSE_RACING_TEST__ !== undefined)
  await page.evaluate(() => {
    const api = window.__HORSE_RACING_TEST__!
    const store = api.getStore()
    const initial = store.results.length
    let guard = 0
    while (store.results.length === initial && guard < 50_000) {
      api.advanceTime(25)
      guard += 1
    }
    if (store.results.length !== initial + 1) {
      throw new Error('Expected one new round result')
    }
  })
}
