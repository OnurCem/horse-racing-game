/** Formats milliseconds as `m:ss.cc` (minutes, seconds, hundredths). */
export function formatRaceTime(ms: number): string {
  const totalHundredths = Math.floor(Math.max(0, ms) / 10)
  const minutes = Math.floor(totalHundredths / 6000)
  const seconds = Math.floor(totalHundredths / 100) % 60
  const hundredths = totalHundredths % 100
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

/**
 * The five digits of `m:ss.cc` as numbers: minutes (last digit), seconds tens,
 * seconds ones, hundredths tens, hundredths ones. Rounds down like
 * {@link formatRaceTime}.
 */
export function raceTimeDigits(ms: number): [number, number, number, number, number] {
  const totalHundredths = Math.floor(Math.max(0, ms) / 10)
  const minutes = Math.floor(totalHundredths / 6000)
  const seconds = Math.floor(totalHundredths / 100) % 60
  const hundredths = totalHundredths % 100
  return [
    minutes % 10,
    Math.floor(seconds / 10),
    seconds % 10,
    Math.floor(hundredths / 10),
    hundredths % 10,
  ]
}
