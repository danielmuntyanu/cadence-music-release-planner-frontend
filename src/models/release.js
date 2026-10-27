import { isGenre } from '@/constants/genres'
import { DEFAULT_RELEASE_PHASE, isReleasePhase } from '@/constants/release-phases'
import { isReleaseType } from '@/constants/release-types'
import { DEFAULT_RELEASE_SORT, isReleaseSort } from '@/constants/release-sorts'

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
    songCount: dto.songCount ?? 0,
    doneSongCount: dto.doneSongCount ?? 0,
    // Clamped: a broken value must never draw a bar past its track
    progressPercent: Math.min(100, Math.max(0, dto.progressPercent ?? 0)),
    explicit: dto.explicit === true,
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

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value])

/**
 * URL query -> store state. Unknown values are dropped, so a hand-edited URL cannot break the page.
 * The URL page is 1-based for people; the store and Spring are 0-based.
 * @param {Record<string, unknown>} query
 */
export function fromReleaseRouteQuery(query) {
  const artistId = Number(query.artistId)
  const page = Number(query.page)

  return {
    filters: {
      phase: asArray(query.phase).filter(isReleasePhase),
      type: asArray(query.type).filter(isReleaseType),
      genre: asArray(query.genre).filter(isGenre),
      artistId: Number.isInteger(artistId) && artistId > 0 ? artistId : null,
      q: typeof query.q === 'string' ? query.q : '',
    },
    sort: isReleaseSort(query.sort) ? query.sort : DEFAULT_RELEASE_SORT,
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  }
}

/**
 * Store state -> URL query. Defaults are left out to keep links short.
 * @param {{ filters: ReleaseFilters, sort: string, page: number }} state
 */
export function toReleaseRouteQuery({ filters, sort, page }) {
  const query = {}

  for (const key of ['phase', 'type', 'genre']) {
    if (filters[key].length) query[key] = filters[key]
  }
  if (filters.artistId != null) query.artistId = String(filters.artistId)

  const q = filters.q.trim()
  if (q) query.q = q
  if (sort !== DEFAULT_RELEASE_SORT) query.sort = sort
  if (page > 0) query.page = String(page + 1)

  return query
}

/** Query keys that carry list state; a URL without any of them falls back to the stored state. */
export const RELEASE_ROUTE_KEYS = Object.freeze(['phase', 'type', 'genre', 'artistId', 'q', 'sort', 'page'])