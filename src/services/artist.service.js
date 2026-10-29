import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { toArtist } from '@/models/artist'

const toArtists = (data) => (Array.isArray(data) ? data.map(toArtist).filter(Boolean) : [])

export const artistService = {
  getAll: () =>
    api.get('/artists').then(({ data }) => toArtists(data?.content)),

  getById: (id) =>
    api.get(`/artists/${id}`).then(({ data }) => toArtist(data)),

  create: (payload) =>
    api.post('/artists', payload).then(({ data }) => toArtist(data)),

  update: (id, payload) =>
    api.patch(`/artists/${id}`, payload).then(({ data }) => toArtist(data)),

  delete: (id) => api.delete(`/artists/${id}`),

  // slot: 'avatar' | 'banner'
  uploadImage: (id, slot, file, onProgress) =>
    uploadService.putImage(`/artists/${id}/${slot}`, file, onProgress).then(toArtist),

  removeImage: (id, slot) =>
    api.delete(`/artists/${id}/${slot}`).then(({ data }) => toArtist(data)),
}