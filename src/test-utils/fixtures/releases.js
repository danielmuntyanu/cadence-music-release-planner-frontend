let nextId = 1

/** Builds a Release model (already mapped, as the service returns it) */
export function makeRelease(overrides = {}) {
  const id = overrides.id ?? nextId++
  return {
    id,
    name: `Release ${id}`,
    type: 'SINGLE',
    phase: 'PLANNING',
    artworkUrl: null,
    notes: '',
    primaryGenre: 'POP',
    secondaryGenre: null,
    releaseDate: null,
    originalReleaseDate: null,
    createdAt: '2026-10-01T10:00:00Z',
    artists: [],
    ...overrides,
  }
}

/** Builds a page result as releaseService.getAll returns it */
export function makePage(items, { number = 0, size = 24, totalElements = items.length } = {}) {
  return {
    items,
    page: { number, size, totalElements, totalPages: Math.ceil(totalElements / size) },
  }
}