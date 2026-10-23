import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { describeReleaseDate } from '@/utils/release-date'

describe('describeReleaseDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 23, 12, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('handles a release without a date', () => {
    expect(describeReleaseDate(null)).toEqual({ label: 'No release date', icon: 'mdi-calendar-blank-outline', upcoming: false })
  })

  it('counts down to a future release', () => {
    const result = describeReleaseDate('2026-10-26')

    expect(result.label).toMatch(/^Out in 3 days · /)
    expect(result.upcoming).toBe(true)
  })

  it('uses the singular for one day', () => {
    expect(describeReleaseDate('2026-10-24').label).toMatch(/^Out in 1 day · /)
  })

  it('marks release day', () => {
    expect(describeReleaseDate('2026-10-23')).toMatchObject({ label: 'Out today', upcoming: true })
  })

  it('shows past releases as released', () => {
    const result = describeReleaseDate('2026-01-15')

    expect(result.label).toMatch(/^Released /)
    expect(result.upcoming).toBe(false)
  })
})