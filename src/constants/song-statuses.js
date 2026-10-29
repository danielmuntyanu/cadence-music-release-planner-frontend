// src/constants/song-statuses.js

/**
 * Mirrors dev.danyil.enums.SongStatus on the backend.
 * Array order is the workflow order: it drives progress and status menus.
 *
 * @typedef {'WRITING' | 'ARRANGEMENT' | 'RECORDING' | 'MIXING_MASTERING' | 'DONE'} SongStatus
 *
 * @typedef {Object} SongStatusOption
 * @property {SongStatus} value
 * @property {string} label
 * @property {string} color  Vuetify theme color
 * @property {string} icon
 */

/** @type {ReadonlyArray<SongStatusOption>} */
export const SONG_STATUSES = Object.freeze([
  { value: 'WRITING', label: 'Writing', color: 'info', icon: 'mdi-pencil-outline' },
  { value: 'ARRANGEMENT', label: 'Produce', color: 'error', icon: 'mdi-piano' },
  { value: 'RECORDING', label: 'Recording', color: 'warning', icon: 'mdi-microphone-outline' },
  { value: 'MIXING_MASTERING', label: 'Mix/Master', color: 'primary', icon: 'mdi-tune-vertical-variant' },
  { value: 'DONE', label: 'Done', color: 'success', icon: 'mdi-check-circle-outline' },
])

export const DEFAULT_SONG_STATUS = 'WRITING'

const STATUS_BY_VALUE = new Map(SONG_STATUSES.map((status) => [status.value, status]))

/**
 * @param {unknown} value
 * @returns {value is SongStatus}
 */
export function isSongStatus(value) {
  return typeof value === 'string' && STATUS_BY_VALUE.has(value)
}

/**
 * Full option for chips and menus; falls back to the default status for unknown values.
 * @param {SongStatus} value
 * @returns {SongStatusOption}
 */
export function getSongStatus(value) {
  return STATUS_BY_VALUE.get(value) ?? STATUS_BY_VALUE.get(DEFAULT_SONG_STATUS)
}

/**
 * How far along the workflow a status is: WRITING = 0, DONE = 1.
 * Used for release progress, where a song in mixing counts as mostly done.
 * @param {SongStatus} value
 * @returns {number}
 */
export function getSongStatusProgress(value) {
  const index = SONG_STATUSES.findIndex((status) => status.value === value)
  return index <= 0 ? 0 : index / (SONG_STATUSES.length - 1)
}