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