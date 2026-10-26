import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { toRelease } from '@/models/release'
import { toPage } from '@/models/page'

// Spring binds repeated keys (phase=A&phase=B); axios defaults to phase[]=A&phase[]=B
const REPEATED_KEYS = { indexes: null }

export const releaseService = {
  getAll: (query = {}) =>
    api.get('/releases', { params: query, paramsSerializer: REPEATED_KEYS }).then(({ data }) => toPage(data, toRelease)),

  getById: (id) =>
    api.get(`/releases/${id}`).then(({ data }) => toRelease(data)),

  create: (payload) =>
    api.post('/releases', payload).then(({ data }) => toRelease(data)),

  // PATCH: name, type, notes, artistIds only; null keeps a field
  update: (id, payload) =>
    api.patch(`/releases/${id}`, payload).then(({ data }) => toRelease(data)),

  // PUT: both values are replaced; null clears the secondary genre
  updateGenres: (id, { primaryGenre, secondaryGenre }) =>
    api.put(`/releases/${id}/genres`, { primaryGenre, secondaryGenre }).then(({ data }) => toRelease(data)),

  // PUT: both values are replaced; null clears a date
  updateDates: (id, { releaseDate, originalReleaseDate }) =>
    api.put(`/releases/${id}/dates`, { releaseDate, originalReleaseDate }).then(({ data }) => toRelease(data)),

  updatePhase: (id, phase) =>
    api.patch(`/releases/${id}/phase`, { phase }).then(({ data }) => toRelease(data)),

  uploadArtwork: (id, file, onProgress) =>
    uploadService.putImage(`/releases/${id}/artwork`, file, onProgress).then(toRelease),

  removeArtwork: (id) =>
    api.delete(`/releases/${id}/artwork`).then(({ data }) => toRelease(data)),

  delete: (id) => api.delete(`/releases/${id}`),
}