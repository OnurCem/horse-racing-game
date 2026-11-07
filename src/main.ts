import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { useGameStore } from './stores/game'
import { readBrowserTestConfig } from './testSupport/browserTestConfig'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// The roster is created once per page load, before the first render.
const testConfig = readBrowserTestConfig()
useGameStore(pinia).initialize({
  random: testConfig?.random,
  timeSource: testConfig?.timeSource,
})

app.mount('#app')
