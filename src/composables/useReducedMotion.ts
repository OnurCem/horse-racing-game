import type { Ref } from 'vue'

import { useMatchMedia } from './useMatchMedia'

export function useReducedMotion(): Ref<boolean> {
  return useMatchMedia('(prefers-reduced-motion: reduce)')
}
