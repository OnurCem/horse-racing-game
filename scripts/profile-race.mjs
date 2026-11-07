// Profiles a running round in the production build at a phone viewport.
// Run through `npm run profile`, which builds and serves the app inside the
// pinned Playwright container first. Prints a JSON summary per CPU throttle rate.
import { chromium } from '@playwright/test'

const url = process.env.PROFILE_URL ?? 'http://127.0.0.1:4173/'
const rates = [1, 4, 6]
const raceMs = 4000

const browser = await chromium.launch()
const summary = { chromium: browser.version(), viewport: '390x844 @3x, touch', raceMs, runs: [] }

for (const rate of rates) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await page.goto(url)
  await cdp.send('Performance.enable')
  await cdp.send('Emulation.setCPUThrottlingRate', { rate })
  await page.getByRole('button', { name: 'Generate' }).click()

  // Sample every frame interval and any long animation frames (> 50 ms).
  await page.evaluate(() => {
    const probe = { frames: [], longFrames: 0, raf: 0, last: 0 }
    window.__profile = probe
    new PerformanceObserver((list) => {
      probe.longFrames += list.getEntries().length
    }).observe({ type: 'long-animation-frame' })
    const tick = (t) => {
      if (probe.last) probe.frames.push(t - probe.last)
      probe.last = t
      probe.raf = requestAnimationFrame(tick)
    }
    probe.raf = requestAnimationFrame(tick)
  })

  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    )
  const before = await metrics()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.waitForTimeout(raceMs)
  const after = await metrics()

  // Time from a click to the second frame after it, when the change is on screen.
  const clickToFrameMs = (label) =>
    page.evaluate(
      (text) =>
        new Promise((resolve) => {
          const button = [...document.querySelectorAll('button')].find(
            (b) => b.textContent.trim() === text,
          )
          const start = performance.now()
          button.click()
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve(performance.now() - start)),
          )
        }),
      label,
    )
  const positions = () =>
    page
      .locator('.lane-horse')
      .evaluateAll((horses) => horses.map((h) => getComputedStyle(h).transform).join('|'))

  const pauseMs = await clickToFrameMs('Pause')
  const pausedA = await positions()
  await page.waitForTimeout(600)
  const pausedB = await positions()
  const resumeMs = await clickToFrameMs('Resume')

  const probe = await page.evaluate(() => {
    const p = window.__profile
    cancelAnimationFrame(p.raf)
    return { frames: p.frames, longFrames: p.longFrames }
  })
  const frames = probe.frames.slice(5).sort((a, b) => a - b)
  const at = (q) => +frames[Math.min(frames.length - 1, Math.floor(q * frames.length))].toFixed(1)
  const delta = (name, scale = 1) => +((after[name] - before[name]) * scale).toFixed(1)

  summary.runs.push({
    cpuThrottle: `${rate}x`,
    framesSampled: frames.length,
    frameMs: { p50: at(0.5), p95: at(0.95), p99: at(0.99), max: at(1) },
    framesOver25ms: frames.filter((f) => f > 25).length,
    longAnimationFrames: probe.longFrames,
    layouts: delta('LayoutCount'),
    layoutMs: delta('LayoutDuration', 1000),
    styleRecalcs: delta('RecalcStyleCount'),
    pauseClickToFrameMs: +pauseMs.toFixed(1),
    resumeClickToFrameMs: +resumeMs.toFixed(1),
    frozenWhilePaused: pausedA === pausedB,
  })
  await context.close()
}

console.log(JSON.stringify(summary, null, 2))
await browser.close()
