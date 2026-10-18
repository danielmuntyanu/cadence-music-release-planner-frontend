import api from '@/services/api'
import { toArtist } from '@/models/artist'

const toArtists = (data) => (Array.isArray(data) ? data.map(toArtist).filter(Boolean) : [])

export const artistService = {
  getAll: () =>
    api.get('/artists').then(({ data }) => toArtists(data)),

  getById: (id) =>
    api.get(`/artists/${id}`).then(({ data }) => toArtist(data)),

  create: (payload) =>
    api.post('/artists', payload).then(({ data }) => toArtist(data)),

  update: (id, payload) =>
    api.patch(`/artists/${id}`, payload).then(({ data }) => toArtist(data)),

  delete: (id) => api.delete(`/artists/${id}`),
}