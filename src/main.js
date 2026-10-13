import { createApp } from 'vue'
import { createPinia } from 'pinia'

import vuetify from './plugins/vuetify'
import './styles/tailwind.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

import { setSessionExpiredHandler } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

setSessionExpiredHandler(() => {
  // A guest's first /auth/me also ends up here, so only react if a user was signed in
  if (!auth.isAuthenticated) return
  auth.user = null
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
})

app.mount('#app')