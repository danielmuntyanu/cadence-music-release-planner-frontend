import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { releaseService } from '@/services/release.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
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

  it('updatePhase patches the phase endpoint with a phase body', async () => {
    api.patch.mockResolvedValue({ data: { ...RELEASE_DTO, phase: 'CATALOG' } })

    await releaseService.updatePhase(7, 'CATALOG')

    expect(api.patch).toHaveBeenCalledWith('/releases/7/phase', { phase: 'CATALOG' })
  })

  it('delete sends a DELETE for the release id', async () => {
    api.delete.mockResolvedValue({ status: 204 })

    await releaseService.delete(7)

    expect(api.delete).toHaveBeenCalledWith('/releases/7')
  })

  it.each([
    ['getAll', 'get', [{}]],
    ['getById', 'get', [7]],
    ['create', 'post', [{}]],
    ['update', 'patch', [7, {}]],
    ['updatePhase', 'patch', [7, 'PROMO']],
    ['delete', 'delete', [7]],
  ])('%s passes API errors to the caller untouched', async (method, httpMethod, args) => {
    const error = httpError(500)
    api[httpMethod].mockRejectedValue(error)

    await expect(releaseService[method](...args)).rejects.toBe(error)
  })
})