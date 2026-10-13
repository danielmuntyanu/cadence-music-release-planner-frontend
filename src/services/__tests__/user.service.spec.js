import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { userService } from '../user.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

describe('userService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('updateProfile', () => {
    it('отправляет изменения PATCH-ом как есть', async () => {
      const response = { data: {} }
      api.patch.mockResolvedValue(response)
      const changes = { displayName: 'New name', bio: '' }

      const result = await userService.updateProfile(changes)

      expect(api.patch).toHaveBeenCalledWith('/users/me', changes)
      expect(result).toBe(response)
    })
  })

  describe('changePassword', () => {
    it('отправляет только currentPassword и newPassword', async () => {
      api.put.mockResolvedValue({})

      await userService.changePassword({
        currentPassword: 'Old1!aaa',
        newPassword: 'New1!aaa',
        confirmPassword: 'New1!aaa', // не должно уйти на сервер
      })

      expect(api.put).toHaveBeenCalledWith('/users/me/password', {
        currentPassword: 'Old1!aaa',
        newPassword: 'New1!aaa',
      })
    })

    it('пробрасывает ошибку запроса', async () => {
      const error = Object.assign(new Error('forbidden'), { response: { status: 403 } })
      api.put.mockRejectedValue(error)

      await expect(
        userService.changePassword({ currentPassword: 'x', newPassword: 'y' }),
      ).rejects.toBe(error)
    })
  })

  describe('uploadAvatar', () => {
    it('отправляет файл в FormData под ключом "file"', async () => {
      api.post.mockResolvedValue({})
      const file = new File(['img'], 'avatar.png', { type: 'image/png' })

      await userService.uploadAvatar(file)

      const [url, body] = api.post.mock.calls[0]
      expect(url).toBe('/users/me/avatar')
      expect(body).toBeInstanceOf(FormData)
      expect(body.get('file')).toBeInstanceOf(File)
      expect(body.get('file').name).toBe('avatar.png')
    })
  })

  describe('removeAvatar', () => {
    it('вызывает DELETE /users/me/avatar', async () => {
      api.delete.mockResolvedValue({})

      await userService.removeAvatar()

      expect(api.delete).toHaveBeenCalledWith('/users/me/avatar')
    })
  })

  describe('deleteAccount', () => {
    it('вызывает DELETE /users/me', async () => {
      api.delete.mockResolvedValue({})

      await userService.deleteAccount()

      expect(api.delete).toHaveBeenCalledWith('/users/me')
    })

    it('пробрасывает ошибку запроса', async () => {
      const error = Object.assign(new Error('boom'), { response: { status: 500 } })
      api.delete.mockRejectedValue(error)

      await expect(userService.deleteAccount()).rejects.toBe(error)
    })
  })
})