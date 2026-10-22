import { isGenre } from '@/constants/genres'
import { DEFAULT_RELEASE_PHASE, isReleasePhase } from '@/constants/release-phases'
import { isReleaseType } from '@/constants/release-types'

/**
 * @typedef {import('@/constants/genres').Genre} Genre
 * @typedef {import('@/constants/release-phases').ReleasePhase} ReleasePhase
 * @typedef {import('@/constants/release-types').ReleaseType} ReleaseType
 *
 * @typedef {Object} ReleaseArtist
 * @property {number} id
 * @property {string} name
 * @property {string | null} avatarUrl
 *
 * @typedef {Object} Release
 * @property {number} id
 * @property {string} name
 * @property {ReleaseType} type
 * @property {ReleasePhase} phase
 * @property {string | null} artworkUrl
 * @property {string} notes
 * @property {Genre} primaryGenre
 * @property {Genre | null} secondaryGenre
 * @property {string | null} releaseDate          "YYYY-MM-DD" (LocalDate)
 * @property {string | null} originalReleaseDate  "YYYY-MM-DD" (LocalDate)
 * @property {string | null} createdAt            ISO instant, e.g. "2026-10-22T10:15:00Z"
 * @property {ReleaseArtist[]} artists            Ordered: the first one is the primary artist
 *
 * @typedef {Object} ReleaseFilters
 * @property {ReleasePhase[]} phase
 * @property {ReleaseType[]} type
 * @property {Genre[]} genre
 * @property {number | null} artistId
 * @property {string} q
 */

export const DEFAULT_RELEASE_TYPE = 'SINGLE'

/**
 * @param {unknown} dto
 * @returns {ReleaseArtist | null}
 */
function toReleaseArtist(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    id: dto.id,
    name: dto.name ?? '',
    avatarUrl: dto.avatarUrl ?? null,
  }
}

/**
 * @param {unknown} dto
 * @returns {Release | null}
 */
export function toRelease(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    id: dto.id,
    name: dto.name ?? '',
    type: isReleaseType(dto.type) ? dto.type : DEFAULT_RELEASE_TYPE,
    phase: isReleasePhase(dto.phase) ? dto.phase : DEFAULT_RELEASE_PHASE,
    artworkUrl: dto.artworkUrl ?? null,
    notes: dto.notes ?? '',
    primaryGenre: isGenre(dto.primaryGenre) ? dto.primaryGenre : 'OTHER',
    secondaryGenre: isGenre(dto.secondaryGenre) ? dto.secondaryGenre : null,
    releaseDate: dto.releaseDate ?? null,
    originalReleaseDate: dto.originalReleaseDate ?? null,
    createdAt: dto.createdAt ?? null,
    artists: Array.isArray(dto.artists) ? dto.artists.map(toReleaseArtist).filter(Boolean) : [],
  }
}

/**
 * Form state for create/edit. Pass a release to prefill (edit mode).
 * Artists are kept as ordered ids: the picker reorders ids, not objects.
 * @param {Release | null} [release]
 */
export function createReleaseForm(release = null) {
  return {
    name: release?.name ?? '',
    type: release?.type ?? DEFAULT_RELEASE_TYPE,
    phase: release?.phase ?? DEFAULT_RELEASE_PHASE,
    artworkUrl: release?.artworkUrl ?? '',
    notes: release?.notes ?? '',
    primaryGenre: release?.primaryGenre ?? null,
    secondaryGenre: release?.secondaryGenre ?? null,
    releaseDate: release?.releaseDate ?? null,
    originalReleaseDate: release?.originalReleaseDate ?? null,
    artistIds: (release?.artists ?? []).map((artist) => artist.id),
  }
}

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '')

/**
 * Request body shared by create and update (PATCH). Text fields are sent trimmed,
 * "" clears them; duplicate artist ids are dropped while keeping the order.
 * @param {ReturnType<typeof createReleaseForm>} form
 */
export function toReleaseRequest(form) {
  return {
    name: trimmed(form.name),
    type: form.type ?? null,
    artworkUrl: trimmed(form.artworkUrl),
    notes: trimmed(form.notes),
    primaryGenre: form.primaryGenre ?? null,
    secondaryGenre: form.secondaryGenre ?? null,
    releaseDate: form.releaseDate || null,
    originalReleaseDate: form.originalReleaseDate || null,
    artistIds: [...new Set(form.artistIds ?? [])],
  }
}

/** Create also accepts the starting phase; updates change it through its own endpoint. */
export const toReleaseCreateRequest = (form) => ({ ...toReleaseRequest(form), phase: form.phase ?? null })

/** @returns {ReleaseFilters} */
export function createReleaseFilters() {
  return { phase: [], type: [], genre: [], artistId: null, q: '' }
}

/**
 * Query params for GET /releases: empty filters are left out entirely.
 * @param {ReleaseFilters} filters
 * @param {{ page?: number, size?: number, sort?: string }} [paging]
 */
export function toReleaseQuery(filters, { page = 0, size = 24, sort } = {}) {
  const query = { page, size }
  if (sort) query.sort = sort

  for (const key of ['phase', 'type', 'genre']) {
    if (filters[key]?.length) query[key] = filters[key]
  }
  if (filters.artistId != null) query.artistId = filters.artistId

  const q = trimmed(filters.q)
  if (q) query.q = q

  return query
}