import api from '@/services/api'
import { toSong, toSongs } from '@/models/song'

const songsUrl = (releaseId) => `/releases/${releaseId}/songs`

export const songService = {
  getAll: (releaseId) =>
    api.get(songsUrl(releaseId)).then(({ data }) => toSongs(data)),

  create: (releaseId, payload) =>
    api.post(songsUrl(releaseId), payload).then(({ data }) => toSong(data)),

  // PUT: the whole song is replaced; null clears an optional field
  replace: (releaseId, songId, payload) =>
    api.put(`${songsUrl(releaseId)}/${songId}`, payload).then(({ data }) => toSong(data)),

  updateStatus: (releaseId, songId, status) =>
    api.patch(`${songsUrl(releaseId)}/${songId}/status`, { status }).then(({ data }) => toSong(data)),

  // The full order, first track first; returns the confirmed tracklist
  reorder: (releaseId, songIds) =>
    api.put(`${songsUrl(releaseId)}/order`, { songIds }).then(({ data }) => toSongs(data)),

  delete: (releaseId, songId) => api.delete(`${songsUrl(releaseId)}/${songId}`),
}