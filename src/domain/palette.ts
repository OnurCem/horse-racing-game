/** Named track colors (stable labels); hex values from the implementation plan. */
export interface NamedColor {
  readonly name: string
  readonly hex: string
}

export const HORSE_PALETTE: readonly NamedColor[] = [
  { name: 'Red', hex: '#D62828' },
  { name: 'Blue', hex: '#1F5FE0' },
  { name: 'Green', hex: '#2E9E3F' },
  { name: 'Yellow', hex: '#E9C31B' },
  { name: 'Purple', hex: '#7B2CBF' },
  { name: 'Orange', hex: '#F47C00' },
  { name: 'Pink', hex: '#E0217A' },
  { name: 'Teal', hex: '#0FA3A0' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Brown', hex: '#8B4A1F' },
  { name: 'Lime', hex: '#8CC63F' },
  { name: 'Sky', hex: '#47B8F0' },
  { name: 'Maroon', hex: '#7A1E2C' },
  { name: 'Lavender', hex: '#B49BE0' },
  { name: 'Gray', hex: '#8A8F98' },
  { name: 'Olive', hex: '#6E7B1E' },
  { name: 'Coral', hex: '#FF7B6B' },
  { name: 'Tan', hex: '#C8A165' },
  { name: 'Mint', hex: '#6FDDB0' },
  { name: 'Black', hex: '#111111' },
] as const
