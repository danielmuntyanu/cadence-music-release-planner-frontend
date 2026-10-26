import { DEFAULT_SONG_STATUS, isSongStatus } from '@/constants/song-statuses'

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
 * @property {string | null} createdAt
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
    createdAt: dto.createdAt ?? null,
  }
}

/** @param {unknown} data */
export const toSongs = (data) => (Array.isArray(data) ? data.map(toSong).filter(Boolean) : [])