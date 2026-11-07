/** Viewport for {@link HORSE_SILHOUETTE_PATH}; matches the 32 × 22 px render size. */
export const HORSE_SILHOUETTE_VIEWBOX = '0 0 64 44'

/**
 * Galloping horse silhouette drawn for this project, facing the finish line
 * (right): arched neck and head, both forelegs reaching forward, both hind
 * legs stretched back, and a streaming tail. One closed path so it can be
 * tinted with a single fill and outlined with a single stroke.
 */
export const HORSE_SILHOUETTE_PATH = [
  // Back, neck crest, ear, and head down to the muzzle
  'M40 14 C43 12 45 8 48 4 L49 1 L51 3.5 C54 4 57 7 60 10 C62 11.5 61.5 14 59 14',
  // Jaw, throat, and chest
  'C56 13.5 53 12 51 11.5 C50 14 49 17 48 20 C48.5 22 48 24 47 25',
  // Leading foreleg, then the second foreleg
  'L55 29 L61 30 L62 32.8 L59.5 33.4 L53.5 32.5 L45 28.5',
  'L50 35.5 L51.5 38.5 L48.5 39 L46.5 36 L42 29.5',
  // Belly, then both hind legs
  'C37 30.5 28 30.5 23 28 L18 33.5 L11 38 L9 37 L9.5 35.6 L15 31.5 L16 28.5',
  'L10 30.5 L3.5 31.5 L2.5 30 L3 28.7 L9 27.5 L14 24',
  // Tail and rump back to the withers
  'C10 23 6 24 1 27 C3 21 8 17 13 16 C20 13 32 14 40 14 Z',
].join(' ')
