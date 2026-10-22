/**
 * Mirrors dev.danyil.enums.Genre on the backend.
 * Keep both in sync when adding a genre.
 *
 * @typedef {'ALTERNATIVE' | 'BLUES' | 'CHILDRENS' | 'CLASSICAL' | 'COUNTRY' | 'DANCE'
 *   | 'ELECTRONIC' | 'HIP_HOP_RAP' | 'JAZZ' | 'LATIN' | 'METAL' | 'POP' | 'PUNK'
 *   | 'RNB_SOUL' | 'REGGAE' | 'ROCK' | 'SINGER_SONGWRITER' | 'SOUNDTRACK'
 *   | 'SPOKEN_WORD' | 'WORLD' | 'OTHER'} Genre
 *
 * @typedef {Object} GenreOption
 * @property {Genre} value
 * @property {string} label
 */

/** @type {ReadonlyArray<GenreOption>} */
export const GENRES = Object.freeze([
  { value: 'ALTERNATIVE', label: 'Alternative' },
  { value: 'BLUES', label: 'Blues' },
  { value: 'CHILDRENS', label: "Children's Music" },
  { value: 'CLASSICAL', label: 'Classical' },
  { value: 'COUNTRY', label: 'Country' },
  { value: 'DANCE', label: 'Dance' },
  { value: 'ELECTRONIC', label: 'Electronic' },
  { value: 'HIP_HOP_RAP', label: 'Hip-Hop/Rap' },
  { value: 'JAZZ', label: 'Jazz' },
  { value: 'LATIN', label: 'Latin' },
  { value: 'METAL', label: 'Metal' },
  { value: 'POP', label: 'Pop' },
  { value: 'PUNK', label: 'Punk' },
  { value: 'RNB_SOUL', label: 'R&B/Soul' },
  { value: 'REGGAE', label: 'Reggae' },
  { value: 'ROCK', label: 'Rock' },
  { value: 'SINGER_SONGWRITER', label: 'Singer/Songwriter' },
  { value: 'SOUNDTRACK', label: 'Soundtrack' },
  { value: 'SPOKEN_WORD', label: 'Spoken Word' },
  { value: 'WORLD', label: 'World' },
  { value: 'OTHER', label: 'Other' },
])

const GENRE_BY_VALUE = new Map(GENRES.map((genre) => [genre.value, genre]))

/** Labels only, for free-text suggestions (e.g. the artist genre combobox) */
export const GENRE_LABELS = Object.freeze(GENRES.filter((g) => g.value !== 'OTHER').map((g) => g.label))

/**
 * @param {unknown} value
 * @returns {value is Genre}
 */
export function isGenre(value) {
  return typeof value === 'string' && GENRE_BY_VALUE.has(value)
}

/**
 * @param {Genre | null | undefined} value
 * @returns {string}
 */
export function getGenreLabel(value) {
  return GENRE_BY_VALUE.get(value)?.label ?? ''
}