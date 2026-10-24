import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { toUser } from '@/models/user'

export const userService = {
  updateProfile: (payload) =>
    api.patch('/users/me', payload),

  changePassword: ({ currentPassword, newPassword }) =>
    api.put('/users/me/password', { currentPassword, newPassword }),

  uploadAvatar: (file, onProgress) =>
    uploadService.putImage('/users/me/avatar', file, onProgress).then(toUser),

  // "" removes the avatar; a URL replaces an uploaded file
  setAvatarLink: (url) =>
    api.patch('/users/me', { avatarUrl: url }).then(({ data }) => toUser(data)),

  removeAvatar: () =>
    api.delete('/users/me/avatar').then(({ data }) => toUser(data)),

  deleteAccount: () => api.delete('/users/me'),
}