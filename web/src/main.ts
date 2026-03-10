import { createApp } from 'vue'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './style.css'

const app = createApp(App)

// Apply dark theme by default
document.documentElement.classList.add('dark')

app.mount('#app')
