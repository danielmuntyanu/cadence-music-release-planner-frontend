import { describe, expect, it } from 'vitest'
import { daysUntil, formatIsoDate, fromIsoDate, toIsoDate } from '@/utils/date'

describe('toIsoDate', () => {
  it('formats local date components with zero padding', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('keeps the local day at midnight (toISOString would shift it in UTC+ zones)', () => {
    expect(toIsoDate(new Date(2026, 10, 14, 0, 0))).toBe('2026-11-14')
  })
})

describe('fromIsoDate', () => {
  it('parses to local midnight of the same day', () => {
    const date = fromIsoDate('2026-11-14')

    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 14, 0])
  })

  it('round-trips with toIsoDate', () => {
    expect(toIsoDate(fromIsoDate('2026-02-28'))).toBe('2026-02-28')
  })
})

describe('daysUntil', () => {
  const today = new Date(2026, 9, 23, 18, 30) // the time of day must not matter

  it.each([
    ['2026-10-26', 3],
    ['2026-10-23', 0],
    ['2026-10-21', -2],
  ])('%s is %i days from today', (value, expected) => {
    expect(daysUntil(value, today)).toBe(expected)
  })

  it('counts whole days across a daylight saving change', () => {
    // Europe switches to summer time on the last Sunday of March
    expect(daysUntil('2026-04-02', new Date(2026, 2, 26))).toBe(7)
  })
})

describe('formatIsoDate', () => {
  it('formats the given day without shifting it', () => {
    expect(formatIsoDate('2026-11-14', { day: 'numeric' })).toBe('14')
  })
})