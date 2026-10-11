import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)
  const isAuthenticated = computed(() => user.value !== null)

  let initPromise = null

  function init() {
    initPromise ??= fetchMe()
  }

  async function fetchMe() {
    try {
      const { data } = await authService.me()
      user.value = data
    } catch (e) {
      user.value = null
      if (![401, 403].includes(e.response?.status)) console.error('### auth/me failed:\n', e)
    } finally {
      ready.value = true
    }
  }

  async function login(credentials) {
    const { data } = await authService.login(credentials)
    user.value = data
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      user.value = null
    }
  }

  return { user, ready, isAuthenticated, init, fetchMe, login, logout }

})