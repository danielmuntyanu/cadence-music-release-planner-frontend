import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { releaseService } from '@/services/release.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/services/upload.service', () => ({
  uploadService: { putImage: vi.fn() },
}))

const RELEASE_DTO = { id: 7, name: 'Night Drive', type: 'EP', phase: 'PROMO', primaryGenre: 'POP', artists: [] }
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('releaseService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll', () => {
    it('sends the query with repeated keys and maps the page', async () => {
      api.get.mockResolvedValue({ data: { content: [RELEASE_DTO], page: { number: 0, size: 24, totalElements: 1, totalPages: 1 } } })
      const query = { page: 0, size: 24, phase: ['PROMO', 'PRE_RELEASE'] }

      const result = await releaseService.getAll(query)

      // indexes: null serializes arrays as phase=A&phase=B, which Spring binds to a Set
      expect(api.get).toHaveBeenCalledWith('/releases', { params: query, paramsSerializer: { indexes: null } })
      expect(result.items).toEqual([expect.objectContaining({ id: 7, name: 'Night Drive', notes: '' })])
      expect(result.page.totalElements).toBe(1)
    })

    it('works without a query', async () => {
      api.get.mockResolvedValue({ data: { content: [] } })

      await releaseService.getAll()

      expect(api.get).toHaveBeenCalledWith('/releases', expect.objectContaining({ params: {} }))
    })
  })

  it('getById requests the release by id and maps it', async () => {
    api.get.mockResolvedValue({ data: RELEASE_DTO })

    const release = await releaseService.getById(7)

    expect(api.get).toHaveBeenCalledWith('/releases/7')
    expect(release.phase).toBe('PROMO')
  })

  it('create posts the payload and maps the result', async () => {
    const payload = { name: 'Night Drive', primaryGenre: 'POP' }
    api.post.mockResolvedValue({ data: RELEASE_DTO })

    const release = await releaseService.create(payload)

    expect(api.post).toHaveBeenCalledWith('/releases', payload)
    expect(release.id).toBe(7)
  })

  it('update patches the release by id', async () => {
    api.patch.mockResolvedValue({ data: { ...RELEASE_DTO, notes: 'Final mix' } })

    const release = await releaseService.update(7, { notes: 'Final mix' })

    expect(api.patch).toHaveBeenCalledWith('/releases/7', { notes: 'Final mix' })
    expect(release.notes).toBe('Final mix')
  })

  it('updateGenres puts exactly the two genres', async () => {
    api.put.mockResolvedValue({ data: RELEASE_DTO })

    await releaseService.updateGenres(7, { primaryGenre: 'ROCK', secondaryGenre: null, extra: 'ignored' })

    expect(api.put).toHaveBeenCalledWith('/releases/7/genres', { primaryGenre: 'ROCK', secondaryGenre: null })
  })

  it('updateDates puts exactly the two dates', async () => {
    api.put.mockResolvedValue({ data: RELEASE_DTO })

    await releaseService.updateDates(7, { releaseDate: null, originalReleaseDate: '2020-05-01' })

    expect(api.put).toHaveBeenCalledWith('/releases/7/dates', { releaseDate: null, originalReleaseDate: '2020-05-01' })
  })

  it('updatePhase patches the phase endpoint with a phase body', async () => {
    api.patch.mockResolvedValue({ data: { ...RELEASE_DTO, phase: 'CATALOG' } })

    await releaseService.updatePhase(7, 'CATALOG')

    expect(api.patch).toHaveBeenCalledWith('/releases/7/phase', { phase: 'CATALOG' })
  })

  it('uploadArtwork puts the file to the artwork endpoint and maps the release', async () => {
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const onProgress = vi.fn()
    uploadService.putImage.mockResolvedValue({ ...RELEASE_DTO, artworkUrl: 'https://signed.test/c.jpg' })

    const release = await releaseService.uploadArtwork(7, file, onProgress)

    expect(uploadService.putImage).toHaveBeenCalledWith('/releases/7/artwork', file, onProgress)
    expect(release.artworkUrl).toBe('https://signed.test/c.jpg')
  })

  it('removeArtwork deletes the artwork and maps the release', async () => {
    api.delete.mockResolvedValue({ data: { ...RELEASE_DTO, artworkUrl: null } })

    const release = await releaseService.removeArtwork(7)

    expect(api.delete).toHaveBeenCalledWith('/releases/7/artwork')
    expect(release.artworkUrl).toBeNull()
  })

  it('delete sends a DELETE for the release id', async () => {
    api.delete.mockResolvedValue({ status: 204 })

    await releaseService.delete(7)

    expect(api.delete).toHaveBeenCalledWith('/releases/7')
  })

  describe('errors', () => {
    it.each([
      ['getAll', 'get', [{}]],
      ['getById', 'get', [7]],
      ['create', 'post', [{}]],
      ['update', 'patch', [7, {}]],
      ['updateGenres', 'put', [7, { primaryGenre: 'ROCK', secondaryGenre: null }]],
      ['updateDates', 'put', [7, { releaseDate: null, originalReleaseDate: null }]],
      ['updatePhase', 'patch', [7, 'PROMO']],
      ['removeArtwork', 'delete', [7]],
      ['delete', 'delete', [7]],
    ])('%s passes API errors to the caller untouched', async (method, httpMethod, args) => {
      const error = httpError(500)
      api[httpMethod].mockRejectedValue(error)

      await expect(releaseService[method](...args)).rejects.toBe(error)
    })

    // uploadArtwork goes through uploadService, not api, so it gets its own check
    it('uploadArtwork passes upload errors to the caller untouched', async () => {
      const error = httpError(413)
      uploadService.putImage.mockRejectedValue(error)

      await expect(releaseService.uploadArtwork(7, new File(['x'], 'cover.png'))).rejects.toBe(error)
    })
  })
})