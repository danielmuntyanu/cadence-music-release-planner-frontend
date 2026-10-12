import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubmit } from '../useSubmit'

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('useSubmit', () => {
  let consoleError

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('starts idle with no error', () => {
    const { loading, error, success } = useSubmit()

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(success.value).toBe(false)
  })

  describe('success', () => {
    it('resolves to true and sets success', async () => {
      const { submit, error, success } = useSubmit()

      const ok = await submit(vi.fn().mockResolvedValue())

      expect(ok).toBe(true)
      expect(success.value).toBe(true)
      expect(error.value).toBeNull()
    })

    it('keeps loading on while the request is pending and turns it off afterwards', async () => {
      const { submit, loading } = useSubmit()
      let finish
      const pending = submit(() => new Promise((resolve) => (finish = resolve)))

      expect(loading.value).toBe(true)

      finish()
      await pending
      expect(loading.value).toBe(false)
    })
  })

  describe('errors', () => {
    it('resolves to false and uses the message mapped to the status', async () => {
      const { submit, error, success } = useSubmit({ errorMessages: { 401: 'Wrong password' } })

      const ok = await submit(() => Promise.reject(httpError(401)))

      expect(ok).toBe(false)
      expect(error.value).toBe('Wrong password')
      expect(success.value).toBe(false)
    })

    it('falls back to the default message for an unmapped status', async () => {
      const { submit, error } = useSubmit({ errorMessages: { 401: 'Wrong password' } })

      await submit(() => Promise.reject(httpError(500)))

      expect(error.value).toBe('Something went wrong. Try again.')
    })

    it('uses a custom defaultError', async () => {
      const { submit, error } = useSubmit({ defaultError: 'Could not delete the account' })

      await submit(() => Promise.reject(httpError(500)))

      expect(error.value).toBe('Could not delete the account')
    })

    it('uses the default message when there is no server response (network error, code bug)', async () => {
      const { submit, error } = useSubmit()

      await submit(() => Promise.reject(new TypeError('boom')))

      expect(error.value).toBe('Something went wrong. Try again.')
    })

    it('turns loading off after a failure', async () => {
      const { submit, loading } = useSubmit()

      await submit(() => Promise.reject(httpError(500)))

      expect(loading.value).toBe(false)
    })
  })

  describe('logging', () => {
    it('does not log expected API errors', async () => {
      const { submit } = useSubmit({ errorMessages: { 409: 'Taken' } })

      await submit(() => Promise.reject(httpError(409)))

      expect(consoleError).not.toHaveBeenCalled()
    })

    it('logs unexpected errors to the console', async () => {
      const { submit } = useSubmit({ errorMessages: { 409: 'Taken' } })
      const failure = httpError(500)

      await submit(() => Promise.reject(failure))

      expect(consoleError).toHaveBeenCalledWith('### submit failed:\n', failure)
    })
  })

  describe('repeated submissions', () => {
    it('clears the previous error and success when a new submission starts', async () => {
      const { submit, error, success } = useSubmit()

      await submit(() => Promise.reject(httpError(500)))
      expect(error.value).not.toBeNull()

      await submit(() => Promise.resolve())
      expect(error.value).toBeNull()
      expect(success.value).toBe(true)

      let finish
      const pending = submit(() => new Promise((resolve) => (finish = resolve)))
      expect(success.value).toBe(false) // cleared as soon as the submission starts
      finish()
      await pending
    })

    it('ignores a call while the previous one is still running', async () => {
      const { submit } = useSubmit()
      let finish
      const action = vi.fn(() => new Promise((resolve) => (finish = resolve)))
      const first = submit(action)

      const second = await submit(action)

      expect(second).toBe(false)
      expect(action).toHaveBeenCalledOnce()

      finish()
      await expect(first).resolves.toBe(true)
    })

    it('allows submitting again once the previous submission has finished', async () => {
      const { submit } = useSubmit()
      const action = vi.fn().mockResolvedValue()

      await submit(action)
      await submit(action)

      expect(action).toHaveBeenCalledTimes(2)
    })
  })
})