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