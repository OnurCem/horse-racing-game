import { onMounted, onUnmounted, ref, type Ref } from 'vue'

function readMatches(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia(query).matches
}

export function useMatchMedia(query: string): Ref<boolean> {
  const matches = ref(readMatches(query))

  let media: MediaQueryList | null = null

  const sync = (): void => {
    matches.value = media?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    media = window.matchMedia(query)
    sync()
    media.addEventListener('change', sync)
  })

  onUnmounted(() => {
    media?.removeEventListener('change', sync)
  })

  return matches
}
