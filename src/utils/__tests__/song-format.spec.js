import { describe, expect, it } from 'vitest'
import { formatDuration, formatIsrc, parseDuration } from '@/utils/song-format'

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

describe('parseDuration', () => {
  it.each([
    ['3:35', 215],
    ['0:05', 5],
    ['75:00', 4500],
    ['1:02:07', 3727],
    [' 3:35 ', 215],
  ])('"%s" is %i seconds', (text, expected) => {
    expect(parseDuration(text)).toBe(expected)
  })

  it('returns null for an empty value', () => {
    expect(parseDuration('')).toBeNull()
    expect(parseDuration('   ')).toBeNull()
    expect(parseDuration(null)).toBeNull()
  })

  it.each(['215', '3:5', '3:60', '1:60:00', 'abc', '3.35'])('rejects "%s"', (text) => {
    expect(parseDuration(text)).toBeUndefined()
  })
})