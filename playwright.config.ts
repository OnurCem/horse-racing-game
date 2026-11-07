import { defineConfig, devices } from '@playwright/test'

const repoBase = process.env.VITE_BASE ?? '/'
const normalizedBase =
  repoBase === '/' ? '' : repoBase.endsWith('/') ? repoBase.slice(0, -1) : repoBase
const previewPort = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
const baseURL = `http://127.0.0.1:${previewPort}${normalizedBase}`

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  snapshotPathTemplate:
    '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'e2e',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual-desktop',
      testDir: 'tests/visual',
      grep: /@desktop/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1100, height: 900 },
      },
    },
    {
      name: 'visual-mobile',
      testDir: 'tests/visual',
      grep: /@mobile/,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${previewPort}`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      VITE_BASE: repoBase,
    },
  },
})
