import axios from 'axios'
import api from '@/services/api'

// Uploads can take far longer than the default API timeout on a slow connection
const UPLOAD_TIMEOUT_MS = 60_000
// A long WAV master on a slow connection can take many minutes
const STORAGE_UPLOAD_TIMEOUT_MS = 30 * 60 * 1000

/**
 * Direct uploads go to MinIO or R2, not to our API, so they use a bare client:
 * no base URL, no cookies, no XSRF header and no token refresh. None of them belong
 * in a request to storage, and the signed URL already carries the permission.
 */
const storageClient = axios.create()

const toFormData = (file) => {
  const body = new FormData()
  body.append('file', file)
  return body
}

/** Reports progress as 0..1, or null when the browser cannot tell the total size */
const toProgressHandler = (onProgress) =>
  onProgress && ((event) => onProgress(event.total ? event.loaded / event.total : null))

export const uploadService = {
  // Content-Type is left to the browser: it adds the multipart boundary itself
  putImage: (url, file, onProgress) =>
    api
      .put(url, toFormData(file), { timeout: UPLOAD_TIMEOUT_MS, onUploadProgress: toProgressHandler(onProgress) })
      .then(({ data }) => data),

  /**
   * PUTs the raw file to a signed storage URL. `headers` must be sent exactly as the
   * server returned them: they are part of the signature.
   */
  putToStorage: (url, file, headers = {}, { onProgress, signal } = {}) =>
    storageClient
      .put(url, file, {
        headers,
        signal,
        timeout: STORAGE_UPLOAD_TIMEOUT_MS,
        onUploadProgress: toProgressHandler(onProgress),
      })
      .then(() => undefined),
}