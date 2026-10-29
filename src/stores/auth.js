import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'
import { ROLES } from '@/constants/roles'
import { useArtistsStore } from './artists'
import { useReleasesStore } from './releases'
import { usePlayerStore } from './player'

export const useAuthStore = defineStore('auth', () => {
  const artists = useArtistsStore()
  const releases = useReleasesStore()
  const player = usePlayerStore()

  /** @type {import('@/models/user').User | null} */
  const user = ref(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  const roles = computed(() => (Array.isArray(user.value?.roles) ? user.value.roles : []))
  const isAdmin = computed(() => roles.value.includes(ROLES.ADMIN))

  let initPromise = null

  function init() {
    initPromise ??= fetchMe()
    return initPromise
  }

  async function fetchMe() {
    try {
      const data = await authService.me()
      user.value = data
    } catch (e) {
      user.value = null
      if (![401, 403].includes(e.response?.status)) console.error('### auth/me failed:\n', e)
    } finally {
      ready.value = true
    }
  }

  async function login(credentials) {
    const data = await authService.login(credentials)
    user.value = data
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      user.value = null
      // Private audio must not keep playing for whoever uses the browser next
      player.stop()
      artists.reset()
      releases.reset()
    }
  }

  async function register(payload) {
    await authService.register(payload)
    
    await login({ username: payload.username, password: payload.password })
  }

  function hasRole(role) {
    return roles.value.includes(role)
  }

  function hasAnyRole(required) {
    return Array.isArray(required) && required.some((role) => hasRole(role))
  }

  /** Replaces the current user with fresh data from a response (e.g. after an avatar change) */
  function setUser(value) {
    user.value = value
  }

  return { user, ready, isAuthenticated, roles, isAdmin, init, fetchMe, login, logout, hasRole, hasAnyRole, register, setUser }
})