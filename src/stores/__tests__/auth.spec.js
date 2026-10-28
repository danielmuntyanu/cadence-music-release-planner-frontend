import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'

vi.mock('@/services/auth.service', () => ({
  authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), register: vi.fn() },
}))

const USER = { id: 1, username: 'daniel', roles: ['USER'] }
const ADMIN = { id: 2, username: 'admin', roles: ['USER', 'ADMIN'] }
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

let store
let errorSpy

async function signInAs(account) {
  authService.login.mockResolvedValue(account)
  await store.login({ username: account.username, password: 'Secret1!' })
}

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  store = useAuthStore()
})

afterEach(() => errorSpy.mockRestore())

describe('initial state', () => {
  it('starts as a guest that is not ready yet', () => {
    expect(store.user).toBeNull()
    expect(store.ready).toBe(false)
    expect(store.isAuthenticated).toBe(false)
    expect(store.roles).toEqual([])
  })
})

describe('init / fetchMe', () => {
  it('stores the user and becomes ready', async () => {
    authService.me.mockResolvedValue(USER)
    await store.init()
    expect(store.user).toEqual(USER)
    expect(store.ready).toBe(true)
    expect(store.isAuthenticated).toBe(true)
  })

  it('init() returns a promise that settles only after /auth/me has finished', async () => {
    authService.me.mockResolvedValue({ data: USER })
    const result = store.init()
    expect(result).toBeInstanceOf(Promise)
    expect(store.ready).toBe(false)
    await result
    expect(store.ready).toBe(true)
  })

  it('calls /auth/me once however many times init() is called', async () => {
    authService.me.mockResolvedValue({ data: USER })
    const first = store.init()
    const second = store.init()
    await Promise.all([first, second])
    expect(first).toEqual(second)
    expect(authService.me).toHaveBeenCalledTimes(1)
  })

  it.each([401, 403])('treats %i as a guest without logging an error', async (status) => {
    authService.me.mockRejectedValue(httpError(status))
    await store.init()
    expect(store.user).toBeNull()
    expect(store.ready).toBe(true)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it.each([
    ['a server error', httpError(500)],
    ['a network error', new Error('Network Error')],
  ])('logs %s and stays a guest', async (_label, error) => {
    authService.me.mockRejectedValue(error)
    await store.init()
    expect(store.user).toBeNull()
    expect(store.ready).toBe(true)
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('drops the previous user when a later fetchMe fails with 401', async () => {
    authService.me.mockResolvedValueOnce(ADMIN).mockRejectedValueOnce(httpError(401))
    await store.fetchMe()
    expect(store.isAdmin).toBe(true)
    await store.fetchMe()
    expect(store.user).toBeNull()
    expect(store.isAdmin).toBe(false)
  })
})

describe('login', () => {
  it('sends the credentials and stores the returned user', async () => {
    const credentials = { username: 'daniel', password: 'Secret1!' }
    authService.login.mockResolvedValue(USER)
    await store.login(credentials)
    expect(authService.login).toHaveBeenCalledWith(credentials)
    expect(store.user).toEqual(USER)
    expect(store.isAuthenticated).toBe(true)
  })

  it('rethrows the error and stays a guest when the login fails', async () => {
    const error = httpError(401)
    authService.login.mockRejectedValue(error)
    await expect(store.login({ username: 'x', password: 'y' })).rejects.toBe(error)
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})

describe('logout', () => {
  it('calls the API and clears the user and roles', async () => {
    await signInAs(ADMIN)
    authService.logout.mockResolvedValue({})
    await store.logout()
    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(store.user).toBeNull()
    expect(store.roles).toEqual([])
    expect(store.isAdmin).toBe(false)
  })

  it('clears the user even when the request fails, and rethrows', async () => {
    await signInAs(USER)
    const error = httpError(500)
    authService.logout.mockRejectedValue(error)
    await expect(store.logout()).rejects.toBe(error)
    expect(store.user).toBeNull()
  })
})

describe('roles', () => {
  it('guest has no roles', () => {
    expect(store.roles).toEqual([])
    expect(store.isAdmin).toBe(false)
    expect(store.hasRole('USER')).toBe(false)
    expect(store.hasAnyRole(['USER', 'ADMIN'])).toBe(false)
  })

  it('regular account is USER only', async () => {
    await signInAs(USER)
    expect(store.roles).toEqual(['USER'])
    expect(store.hasRole('USER')).toBe(true)
    expect(store.hasRole('ADMIN')).toBe(false)
    expect(store.isAdmin).toBe(false)
  })

  it('admin account has both USER and ADMIN', async () => {
    await signInAs(ADMIN)
    expect(store.roles).toEqual(['USER', 'ADMIN'])
    expect(store.hasRole('USER')).toBe(true)
    expect(store.isAdmin).toBe(true)
  })

  it.each([
    { label: 'USER needs USER', account: USER, required: ['USER'], expected: true },
    { label: 'USER needs ADMIN', account: USER, required: ['ADMIN'], expected: false },
    { label: 'USER needs USER or ADMIN', account: USER, required: ['USER', 'ADMIN'], expected: true },
    { label: 'ADMIN needs ADMIN', account: ADMIN, required: ['ADMIN'], expected: true },
    { label: 'ADMIN needs USER', account: ADMIN, required: ['USER'], expected: true },
    { label: 'an empty list denies everyone', account: ADMIN, required: [], expected: false },
  ])('$label -> hasAnyRole($required) is $expected', async ({ account, required, expected }) => {
    await signInAs(account)
    expect(store.hasAnyRole(required)).toBe(expected)
  })

  it('ignores a missing roles field', async () => {
    await signInAs({ id: 3, username: 'broken' })
    expect(store.roles).toEqual([])
    expect(store.isAdmin).toBe(false)
  })

  it('ignores roles that are not an array (a string must not grant ADMIN)', async () => {
    await signInAs({ id: 4, username: 'broken', roles: 'ADMIN' })
    expect(store.roles).toEqual([])
    expect(store.isAdmin).toBe(false)
    expect(store.hasRole('ADMIN')).toBe(false)
  })

  it('picks up changed roles after fetchMe', async () => {
    authService.me.mockResolvedValueOnce(ADMIN).mockResolvedValueOnce({ data: USER })
    await store.fetchMe()
    expect(store.isAdmin).toBe(true)
    await store.fetchMe()
    expect(store.isAdmin).toBe(false)
  })

  it('denies access when the requirement is not an array', async () => {
    await signInAs(ADMIN)
    expect(store.hasAnyRole('ADMIN')).toBe(false)
    expect(store.hasAnyRole(undefined)).toBe(false)
  })
})

describe("register", () => {
  it('register and login with same data', async () => {
    authService.register.mockResolvedValue({})
    authService.login.mockResolvedValue({ username: 'daniel', roles: ['USER'] })
    const auth = useAuthStore()

    await auth.register({ username: 'daniel', email: 'd@example.com', password: 'Abcdefg1!' })

    expect(authService.register).toHaveBeenCalledOnce()
    expect(authService.login).toHaveBeenCalledWith({ username: 'daniel', password: 'Abcdefg1!' })
    expect(auth.isAuthenticated).toBe(true)
  })

  it('if error 409 not tries to login', async () => {
    authService.register.mockRejectedValue(httpError(409))
    const auth = useAuthStore()

    await expect(auth.register({ username: 'daniel', password: 'x' })).rejects.toMatchObject({
      response: { status: 409 },
    })
    expect(authService.login).not.toHaveBeenCalled()
    expect(auth.isAuthenticated).toBe(false)
  })
})

describe("player", () => {
  it('stops the player on logout, so private audio does not keep playing', async () => {
    authService.logout.mockRejectedValue(new Error('Network'))
    const auth = useAuthStore()
    const stop = vi.spyOn(usePlayerStore(), 'stop')

    // Even when the request fails, the session ends locally and the player with it
    await expect(auth.logout()).rejects.toThrow()

    expect(stop).toHaveBeenCalled()
  })
})