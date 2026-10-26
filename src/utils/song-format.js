const pad = (n) => String(n).padStart(2, '0')

/**
 * Seconds -> "3:35", or "1:02:07" for an hour or more.
 * @param {number | null | undefined} seconds
 * @returns {string} "" when unknown
 */
export function formatDuration(seconds) {
  if (seconds == null) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`
}

/**
 * Stored ISRC "USABC2600001" -> readable "US-ABC-26-00001".
 * Anything that is not 12 characters is returned as is.
 * @param {string | null | undefined} isrc
 */
export function formatIsrc(isrc) {
  if (!isrc || isrc.length !== 12) return isrc ?? ''
  return `${isrc.slice(0, 2)}-${isrc.slice(2, 5)}-${isrc.slice(5, 7)}-${isrc.slice(7)}`
}

/**
 * "3:35" -> 215, "1:02:07" -> 3727.
 * @param {string | null | undefined} text
 * @returns {number | null | undefined} null when empty, undefined when not a valid duration
 */
export function parseDuration(text) {
  const value = text?.trim() ?? ''
  if (!value) return null

  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return undefined

  const [, hours, minutes, seconds] = match
  if (Number(seconds) > 59) return undefined
  // With hours, minutes are a clock value; without them "75:00" is a valid 75-minute track
  if (hours !== undefined && Number(minutes) > 59) return undefined

  return Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds)
}