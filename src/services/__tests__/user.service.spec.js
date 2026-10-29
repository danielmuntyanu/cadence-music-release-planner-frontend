import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { userService } from '../user.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/services/upload.service', () => ({
  uploadService: { putImage: vi.fn() },
}))

const USER_DTO = {
  id: 1,
  username: 'daniel',
  email: 'daniel@test.com',
  displayName: 'Daniel',
  bio: null,
  avatarUrl: 'https://signed.test/avatar.jpg',
  roles: ['USER'],
}

describe('userService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('updateProfile', () => {
    it('sends the changes as a PATCH unchanged', async () => {
      const response = { data: {} }
      api.patch.mockResolvedValue(response)
      const changes = { displayName: 'New name', bio: '' }

      const result = await userService.updateProfile(changes)

      expect(api.patch).toHaveBeenCalledWith('/users/me', changes)
      expect(result).toBe(response)
    })
  })

  describe('changePassword', () => {
    it('sends only currentPassword and newPassword', async () => {
      api.put.mockResolvedValue({})

      await userService.changePassword({
        currentPassword: 'Old1!aaa',
        newPassword: 'New1!aaa',
        confirmPassword: 'New1!aaa', // must not reach the server
      })

      expect(api.put).toHaveBeenCalledWith('/users/me/password', {
        currentPassword: 'Old1!aaa',
        newPassword: 'New1!aaa',
      })
    })

    it('passes request errors to the caller', async () => {
      const error = Object.assign(new Error('forbidden'), { response: { status: 403 } })
      api.put.mockRejectedValue(error)

      await expect(
        userService.changePassword({ currentPassword: 'x', newPassword: 'y' }),
      ).rejects.toBe(error)
    })
  })

  describe('uploadAvatar', () => {
    it('puts the file to the avatar endpoint with progress and maps the user', async () => {
      const file = new File(['img'], 'avatar.png', { type: 'image/png' })
      const onProgress = vi.fn()
      uploadService.putImage.mockResolvedValue(USER_DTO)

      const user = await userService.uploadAvatar(file, onProgress)

      expect(uploadService.putImage).toHaveBeenCalledWith('/users/me/avatar', file, onProgress)
      expect(user).toEqual(expect.objectContaining({ id: 1, avatarUrl: 'https://signed.test/avatar.jpg' }))
    })

    it('passes upload errors to the caller', async () => {
      const error = Object.assign(new Error('too large'), { response: { status: 413 } })
      uploadService.putImage.mockRejectedValue(error)

      await expect(userService.uploadAvatar(new File(['img'], 'a.png'))).rejects.toBe(error)
    })
  })

  describe('setAvatarLink', () => {
    it('patches only the avatar link and maps the user', async () => {
      api.patch.mockResolvedValue({ data: { ...USER_DTO, avatarUrl: 'https://img.test/me.jpg' } })

      const user = await userService.setAvatarLink('https://img.test/me.jpg')

      expect(api.patch).toHaveBeenCalledWith('/users/me', { avatarUrl: 'https://img.test/me.jpg' })
      expect(user.avatarUrl).toBe('https://img.test/me.jpg')
    })

    it('sends an empty string to remove the avatar', async () => {
      api.patch.mockResolvedValue({ data: { ...USER_DTO, avatarUrl: null } })

      const user = await userService.setAvatarLink('')

      expect(api.patch).toHaveBeenCalledWith('/users/me', { avatarUrl: '' })
      expect(user.avatarUrl).toBeNull()
    })
  })

  describe('removeAvatar', () => {
    it('calls DELETE /users/me/avatar and maps the returned user', async () => {
      api.delete.mockResolvedValue({ data: { ...USER_DTO, avatarUrl: null } })

      const user = await userService.removeAvatar()

      expect(api.delete).toHaveBeenCalledWith('/users/me/avatar')
      expect(user.avatarUrl).toBeNull()
    })
  })

  describe('deleteAccount', () => {
    it('calls DELETE /users/me', async () => {
      api.delete.mockResolvedValue({})

      await userService.deleteAccount()

      expect(api.delete).toHaveBeenCalledWith('/users/me')
    })

    it('passes request errors to the caller', async () => {
      const error = Object.assign(new Error('boom'), { response: { status: 500 } })
      api.delete.mockRejectedValue(error)

      await expect(userService.deleteAccount()).rejects.toBe(error)
    })
  })
})