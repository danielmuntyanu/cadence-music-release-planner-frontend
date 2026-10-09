import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'

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
      const { data } = await authApi.me()
      user.value = data
    } catch (e) {
      user.value = null
      if (e.response?.status !== 401) console.error('auth/me failed', e)
    } finally {
      ready.value = true
    }
  }

  async function login(credentials) {
    const { data } = await authApi.login(credentials)
    user.value = data
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      user.value = null
    }
  }

  return { user, ready, isAuthenticated, init, fetchMe, login, logout }

})