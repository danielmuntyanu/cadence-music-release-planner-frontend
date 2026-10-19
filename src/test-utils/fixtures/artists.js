let nextId = 1

/** Builds an Artist model (already mapped, as the service returns it) */
export function makeArtist(overrides = {}) {
  const id = overrides.id ?? nextId++
  return {
    id,
    name: `Artist ${id}`,
    avatarUrl: null,
    bannerUrl: null,
    description: '',
    genre: '',
    socials: [],
    releaseCount: 0,
    ...overrides,
  }
}