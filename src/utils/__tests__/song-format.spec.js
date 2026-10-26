import { describe, expect, it } from 'vitest'
import { formatDuration, formatIsrc } from '@/utils/song-format'

describe('formatDuration', () => {
  it.each([
    [5, '0:05'],
    [215, '3:35'],
    [600, '10:00'],
    [3727, '1:02:07'],
  ])('%i seconds is "%s"', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })

  it('returns an empty string for an unknown duration', () => {
    expect(formatDuration(null)).toBe('')
    expect(formatDuration(undefined)).toBe('')
  })
})

describe('formatIsrc', () => {
  it('adds the standard hyphens', () => {
    expect(formatIsrc('USABC2600001')).toBe('US-ABC-26-00001')
  })

  it('leaves unexpected values untouched', () => {
    expect(formatIsrc('SHORT')).toBe('SHORT')
    expect(formatIsrc(null)).toBe('')
  })
})