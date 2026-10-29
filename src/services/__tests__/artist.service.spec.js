import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { artistService } from '@/services/artist.service'
import { uploadService } from '@/services/upload.service'


vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/services/upload.service', () => ({
  uploadService: { putImage: vi.fn() },
}))

const ARTIST_DTO = { id: 7, name: 'Nova', genre: 'Synthwave', socials: [] }
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('artistService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll', () => {
    it('requests /artists and maps the page content to artists', async () => {
      api.get.mockResolvedValue({ data: { content: [ARTIST_DTO], totalElements: 1 } })

      const artists = await artistService.getAll()

      expect(api.get).toHaveBeenCalledWith('/artists')
      expect(artists).toEqual([
        expect.objectContaining({ id: 7, name: 'Nova', genre: 'Synthwave', description: '', avatarUrl: null }),
      ])
    })

    it.each([
      ['no body', undefined],
      ['no content field', {}],
      ['null content', { content: null }],
      ['non-array content', { content: 'oops' }],
    ])('returns an empty list for %s', async (_label, data) => {
      api.get.mockResolvedValue({ data })

      expect(await artistService.getAll()).toEqual([])
    })

    it('drops entries that are not artist objects', async () => {
      api.get.mockResolvedValue({ data: { content: [ARTIST_DTO, null, 'broken'] } })

      const artists = await artistService.getAll()

      expect(artists).toHaveLength(1)
      expect(artists[0].id).toBe(7)
    })
  })

  it('getById requests the artist by id and maps it', async () => {
    api.get.mockResolvedValue({ data: ARTIST_DTO })

    const artist = await artistService.getById(7)

    expect(api.get).toHaveBeenCalledWith('/artists/7')
    expect(artist).toEqual(expect.objectContaining({ id: 7, name: 'Nova', description: '' }))
  })

  it('create posts the payload and maps the created artist', async () => {
    const payload = { name: 'Nova', genre: 'Synthwave', socials: [] }
    api.post.mockResolvedValue({ data: ARTIST_DTO })

    const artist = await artistService.create(payload)

    expect(api.post).toHaveBeenCalledWith('/artists', payload)
    expect(artist.id).toBe(7)
  })

  it('update patches the artist by id and maps the result', async () => {
    const payload = { genre: 'House' }
    api.patch.mockResolvedValue({ data: { ...ARTIST_DTO, genre: 'House' } })

    const artist = await artistService.update(7, payload)

    expect(api.patch).toHaveBeenCalledWith('/artists/7', payload)
    expect(artist.genre).toBe('House')
  })

  it('delete sends a DELETE for the artist id', async () => {
    api.delete.mockResolvedValue({ status: 204 })

    await artistService.delete(7)

    expect(api.delete).toHaveBeenCalledWith('/artists/7')
  })

  it.each([
    ['getAll', 'get', []],
    ['getById', 'get', [7]],
    ['create', 'post', [{ name: 'Nova' }]],
    ['update', 'patch', [7, { name: 'Nova' }]],
    ['delete', 'delete', [7]],
  ])('%s passes API errors to the caller untouched', async (method, httpMethod, args) => {
    const error = httpError(500)
    api[httpMethod].mockRejectedValue(error)

    await expect(artistService[method](...args)).rejects.toBe(error)
  })

  it('uploadImage puts the file to the slot endpoint and maps the artist', async () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const onProgress = vi.fn()
    uploadService.putImage.mockResolvedValue({ ...ARTIST_DTO, avatarUrl: 'https://signed.test/a.jpg' })

    const artist = await artistService.uploadImage(7, 'avatar', file, onProgress)

    expect(uploadService.putImage).toHaveBeenCalledWith('/artists/7/avatar', file, onProgress)
    expect(artist.avatarUrl).toBe('https://signed.test/a.jpg')
  })

  it('removeImage deletes the slot and maps the artist', async () => {
    api.delete.mockResolvedValue({ data: { ...ARTIST_DTO, bannerUrl: null } })

    const artist = await artistService.removeImage(7, 'banner')

    expect(api.delete).toHaveBeenCalledWith('/artists/7/banner')
    expect(artist.bannerUrl).toBeNull()
  })
})