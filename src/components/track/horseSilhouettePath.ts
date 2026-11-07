/** Viewport for {@link HORSE_SILHOUETTE_PATH}; matches the 32 × 22 px render size. */
export const HORSE_SILHOUETTE_VIEWBOX = '0 0 64 44'

/**
 * Galloping horse silhouette drawn for this project, facing the finish line
 * (right): maned, arched neck, long head, slim legs in an extended stride,
 * and a flowing tail. One closed path so it can be tinted with a single fill
 * and outlined with a single stroke.
 */
export const HORSE_SILHOUETTE_PATH = [
  // Withers and mane up the neck crest to the ear
  'M40 12.5 L41.2 10.2 L42.4 10.6 L43.2 8 L44.5 8.3 L45.2 5.6 L46.6 5.8 L47.4 3.2 L48.6 1 L49.6 2.6',
  // Long head down to the muzzle, jaw, throat, and chest
  'C53 3 56.5 5.5 59.5 8 L62.3 10.3 C63.2 11.2 62.6 12.6 61.2 12.6 L58 12.2',
  'C55.5 11.4 53.8 10 52.4 9.6 C51 11.5 49.6 14 48.6 16.5 C48 18.5 47.4 20.5 46.8 22',
  // Leading foreleg reaching forward, then the supporting foreleg
  'L53 26.4 L59 27.4 L62.4 29.6 L61.4 31 L58.4 29.8 L52.2 29 L45.6 25.4',
  'L47.4 31.4 L46.8 37.4 L48.8 40.2 L45.8 40.8 L44.6 37.4 L44.8 31.6 L42.2 25.2',
  // Belly, then both hind legs stretched back
  'C37 26.2 29 26 23.6 23.6 L22.4 27.6 L15.6 31.8 L9.6 36.4 L6.6 38.6 L5.4 37.2 L8.4 34.4',
  'L13.6 29.4 L18 25 L15.6 25.6 L10.4 27.6 L4.4 29.6 L2 29 L2.6 27.4 L8.4 25.4 L13 22.4',
  // Buttock, flowing tail, croup, and back to the withers
  'C12.6 19.6 12.6 17 13.4 14.8 C10.4 15.2 7 17.4 4.8 20.4 C4 21.6 2.8 22.4 1.6 22.4',
  'C2.6 20.4 3.2 18.6 5 16.4 C7.6 13.6 10.8 12.6 14.6 12.4 C18 11.4 22 11.6 26 12.2',
  'C31 13 36 13.4 40 12.5 Z',
].join(' ')
