import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api, { setSessionExpiredHandler } from '../api'

const originalAdapter = api.defaults.adapter

// Builds an axios-like result: resolves for 2xx, rejects with an AxiosError otherwise
function respond(config, status, data = {}) {
  const response = { data, status, statusText: '', headers: {}, config }
  if (status >= 200 && status < 300) return Promise.resolve(response)
  return Promise.reject(
    new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response),
  )
}

// Replaces the network layer with a fake server driven by `handler(config)`
function fakeServer(handler) {
  const adapter = vi.fn((config) => Promise.resolve(handler(config)).then((r) => r))
  api.defaults.adapter = adapter
  return adapter
}

const calls = (adapter) => adapter.mock.calls.map(([c]) => `${c.method.toUpperCase()} ${c.url}`)

describe('api instance', () => {
  let onExpired

  beforeEach(() => {
    onExpired = vi.fn()
    setSessionExpiredHandler(onExpired)
  })

  afterEach(() => {
    api.defaults.adapter = originalAdapter
    setSessionExpiredHandler(null)
  })

  describe('defaults', () => {
    it('sends cookies and the XSRF token', () => {
      expect(api.defaults.withCredentials).toBe(true)
      expect(api.defaults.withXSRFToken).toBe(true)
      expect(api.defaults.xsrfCookieName).toBe('XSRF-TOKEN')
      expect(api.defaults.xsrfHeaderName).toBe('X-XSRF-TOKEN')
    })

    it('has a 10 second timeout', () => {
      expect(api.defaults.timeout).toBe(10000)
    })
  })

  describe('successful requests', () => {
    it('passes responses through untouched', async () => {
      const adapter = fakeServer((config) => respond(config, 200, { ok: true }))

      const response = await api.get('/anything')

      expect(response.data).toEqual({ ok: true })
      expect(calls(adapter)).toEqual(['GET /anything'])
    })
  })

  describe('token refresh on 401', () => {
    it('refreshes the session and retries the original request', async () => {
      let meAttempts = 0
      const adapter = fakeServer((config) => {
        if (config.url === '/auth/refresh') return respond(config, 200)
        return respond(config, ++meAttempts === 1 ? 401 : 200, { id: 1 })
      })

      const response = await api.get('/auth/me')

      expect(response.data).toEqual({ id: 1 })
      expect(calls(adapter)).toEqual(['GET /auth/me', 'POST /auth/refresh', 'GET /auth/me'])
      expect(onExpired).not.toHaveBeenCalled()
    })

    it('retries with the same method, URL and body', async () => {
      let attempts = 0
      const adapter = fakeServer((config) => {
        if (config.url === '/auth/refresh') return respond(config, 200)
        return respond(config, ++attempts === 1 ? 401 : 200)
      })

      await api.patch('/users/me', { bio: 'Hello' })

      const [first, , retry] = adapter.mock.calls.map(([c]) => c)
      expect(retry.method).toBe(first.method)
      expect(retry.url).toBe(first.url)
      expect(JSON.parse(retry.data)).toEqual({ bio: 'Hello' })
    })

    it('retries only once: a second 401 is returned to the caller', async () => {
      let requests = 0
      const adapter = fakeServer((config) => {
        if (++requests > 5) throw new Error('retry loop') // fail fast instead of hanging
        return config.url === '/auth/refresh' ? respond(config, 200) : respond(config, 401)
      })

      await expect(api.get('/users/me')).rejects.toMatchObject({ response: { status: 401 } })

      expect(calls(adapter)).toEqual(['GET /users/me', 'POST /auth/refresh', 'GET /users/me'])
      expect(onExpired).not.toHaveBeenCalled()
    })

    it('rejects with the original 401 and notifies the handler when the refresh fails', async () => {
      const adapter = fakeServer((config) => respond(config, 401))

      await expect(api.get('/users/me')).rejects.toMatchObject({
        config: { url: '/users/me' },
        response: { status: 401 },
      })

      expect(calls(adapter)).toEqual(['GET /users/me', 'POST /auth/refresh'])
      expect(onExpired).toHaveBeenCalledOnce()
    })

    it('does not crash when no session-expired handler is registered', async () => {
      setSessionExpiredHandler(null)
      fakeServer((config) => respond(config, 401))

      await expect(api.get('/users/me')).rejects.toMatchObject({ response: { status: 401 } })
    })

    it('shares one refresh between parallel 401s and retries every request', async () => {
      const attempts = {}
      let finishRefresh
      const adapter = fakeServer((config) => {
        if (config.url === '/auth/refresh') {
          return new Promise((resolve) => (finishRefresh = () => resolve(respond(config, 200))))
        }
        attempts[config.url] = (attempts[config.url] ?? 0) + 1
        return respond(config, attempts[config.url] === 1 ? 401 : 200, { url: config.url })
      })

      const all = Promise.all([api.get('/a'), api.get('/b'), api.get('/c')])
      await vi.waitFor(() => expect(finishRefresh).toBeTypeOf('function'))
      finishRefresh()
      const results = await all

      expect(results.map((r) => r.data.url)).toEqual(['/a', '/b', '/c'])
      expect(calls(adapter).filter((c) => c === 'POST /auth/refresh')).toHaveLength(1)
    })

    it('starts a new refresh for a later 401 once the previous one has finished', async () => {
      const attempts = {}
      const adapter = fakeServer((config) => {
        if (config.url === '/auth/refresh') return respond(config, 200)
        attempts[config.url] = (attempts[config.url] ?? 0) + 1
        return respond(config, attempts[config.url] === 1 ? 401 : 200)
      })

      await api.get('/first')
      await api.get('/second')

      expect(calls(adapter).filter((c) => c === 'POST /auth/refresh')).toHaveLength(2)
    })

    it('starts a new refresh after a failed one', async () => {
      const adapter = fakeServer((config) => respond(config, 401))

      await expect(api.get('/a')).rejects.toBeDefined()
      await expect(api.get('/b')).rejects.toBeDefined()

      expect(calls(adapter).filter((c) => c === 'POST /auth/refresh')).toHaveLength(2)
      expect(onExpired).toHaveBeenCalledTimes(2)
    })
  })

  describe('requests that must not trigger a refresh', () => {
    it.each([
      ['POST', '/auth/login'],
      ['POST', '/auth/refresh'],
      ['POST', '/auth/logout'],
      ['POST', '/auth/login?next=/dashboard'],
    ])('%s %s', async (method, url) => {
      const adapter = fakeServer((config) => respond(config, 401))

      await expect(api.request({ method, url })).rejects.toMatchObject({
        response: { status: 401 },
      })

      expect(adapter).toHaveBeenCalledOnce()
      expect(onExpired).not.toHaveBeenCalled()
    })

    it.each([403, 404, 409, 500])('does not refresh on HTTP %i', async (status) => {
      const adapter = fakeServer((config) => respond(config, status))

      await expect(api.get('/users/me')).rejects.toMatchObject({ response: { status } })

      expect(adapter).toHaveBeenCalledOnce()
    })

    it('does not refresh on network errors (no response)', async () => {
      const adapter = fakeServer((config) =>
        Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)),
      )

      await expect(api.get('/users/me')).rejects.toMatchObject({ code: 'ERR_NETWORK' })

      expect(adapter).toHaveBeenCalledOnce()
    })
  })
})