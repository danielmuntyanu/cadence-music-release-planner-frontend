import { daysUntil, formatIsoDate } from '@/utils/date'
import { pluralize } from '@/utils/format'

/**
 * Human label for a release date, shared by cards and list rows.
 * @param {string | null} value  "YYYY-MM-DD"
 * @returns {{ label: string, icon: string, upcoming: boolean }}
 */
export function describeReleaseDate(value) {
  if (!value) return { label: 'No release date', icon: 'mdi-calendar-blank-outline', upcoming: false }

  const days = daysUntil(value)
  const date = formatIsoDate(value)

  if (days > 0) return { label: `Out in ${pluralize(days, 'day')} · ${date}`, icon: 'mdi-calendar-clock', upcoming: true }
  if (days === 0) return { label: 'Out today', icon: 'mdi-party-popper', upcoming: true }
  return { label: `Released ${date}`, icon: 'mdi-calendar-check-outline', upcoming: false }
}