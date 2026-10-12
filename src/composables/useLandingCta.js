import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Primary call to action: sign up for guests, open the dashboard for signed-in users
export function useLandingCta() {
  const auth = useAuthStore()

  return computed(() =>
    auth.isAuthenticated
      ? { to: '/dashboard', text: 'Open dashboard' }
      : { to: '/register', text: 'Create your release plan' },
  )
}