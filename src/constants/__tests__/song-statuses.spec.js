import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SONG_STATUS,
  SONG_STATUSES,
  getSongStatus,
  getSongStatusProgress,
  isSongStatus,
} from '@/constants/song-statuses'

describe('song statuses', () => {
  it('mirror the backend enum, in workflow order', () => {
    expect(SONG_STATUSES.map((status) => status.value)).toEqual([
      'WRITING', 'ARRANGEMENT', 'RECORDING', 'MIXING_MASTERING', 'DONE',
    ])
  })

  it('cannot be changed at runtime', () => {
    expect(Object.isFrozen(SONG_STATUSES)).toBe(true)
  })

  it('give every status a label, a color and an icon', () => {
    for (const status of SONG_STATUSES) {
      expect(status.label).toBeTruthy()
      expect(status.color).toBeTruthy()
      expect(status.icon).toMatch(/^mdi-/)
    }
  })

  it('start new songs in writing', () => {
    expect(DEFAULT_SONG_STATUS).toBe('WRITING')
  })

  describe('isSongStatus', () => {
    it.each(SONG_STATUSES.map((s) => s.value))('accepts %s', (value) => {
      expect(isSongStatus(value)).toBe(true)
    })

    it.each([null, undefined, '', 'writing', 'MIXING', 42])('rejects %s', (value) => {
      expect(isSongStatus(value)).toBe(false)
    })
  })

  describe('getSongStatus', () => {
    it('returns the full option', () => {
      expect(getSongStatus('MIXING_MASTERING').label).toBe('Mix/Master')
    })

    it('falls back to the default for unknown values', () => {
      expect(getSongStatus('MASTERED').value).toBe('WRITING')
    })
  })

  describe('getSongStatusProgress', () => {
    // Must match SongStatus.progress() on the backend: release progress is computed on both sides
    it.each([
      ['WRITING', 0],
      ['ARRANGEMENT', 0.25],
      ['RECORDING', 0.5],
      ['MIXING_MASTERING', 0.75],
      ['DONE', 1],
    ])('%s is %d of the way', (value, expected) => {
      expect(getSongStatusProgress(value)).toBe(expected)
    })

    it('treats an unknown status as not started', () => {
      expect(getSongStatusProgress('MASTERED')).toBe(0)
    })
  })
})