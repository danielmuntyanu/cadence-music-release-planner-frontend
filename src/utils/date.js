const pad = (n) => String(n).padStart(2, '0')

/**
 * Date (local) -> "YYYY-MM-DD" for LocalDate fields.
 * Built from local components on purpose: toISOString() converts to UTC
 * and would shift the day (e.g. local midnight in Madrid becomes the previous day).
 * @param {Date} date
 * @returns {string}
 */
export const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/**
 * "YYYY-MM-DD" -> Date at local midnight.
 * new Date("YYYY-MM-DD") would parse it as UTC midnight instead.
 * @param {string} value
 * @returns {Date}
 */
export const fromIsoDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const DAY_MS = 86_400_000

/**
 * Whole days from today (local) to a "YYYY-MM-DD" date: positive in the future, negative in the past.
 * Rounding absorbs the 23/25-hour days around daylight saving changes.
 * @param {string} value
 * @param {Date} [today]
 */
export function daysUntil(value, today = new Date()) {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((fromIsoDate(value) - startOfToday) / DAY_MS)
}

/**
 * "YYYY-MM-DD" -> localized date, e.g. "14 Nov 2026".
 * @param {string} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export const formatIsoDate = (value, options = { dateStyle: 'medium' }) =>
  new Intl.DateTimeFormat(undefined, options).format(fromIsoDate(value))