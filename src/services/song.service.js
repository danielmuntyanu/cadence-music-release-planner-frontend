import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { toSong, toSongFile, toSongFiles, toSongs } from '@/models/song'

const songsUrl = (releaseId) => `/releases/${releaseId}/songs`
const filesUrl = (releaseId, songId) => `${songsUrl(releaseId)}/${songId}/files`

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

  // ---------- Audio files ----------

  // Newest first; every file comes with a fresh signed URL for playback
  getFiles: (releaseId, songId) =>
    api.get(filesUrl(releaseId, songId)).then(({ data }) => toSongFiles(data)),

  /**
   * Sign, upload straight to storage, confirm. The bytes never pass through the backend.
   * A blank displayName lets the server name the file after the original file name.
   */
  uploadFile: async (releaseId, songId, file, { displayName = null, onProgress, signal } = {}) => {
    const base = filesUrl(releaseId, songId)
    const { data: upload } = await api.post(`${base}/uploads`, { fileName: file.name, sizeBytes: file.size }, { signal })
    await uploadService.putToStorage(upload.uploadUrl, file, upload.headers, { onProgress, signal })
    const { data } = await api.post(base, { key: upload.key, fileName: file.name, displayName }, { signal })
    return toSongFile(data)
  },

  renameFile: (releaseId, songId, fileId, displayName) =>
    api.patch(`${filesUrl(releaseId, songId)}/${fileId}`, { displayName }).then(({ data }) => toSongFile(data)),

  // The heart moves between files, so the whole list comes back; null clears it
  setPrimaryFile: (releaseId, songId, fileId) =>
    api.put(`${songsUrl(releaseId)}/${songId}/primary-file`, { fileId }).then(({ data }) => toSongFiles(data)),

  // A five-minute link that makes the browser save the file under its name
  fileDownloadLink: (releaseId, songId, fileId) =>
    api.get(`${filesUrl(releaseId, songId)}/${fileId}/download`).then(({ data }) => data),

  deleteFile: (releaseId, songId, fileId) => api.delete(`${filesUrl(releaseId, songId)}/${fileId}`),
}