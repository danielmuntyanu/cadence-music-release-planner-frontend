import { describe, expect, it } from 'vitest'
import {
  createReleaseFilters,
  createReleaseForm,
  fromReleaseRouteQuery,
  toRelease,
  toReleaseCreateRequest,
  toReleaseQuery,
  toReleaseRequest,
  toReleaseRouteQuery,
} from '@/models/release'

describe('toRelease', () => {
  it('returns null for non-object input', () => {
    expect(toRelease(null)).toBeNull()
    expect(toRelease('release')).toBeNull()
  })

  it('fills optional fields with safe defaults', () => {
    expect(toRelease({ id: 1, name: 'Night Drive', type: 'EP', phase: 'PROMO', primaryGenre: 'POP' })).toEqual({
      id: 1,
      name: 'Night Drive',
      type: 'EP',
      phase: 'PROMO',
      artworkUrl: null,
      notes: '',
      primaryGenre: 'POP',
      secondaryGenre: null,
      releaseDate: null,
      originalReleaseDate: null,
      createdAt: null,
      artists: [],
    })
  })

  it('falls back to defaults for unknown enum values', () => {
    const release = toRelease({ id: 1, type: 'MIXTAPE', phase: 'LAUNCHED', primaryGenre: 'POLKA', secondaryGenre: 'POLKA' })

    expect(release.type).toBe('SINGLE')
    expect(release.phase).toBe('PLANNING')
    expect(release.primaryGenre).toBe('OTHER')
    expect(release.secondaryGenre).toBeNull()
  })

  it('keeps artists in server order and drops invalid entries', () => {
    const release = toRelease({
      id: 1,
      artists: [{ id: 2, name: 'Ada' }, null, { id: 1, name: 'Nova', avatarUrl: 'https://img.test/n.png' }],
    })

    expect(release.artists).toEqual([
      { id: 2, name: 'Ada', avatarUrl: null },
      { id: 1, name: 'Nova', avatarUrl: 'https://img.test/n.png' },
    ])
  })
})

describe('createReleaseForm', () => {
  it('returns an empty form with defaults', () => {
    expect(createReleaseForm()).toEqual({
      name: '',
      type: 'SINGLE',
      phase: 'PLANNING',
      notes: '',
      primaryGenre: null,
      secondaryGenre: null,
      releaseDate: null,
      originalReleaseDate: null,
      artistIds: [],
    })
  })

  it('prefills from a release and keeps the artist order as ids', () => {
    const form = createReleaseForm(toRelease({
      id: 1,
      name: 'Night Drive',
      type: 'EP',
      primaryGenre: 'POP',
      releaseDate: '2026-11-14',
      artists: [{ id: 2, name: 'Ada' }, { id: 1, name: 'Nova' }],
    }))

    expect(form.name).toBe('Night Drive')
    expect(form.releaseDate).toBe('2026-11-14')
    expect(form.artistIds).toEqual([2, 1])
  })

  it('does not carry the artwork: the server sets it after an upload', () => {
    expect(createReleaseForm(toRelease({ id: 1, artworkUrl: 'https://img.test/a.png' }))).not.toHaveProperty('artworkUrl')
  })
})

describe('toReleaseRequest', () => {
  const form = (overrides = {}) => ({ ...createReleaseForm(), primaryGenre: 'POP', ...overrides })

  it('trims text, keeps enums and sends empty dates as null', () => {
    const request = toReleaseRequest(form({ name: '  Night Drive ', notes: ' mix v2 ', releaseDate: '' }))

    expect(request).toEqual({
      name: 'Night Drive',
      type: 'SINGLE',
      notes: 'mix v2',
      primaryGenre: 'POP',
      secondaryGenre: null,
      releaseDate: null,
      originalReleaseDate: null,
      artistIds: [],
    })
  })

  it('drops duplicate artist ids and keeps the first occurrence order', () => {
    expect(toReleaseRequest(form({ artistIds: [3, 1, 3, 2, 1] })).artistIds).toEqual([3, 1, 2])
  })

  it('leaves the phase out: updates change it through its own endpoint', () => {
    expect(toReleaseRequest(form({ phase: 'PROMO' }))).not.toHaveProperty('phase')
  })
})

describe('toReleaseCreateRequest', () => {
  it('adds the starting phase', () => {
    const request = toReleaseCreateRequest({ ...createReleaseForm(), phase: 'PRODUCTION' })
    expect(request.phase).toBe('PRODUCTION')
  })
})

describe('toReleaseQuery', () => {
  it('sends only paging when no filter is set', () => {
    expect(toReleaseQuery(createReleaseFilters(), { page: 2, size: 24, sort: 'name,asc' })).toEqual({
      page: 2,
      size: 24,
      sort: 'name,asc',
    })
  })

  it('includes non-empty filters and trims the search text', () => {
    const query = toReleaseQuery({
      phase: ['PROMO', 'PRE_RELEASE'],
      type: [],
      genre: ['POP'],
      artistId: 7,
      q: '  night ',
    })

    expect(query).toEqual({ page: 0, size: 24, phase: ['PROMO', 'PRE_RELEASE'], genre: ['POP'], artistId: 7, q: 'night' })
  })

  it('keeps artistId 0 out only when it is null, not when it is falsy', () => {
    // Guards against a `if (filters.artistId)` regression
    expect(toReleaseQuery({ ...createReleaseFilters(), artistId: 0 })).toHaveProperty('artistId', 0)
  })
})

describe('route query', () => {
  it('reads a single value as a one-item list', () => {
    const state = fromReleaseRouteQuery({ phase: 'PROMO', genre: ['POP', 'ROCK'] })

    expect(state.filters.phase).toEqual(['PROMO'])
    expect(state.filters.genre).toEqual(['POP', 'ROCK'])
  })

  it('drops values a hand-edited URL could contain', () => {
    const state = fromReleaseRouteQuery({ phase: ['PROMO', 'HACKED'], artistId: 'abc', sort: 'user.password,asc', page: '-3' })

    expect(state.filters.phase).toEqual(['PROMO'])
    expect(state.filters.artistId).toBeNull()
    expect(state.sort).toBe('createdAt,desc')
    expect(state.page).toBe(0)
  })

  it('converts the 1-based URL page to the 0-based store page and back', () => {
    const state = fromReleaseRouteQuery({ page: '3' })

    expect(state.page).toBe(2)
    expect(toReleaseRouteQuery(state).page).toBe('3')
  })

  it('leaves defaults out of the URL', () => {
    expect(toReleaseRouteQuery({ filters: createReleaseFilters(), sort: 'createdAt,desc', page: 0 })).toEqual({})
  })

  it('survives a round trip unchanged', () => {
    const query = { phase: ['PROMO'], genre: ['POP'], artistId: '7', q: 'night', sort: 'name,asc', page: '2' }

    expect(toReleaseRouteQuery(fromReleaseRouteQuery(query))).toEqual(query)
  })
})