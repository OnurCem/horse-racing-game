import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base,
})
