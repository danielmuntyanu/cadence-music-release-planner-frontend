/**
 * Mirrors dev.danyil.enums.ReleasePhase on the backend.
 * Array order is the lifecycle order: it drives Kanban columns and phase suggestions.
 *
 * @typedef {'PLANNING' | 'PRODUCTION' | 'PRE_RELEASE' | 'PROMO' | 'CATALOG'} ReleasePhase
 *
 * @typedef {Object} ReleasePhaseOption
 * @property {ReleasePhase} value
 * @property {string} label
 * @property {string} description  One line shown in tooltips and empty Kanban columns
 * @property {string} color        Vuetify theme color for chips and column accents
 * @property {string} icon
 */

/** @type {ReadonlyArray<ReleasePhaseOption>} */
export const RELEASE_PHASES = Object.freeze([
  {
    value: 'PLANNING',
    label: 'Planning',
    description: 'Concept, tracklist, artists and target date.',
    color: 'info',
    icon: 'mdi-lightbulb-on-outline',
  },
  {
    value: 'PRODUCTION',
    label: 'Production',
    description: 'Tracks are being written, recorded, mixed and mastered.',
    color: 'warning',
    icon: 'mdi-tune-vertical-variant',
  },
  {
    value: 'PRE_RELEASE',
    label: 'Pre-release',
    description: 'Distribution, pitching, pre-saves and teasers.',
    color: 'primary',
    icon: 'mdi-rocket-launch-outline',
  },
  {
    value: 'PROMO',
    label: 'Promo',
    description: 'Out now: active promotion and playlist outreach.',
    color: 'success',
    icon: 'mdi-bullhorn-outline',
  },
  {
    value: 'CATALOG',
    label: 'Catalog',
    description: 'Campaign finished; the release lives in your back catalog.',
    color: 'grey',
    icon: 'mdi-archive-outline',
  },
])

export const DEFAULT_RELEASE_PHASE = 'PLANNING'

const PHASE_BY_VALUE = new Map(RELEASE_PHASES.map((phase) => [phase.value, phase]))

/**
 * @param {unknown} value
 * @returns {value is ReleasePhase}
 */
export function isReleasePhase(value) {
  return typeof value === 'string' && PHASE_BY_VALUE.has(value)
}

/**
 * Full option for chips and columns; falls back to the default phase for unknown values.
 * @param {ReleasePhase} value
 * @returns {ReleasePhaseOption}
 */
export function getReleasePhase(value) {
  return PHASE_BY_VALUE.get(value) ?? PHASE_BY_VALUE.get(DEFAULT_RELEASE_PHASE)
}

/**
 * The phase that follows in the lifecycle, or null for the last one.
 * Used by "Move to …?" suggestions.
 * @param {ReleasePhase} value
 * @returns {ReleasePhaseOption | null}
 */
export function getNextReleasePhase(value) {
  const index = RELEASE_PHASES.findIndex((phase) => phase.value === value)
  return index === -1 ? null : (RELEASE_PHASES[index + 1] ?? null)
}