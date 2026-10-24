import api from '@/services/api'

// Uploads can take far longer than the default API timeout on a slow connection
const UPLOAD_TIMEOUT_MS = 60_000

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
}