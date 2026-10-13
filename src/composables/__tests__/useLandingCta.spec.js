import { describe, it, expect } from 'vitest'
import { useLandingCta } from '@/composables/useLandingCta'
import { useAuthStore } from '@/stores/auth'

describe('useLandingCta', () => {
  it('points guests to registration', () => {
    const cta = useLandingCta()

    expect(cta.value).toEqual({
      to: '/register',
      text: 'Create your release plan',
    })
  })

  it('points authenticated users to the dashboard', () => {
    const auth = useAuthStore()
    auth.user = { id: 1, username: 'daniel', roles: ['USER'] }

    const cta = useLandingCta()

    expect(cta.value).toEqual({ to: '/dashboard', text: 'Open dashboard' })
  })

  it('reacts when the authentication state changes', () => {
    const auth = useAuthStore()
    const cta = useLandingCta()
    expect(cta.value.to).toBe('/register')

    auth.user = { id: 1, username: 'daniel', roles: ['USER'] }
    expect(cta.value.to).toBe('/dashboard')

    auth.user = null
    expect(cta.value.to).toBe('/register')
  })
})