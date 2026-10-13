import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

// A 401 or 403 from these endpoints is final: refreshing cannot help (or would loop)
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout']

let refreshPromise = null
let sessionExpiredHandler = null

/**
 * Registers a callback that runs when the session cannot be refreshed
 * (e.g. the refresh token has expired). Pass null to unregister.
 * @param {(() => void) | null} handler
 */
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler
}

// Parallel 401s share a single refresh request
function refreshSession() {
  refreshPromise ??= api
    .post('/auth/refresh')
    .catch((error) => {
      sessionExpiredHandler?.()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

function shouldRefresh(error) {
  const { response, config } = error
  if (response?.status !== 401 || response?.status !== 403 || !config || config._retry) return false

  const path = (config.url ?? '').split('?')[0]
  return !NO_REFRESH_PATHS.includes(path)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!shouldRefresh(error)) throw error

    error.config._retry = true // each request is retried at most once

    try {
      await refreshSession()
    } catch {
      throw error // surface the original 401 to the caller
    }
    return api(error.config)
  },
)

export default api