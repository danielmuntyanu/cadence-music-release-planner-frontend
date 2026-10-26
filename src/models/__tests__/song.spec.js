import { describe, expect, it } from 'vitest'
import { toSong, toSongs } from '@/models/song'

describe('toSong', () => {
  it('returns null for non-object input', () => {
    expect(toSong(null)).toBeNull()
  })

  it('fills optional fields with safe defaults', () => {
    expect(toSong({ id: 1, trackNumber: 2, title: 'Intro', status: 'RECORDING' })).toEqual({
      id: 1,
      trackNumber: 2,
      title: 'Intro',
      durationSeconds: null,
      isrc: null,
      status: 'RECORDING',
      lyrics: '',
      explicit: false,
      createdAt: null,
    })
  })

  it('falls back to WRITING for an unknown status', () => {
    expect(toSong({ id: 1, status: 'MASTERED' }).status).toBe('WRITING')
  })

  it('treats only a real true as explicit', () => {
    expect(toSong({ id: 1, explicit: true }).explicit).toBe(true)
    expect(toSong({ id: 1, explicit: 'true' }).explicit).toBe(false)
  })
})

describe('toSongs', () => {
  it('maps a list and drops invalid entries', () => {
    expect(toSongs([{ id: 1 }, null, { id: 2 }]).map((song) => song.id)).toEqual([1, 2])
  })

  it('returns an empty list for anything else', () => {
    expect(toSongs(undefined)).toEqual([])
  })
})