import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useReducedMotion(): Ref<boolean> {
  const prefersReducedMotion = ref(false)

  let media: MediaQueryList | null = null

  const sync = (): void => {
    prefersReducedMotion.value = media?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    sync()
    media.addEventListener('change', sync)
  })

  onUnmounted(() => {
    media?.removeEventListener('change', sync)
  })

  return prefersReducedMotion
}
