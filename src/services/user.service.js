import api from '@/services/api'

export const userService = {
  updateProfile: (payload) =>
    api.patch('/users/me', payload),

  changePassword: ({ currentPassword, newPassword }) =>
    api.put('/users/me/password', { currentPassword, newPassword }),

  uploadAvatar: (file) => {
    const body = new FormData()
    body.append('file', file)
    return api.post('/users/me/avatar', body)
  },

  removeAvatar: () => api.delete('/users/me/avatar'),

  deleteAccount: () => api.delete('/users/me'),
}