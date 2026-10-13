import { computed } from 'vue'
import { useRoute } from 'vue-router'

// Internal site paths only: protection against open redirects (?redirect=//evil.com)
export function useRedirectTarget() {
  const route = useRoute()

  return computed(() => {
    const r = route.query.redirect
    const safe = typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\')
    return safe ? r : '/'
  })
}