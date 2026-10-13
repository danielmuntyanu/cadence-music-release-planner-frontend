import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { authService } from '../auth.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const userDto = {
  id: 1,
  username: 'daniel',
  email: 'd@example.com',
  displayName: 'Daniel',
  bio: 'Producer',
  avatarUrl: null,
  roles: ['USER'],
}

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('authService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('login', () => {
    it('отправляет данные на /auth/login и возвращает модель пользователя', async () => {
      api.post.mockResolvedValue({ data: userDto })
      const credentials = { username: 'daniel', password: 'Abcdefg1!' }

      const user = await authService.login(credentials)

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(user).toEqual(userDto)
    })

    it('приводит ответ к модели: дефолты и без лишних полей', async () => {
      api.post.mockResolvedValue({
        data: { id: 1, username: 'daniel', email: 'd@example.com', passwordHash: 'secret' },
      })

      const user = await authService.login({})

      expect(user).toMatchObject({ displayName: '', bio: '', avatarUrl: null, roles: [] })
      expect(user).not.toHaveProperty('passwordHash')
    })

    it('пробрасывает ошибку запроса', async () => {
      api.post.mockRejectedValue(httpError(401))

      await expect(authService.login({})).rejects.toMatchObject({ response: { status: 401 } })
    })
  })

  describe('logout', () => {
    it('вызывает /auth/logout и ничего не возвращает', async () => {
      api.post.mockResolvedValue({ data: 'ignored' })

      await expect(authService.logout()).resolves.toBeUndefined()
      expect(api.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('пробрасывает ошибку запроса', async () => {
      api.post.mockRejectedValue(httpError(500))

      await expect(authService.logout()).rejects.toMatchObject({ response: { status: 500 } })
    })
  })

  describe('me', () => {
    it('запрашивает /auth/me и возвращает модель пользователя', async () => {
      api.get.mockResolvedValue({ data: userDto })

      const user = await authService.me()

      expect(api.get).toHaveBeenCalledWith('/auth/me')
      expect(user).toEqual(userDto)
    })

    it('возвращает null, если тело ответа пустое', async () => {
      api.get.mockResolvedValue({ data: '' })

      await expect(authService.me()).resolves.toBeNull()
    })

    it('пробрасывает ошибку с кодом статуса (store различает 401/403)', async () => {
      api.get.mockRejectedValue(httpError(401))

      await expect(authService.me()).rejects.toMatchObject({ response: { status: 401 } })
    })
  })

  describe('register', () => {
    it('отправляет данные как есть (camelCase) на /users и возвращает модель', async () => {
      api.post.mockResolvedValue({ data: userDto })
      const payload = {
        username: 'daniel',
        email: 'd@example.com',
        password: 'Abcdefg1!',
        displayName: 'Daniel',
      }

      const user = await authService.register(payload)

      expect(api.post).toHaveBeenCalledWith('/users', payload)
      expect(user).toEqual(userDto)
    })

    it('пробрасывает ошибку запроса (например, 409)', async () => {
      api.post.mockRejectedValue(httpError(409))

      await expect(authService.register({})).rejects.toMatchObject({ response: { status: 409 } })
    })
  })
})