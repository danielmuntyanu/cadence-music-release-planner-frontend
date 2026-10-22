import api from '@/services/api'
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

  update: (id, payload) =>
    api.patch(`/releases/${id}`, payload).then(({ data }) => toRelease(data)),

  updatePhase: (id, phase) =>
    api.patch(`/releases/${id}/phase`, { phase }).then(({ data }) => toRelease(data)),

  delete: (id) => api.delete(`/releases/${id}`),
}