import { formatBytes } from '@/utils/image-file'

/** Matches AudioFormats on the backend; the server re-checks every upload */
export const AUDIO_EXTENSIONS = Object.freeze(['wav', 'aif', 'aiff', 'flac', 'mp3', 'm4a', 'aac', 'ogg'])

/** For <input accept>: by extension, since browsers report audio MIME types inconsistently */
export const AUDIO_ACCEPT = AUDIO_EXTENSIONS.map((extension) => `.${extension}`).join(',')

/** Matches storage.audio.max-bytes on the backend */
export const MAX_AUDIO_BYTES = 500 * 1024 * 1024

/**
 * @param {string | null | undefined} filename
 * @returns {string | null} accepted extension in lowercase, or null
 */
export function audioExtension(filename) {
  const dot = filename?.lastIndexOf('.') ?? -1
  if (dot < 0 || dot === filename.length - 1) return null
  const extension = filename.slice(dot + 1).toLowerCase()
  return AUDIO_EXTENSIONS.includes(extension) ? extension : null
}

/** "I Belong To You mix3.wav" → "I Belong To You mix3" */
export function nameWithoutExtension(filename) {
  const dot = filename.lastIndexOf('.')
  return (dot > 0 ? filename.slice(0, dot) : filename).trim()
}

/**
 * Client-side check before uploading. Returns an error message, or null when the file looks fine.
 * @param {File | null | undefined} file
 * @param {number} [maxBytes]
 */
export function validateAudioFile(file, maxBytes = MAX_AUDIO_BYTES) {
  if (!file) return 'Choose an audio file first.'
  if (!audioExtension(file.name)) return 'Use WAV, AIFF, FLAC, MP3, M4A, AAC or OGG audio.'
  if (file.size === 0) return 'The file is empty.'
  if (file.size > maxBytes) return `The file is larger than ${formatBytes(maxBytes)}.`
  return null
}