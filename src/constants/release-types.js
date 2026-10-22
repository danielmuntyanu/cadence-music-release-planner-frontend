/**
 * Mirrors dev.danyil.enums.ReleaseType on the backend.
 * UI order follows release size (Single → EP → Album), not the enum declaration order.
 *
 * @typedef {'SINGLE' | 'EP' | 'ALBUM' | 'COMPILATION'} ReleaseType
 *
 * @typedef {Object} ReleaseTypeOption
 * @property {ReleaseType} value
 * @property {string} label
 * @property {string} icon
 */

/** @type {ReadonlyArray<ReleaseTypeOption>} */
export const RELEASE_TYPES = Object.freeze([
  { value: 'SINGLE', label: 'Single', icon: 'mdi-music-note' },
  { value: 'EP', label: 'EP', icon: 'mdi-disc' },
  { value: 'ALBUM', label: 'Album', icon: 'mdi-album' },
  { value: 'COMPILATION', label: 'Compilation', icon: 'mdi-playlist-music' },
])

const TYPE_BY_VALUE = new Map(RELEASE_TYPES.map((type) => [type.value, type]))

/**
 * @param {unknown} value
 * @returns {value is ReleaseType}
 */
export function isReleaseType(value) {
  return typeof value === 'string' && TYPE_BY_VALUE.has(value)
}

/**
 * @param {ReleaseType | null | undefined} value
 * @returns {string}
 */
export function getReleaseTypeLabel(value) {
  return TYPE_BY_VALUE.get(value)?.label ?? ''
}