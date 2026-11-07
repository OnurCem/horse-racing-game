/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "1" at build time to enable `?seed=` / `?test=1` browser test hooks. */
  readonly VITE_ENABLE_TEST_HOOKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
