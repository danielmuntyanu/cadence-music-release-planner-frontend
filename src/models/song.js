import { DEFAULT_SONG_STATUS, isSongStatus } from '@/constants/song-statuses'
import { formatDuration, formatIsrc, parseDuration } from '@/utils/song-format'

/**
 * @typedef {import('@/constants/song-statuses').SongStatus} SongStatus
 *
 * @typedef {Object} Song
 * @property {number} id
 * @property {number} trackNumber   1-based, as confirmed by the server
 * @property {string} title
 * @property {number | null} durationSeconds
 * @property {string | null} isrc   Normalized: 12 characters, no hyphens
 * @property {SongStatus} status
 * @property {string} lyrics
 * @property {boolean} explicit
 * @property {number | null} primaryFileId  The file with the heart
 * @property {number} fileCount
 * @property {string | null} createdAt
 *
 * @typedef {Object} SongFile
 * @property {number} id
 * @property {string} displayName
 * @property {string} originalFilename
 * @property {string} contentType
 * @property {number} sizeBytes
 * @property {string | null} uploadedAt
 * @property {boolean} primary
 * @property {string | null} url  Signed and short-lived: for playback, not for keeping
 */

/**
 * @param {unknown} dto
 * @returns {Song | null}
 */
export function toSong(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    id: dto.id,
    trackNumber: dto.trackNumber ?? 0,
    title: dto.title ?? '',
    durationSeconds: dto.durationSeconds ?? null,
    isrc: dto.isrc ?? null,
    status: isSongStatus(dto.status) ? dto.status : DEFAULT_SONG_STATUS,
    lyrics: dto.lyrics ?? '',
    explicit: dto.explicit === true,
    primaryFileId: dto.primaryFileId ?? null,
    fileCount: dto.fileCount ?? 0,
    createdAt: dto.createdAt ?? null,
  }
}

/** @param {unknown} data */
export const toSongs = (data) => (Array.isArray(data) ? data.map(toSong).filter(Boolean) : [])

/**
 * @param {unknown} dto
 * @returns {SongFile | null}
 */
export function toSongFile(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    id: dto.id,
    displayName: dto.displayName ?? '',
    originalFilename: dto.originalFilename ?? '',
    contentType: dto.contentType ?? '',
    sizeBytes: dto.sizeBytes ?? 0,
    uploadedAt: dto.uploadedAt ?? null,
    primary: dto.primary === true,
    url: dto.url ?? null,
  }
}

/** @param {unknown} data */
export const toSongFiles = (data) => (Array.isArray(data) ? data.map(toSongFile).filter(Boolean) : [])

/**
 * Form state for the song dialog: duration and ISRC as the user types them.
 * @param {Song | null} [song]
 */
export function createSongForm(song = null) {
  return {
    title: song?.title ?? '',
    duration: formatDuration(song?.durationSeconds),
    isrc: formatIsrc(song?.isrc),
    status: song?.status ?? DEFAULT_SONG_STATUS,
    explicit: song?.explicit ?? false,
    lyrics: song?.lyrics ?? '',
  }
}

/**
 * Body for POST and PUT: every field is sent, null clears an optional one.
 * The server normalizes the ISRC, so it is sent as typed.
 */
export function toSongRequest(form) {
  return {
    title: form.title.trim(),
    durationSeconds: parseDuration(form.duration) ?? null,
    isrc: form.isrc.trim() || null,
    status: form.status,
    lyrics: form.lyrics.trim() || null,
    explicit: form.explicit,
  }
}