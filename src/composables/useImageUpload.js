import { onBeforeUnmount, ref } from 'vue'
import { useSubmit } from '@/composables/useSubmit'
import { MAX_IMAGE_BYTES, validateImageFile } from '@/utils/image-file'

const DEFAULT_ERROR_MESSAGES = {
  400: 'This image could not be used. Try a JPEG, PNG or WebP file.',
  413: 'The file is too large.',
}

/**
 * State for picking, previewing and uploading one image.
 * Must be called from a component's setup: the preview URL is released on unmount.
 *
 * @param {Object} options
 * @param {(file: File, onProgress: (value: number | null) => void) => Promise<unknown>} [options.upload]
 * @param {() => Promise<unknown>} [options.remove]
 * @param {(url: string) => Promise<unknown>} [options.saveLink]
 * @param {number} [options.maxBytes]
 * @param {Record<number, string>} [options.errorMessages]
 */
export function useImageUpload({ upload, remove, saveLink, maxBytes = MAX_IMAGE_BYTES, errorMessages = {} } = {}) {
  const file = ref(null)
  const previewUrl = ref(null)
  // 0..1 while uploading; null when idle or when the total size is unknown
  const progress = ref(null)

  const { loading, error, success, submit } = useSubmit({
    errorMessages: { ...DEFAULT_ERROR_MESSAGES, ...errorMessages },
  })

  // Object URLs keep the file in memory until revoked
  function revokePreview() {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  /** Validates and previews a file; returns false when it was rejected */
  function pick(picked) {
    if (!picked) return false
    success.value = false
    error.value = validateImageFile(picked, maxBytes)
    if (error.value) return false

    revokePreview()
    file.value = picked
    previewUrl.value = URL.createObjectURL(picked)
    return true
  }

  function clear() {
    revokePreview()
    file.value = null
    progress.value = null
    error.value = null
  }

  async function confirmUpload() {
    if (!file.value || !upload) return false

    progress.value = 0
    const ok = await submit(() => upload(file.value, (value) => { progress.value = value }))
    progress.value = null
    // On failure the file stays picked, so the user can retry without choosing it again
    if (ok) clear()
    return ok
  }

  async function removeImage() {
    if (!remove) return false
    const ok = await submit(() => remove())
    if (ok) clear()
    return ok
  }

  async function confirmLink(url) {
    if (!saveLink) return false
    const ok = await submit(() => saveLink(url.trim()))
    if (ok) clear()
    return ok
  }

  onBeforeUnmount(revokePreview)

  return { file, previewUrl, progress, loading, error, success, pick, clear, confirmUpload, removeImage, confirmLink }
}