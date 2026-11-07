export const FIXTURE_SEED = 42_024

export function fixtureQuery(manualClock = true): string {
  const params = new URLSearchParams()
  params.set('seed', String(FIXTURE_SEED))
  if (manualClock) {
    params.set('test', '1')
  }
  return `?${params.toString()}`
}
