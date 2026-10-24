import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { uploadService } from '@/services/upload.service'

vi.mock('@/services/api', () => ({
  default: { put: vi.fn() },
}))

const file = new File(['image'], 'cover.png', { type: 'image/png' })
const lastOptions = () => api.put.mock.calls.at(-1)[2]

describe('uploadService.putImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.put.mockResolvedValue({ data: { id: 7 } })
  })

  it('sends the file as multipart form data and returns the body', async () => {
    const result = await uploadService.putImage('/artists/7/avatar', file)

    const [url, body] = api.put.mock.calls[0]
    expect(url).toBe('/artists/7/avatar')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('file')).toBe(file)
    expect(result).toEqual({ id: 7 })
  })

  it('does not set Content-Type by hand: the browser adds the multipart boundary', async () => {
    await uploadService.putImage('/artists/7/avatar', file)

    expect(lastOptions().headers).toBeUndefined()
  })

  it('uses a longer timeout than regular API calls', async () => {
    await uploadService.putImage('/artists/7/avatar', file)

    expect(lastOptions().timeout).toBeGreaterThan(10_000)
  })

  it('reports progress as a fraction', async () => {
    const onProgress = vi.fn()
    await uploadService.putImage('/artists/7/avatar', file, onProgress)

    lastOptions().onUploadProgress({ loaded: 25, total: 100 })

    expect(onProgress).toHaveBeenCalledWith(0.25)
  })

  it('reports unknown progress as null', async () => {
    const onProgress = vi.fn()
    await uploadService.putImage('/artists/7/avatar', file, onProgress)

    lastOptions().onUploadProgress({ loaded: 25 })

    expect(onProgress).toHaveBeenCalledWith(null)
  })

  it('skips progress handling when nobody listens', async () => {
    await uploadService.putImage('/artists/7/avatar', file)

    expect(lastOptions().onUploadProgress).toBeUndefined()
  })

  it('passes errors to the caller untouched', async () => {
    const error = Object.assign(new Error('HTTP 413'), { response: { status: 413 } })
    api.put.mockRejectedValue(error)

    await expect(uploadService.putImage('/artists/7/avatar', file)).rejects.toBe(error)
  })
})