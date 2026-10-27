/**
 * A song in the shape toSong() returns. Override only what a test cares about.
 * @param {Partial<import('@/models/song').Song>} [overrides]
 */
export function makeSong(overrides = {}) {
  return {
    id: 71,
    trackNumber: 1,
    title: 'Night Drive',
    durationSeconds: null,
    isrc: null,
    status: 'WRITING',
    lyrics: '',
    explicit: false,
    createdAt: null,
    ...overrides,
  }
}