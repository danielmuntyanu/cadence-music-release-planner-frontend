/** Formats the server accepts; it re-checks the real content, this only gives early feedback */
export const IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])

/** Matches spring.servlet.multipart.max-file-size on the backend */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/**
 * @param {number} bytes
 * @returns {string} e.g. "850 KB", "2.5 MB", "10 MB"
 */
export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, '')} MB`
}

/**
 * Client-side check before uploading. Returns an error message, or null when the file looks fine.
 * @param {File | null | undefined} file
 * @param {number} [maxBytes]
 */
export function validateImageFile(file, maxBytes = MAX_IMAGE_BYTES) {
  if (!file) return 'Choose an image first.'
  if (!IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG or WebP image.'
  if (file.size > maxBytes) return `The image is larger than ${formatBytes(maxBytes)}.`
  return null
}