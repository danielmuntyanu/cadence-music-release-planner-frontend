import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RELEASE_PHASE,
  RELEASE_PHASES,
  getNextReleasePhase,
  getReleasePhase,
  isReleasePhase,
} from '@/constants/release-phases'

describe('release phases', () => {
  it('lists the lifecycle in order', () => {
    // The order drives Kanban columns and "Move to …?" suggestions
    expect(RELEASE_PHASES.map((phase) => phase.value)).toEqual(['PLANNING', 'PRODUCTION', 'PRE_RELEASE', 'PROMO', 'CATALOG'])
  })

  it('gives every phase a label, description, color and icon', () => {
    for (const phase of RELEASE_PHASES) {
      expect(phase.label).toBeTruthy()
      expect(phase.description).toBeTruthy()
      expect(phase.color).toBeTruthy()
      expect(phase.icon).toMatch(/^mdi-/)
    }
  })

  it('cannot be modified at runtime', () => {
    expect(Object.isFrozen(RELEASE_PHASES)).toBe(true)
  })

  it('starts new releases in planning', () => {
    expect(DEFAULT_RELEASE_PHASE).toBe('PLANNING')
  })

  describe('isReleasePhase', () => {
    it.each(['PLANNING', 'PROMO', 'CATALOG'])('accepts %s', (value) => {
      expect(isReleasePhase(value)).toBe(true)
    })

    it.each(['promo', 'LAUNCHED', '', null, undefined, 3])('rejects %s', (value) => {
      expect(isReleasePhase(value)).toBe(false)
    })
  })

  describe('getReleasePhase', () => {
    it('returns the full option for a known phase', () => {
      expect(getReleasePhase('PROMO')).toMatchObject({ value: 'PROMO', label: 'Promo' })
    })

    it('falls back to the default phase for an unknown value', () => {
      // Never null: templates read .color and .label directly
      expect(getReleasePhase('LAUNCHED')).toMatchObject({ value: 'PLANNING' })
    })
  })

  describe('getNextReleasePhase', () => {
    it('returns the following phase', () => {
      expect(getNextReleasePhase('PRODUCTION').value).toBe('PRE_RELEASE')
    })

    it('returns null after the last phase', () => {
      expect(getNextReleasePhase('CATALOG')).toBeNull()
    })

    it('returns null for an unknown phase', () => {
      expect(getNextReleasePhase('LAUNCHED')).toBeNull()
    })
  })
})