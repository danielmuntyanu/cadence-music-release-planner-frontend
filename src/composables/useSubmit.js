import { ref } from 'vue'

const DEFAULT_ERROR = 'Something went wrong. Try again.'

/**
 * Shared submit state for forms: loading / error / success.
 *
 * const { loading, error, success, submit } = useSubmit({ errorMessages: { 401: '...' } })
 * const ok = await submit(() => auth.login(credentials))
 *
 * @param {Object} [options]
 * @param {Record<number, string>} [options.errorMessages] error text by HTTP status
 * @param {string} [options.defaultError] error text for any other failure
 */
export function useSubmit({ errorMessages = {}, defaultError = DEFAULT_ERROR } = {}) {
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)

  /**
   * Runs the action. Resolves to true on success, and to false on failure
   * or when a previous submission is still in progress (double-click guard).
   * @param {() => Promise<unknown>} action
   * @returns {Promise<boolean>}
   */
  async function submit(action) {
    if (loading.value) return false

    loading.value = true
    error.value = null
    success.value = false

    try {
      await action()
      success.value = true
      return true
    } catch (e) {
      const status = e.response?.status
      // Expected API errors are shown to the user; anything else is also logged
      if (!(status in errorMessages)) console.error('### submit failed:\n', e)
      error.value = errorMessages[status] ?? defaultError
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, success, submit }
}