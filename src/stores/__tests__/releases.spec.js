import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReleasesStore } from '@/stores/releases'
import { releaseService } from '@/services/release.service'
import { makePage, makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { getAll: vi.fn(), update: vi.fn(), updatePhase: vi.fn(), delete: vi.fn() },
}))

/** A promise the test resolves by hand, to control response order */
function deferred() {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

const DEFAULT_QUERY = { page: 0, size: 24, sort: 'createdAt,desc' }

describe('releases store', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fetchPage', () => {
    it('loads a page with the current filters and sort', async () => {
      const releases = [makeRelease(), makeRelease()]
      releaseService.getAll.mockResolvedValue(makePage(releases))
      const store = useReleasesStore()

      await store.fetchPage()

      expect(releaseService.getAll).toHaveBeenCalledWith(DEFAULT_QUERY)
      expect(store.releases).toEqual(releases)
      expect(store.page.totalElements).toBe(2)
      expect(store.ready).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('stores the error and stays not ready when loading fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      releaseService.getAll.mockRejectedValue(new Error('Network'))
      const store = useReleasesStore()

      await store.fetchPage()

      expect(store.error).toBeTruthy()
      expect(store.ready).toBe(false)
      expect(store.loading).toBe(false)
    })

    it('ignores a slow earlier response that arrives after a newer one', async () => {
      const slow = deferred()
      const fast = makePage([makeRelease({ name: 'Newer' })])
      releaseService.getAll.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(fast)
      const store = useReleasesStore()

      const first = store.fetchPage()
      await store.fetchPage()
      slow.resolve(makePage([makeRelease({ name: 'Older' })]))
      await first

      expect(store.releases.map((r) => r.name)).toEqual(['Newer'])
    })

    it('falls back to the last page when asked for a page past the end', async () => {
      releaseService.getAll
        .mockResolvedValueOnce(makePage([], { number: 5, totalElements: 30 }))
        .mockResolvedValueOnce(makePage([makeRelease()], { number: 1, totalElements: 30 }))
      const store = useReleasesStore()

      await store.fetchPage(5)

      expect(releaseService.getAll).toHaveBeenLastCalledWith({ ...DEFAULT_QUERY, page: 1 })
      expect(store.page.number).toBe(1)
    })
  })

  describe('filters, sort and paging', () => {
    beforeEach(() => releaseService.getAll.mockResolvedValue(makePage([])))

    it('setFilters merges the change and reloads from the first page', async () => {
      const store = useReleasesStore()
      store.page.number = 3

      await store.setFilters({ phase: ['PROMO'] })
      await store.setFilters({ q: 'night' })

      expect(store.filters.phase).toEqual(['PROMO'])
      expect(releaseService.getAll).toHaveBeenLastCalledWith({ ...DEFAULT_QUERY, phase: ['PROMO'], q: 'night' })
    })

    it('clearFilters resets every filter but keeps the sort', async () => {
      const store = useReleasesStore()
      await store.setSort('name,asc')
      await store.setFilters({ phase: ['PROMO'], artistId: 7 })

      await store.clearFilters()

      expect(store.hasFilters).toBe(false)
      expect(releaseService.getAll).toHaveBeenLastCalledWith({ ...DEFAULT_QUERY, sort: 'name,asc' })
    })

    it('setPage loads the requested page with the same filters', async () => {
      const store = useReleasesStore()
      await store.setFilters({ genre: ['POP'] })

      await store.setPage(2)

      expect(releaseService.getAll).toHaveBeenLastCalledWith({ ...DEFAULT_QUERY, page: 2, genre: ['POP'] })
    })

    it('hydrate applies filters, sort and page with a single request', async () => {
      const store = useReleasesStore()

      await store.hydrate({
        filters: { phase: ['PROMO'], type: [], genre: [], artistId: 7, q: '' },
        sort: 'name,asc',
        page: 1,
      })

      expect(releaseService.getAll).toHaveBeenCalledTimes(1)
      expect(releaseService.getAll).toHaveBeenCalledWith({ page: 1, size: 24, sort: 'name,asc', phase: ['PROMO'], artistId: 7 })
    })
  })

  describe('empty states', () => {
    it('isEmpty is true only for a catalog with no releases and no filters', async () => {
      releaseService.getAll.mockResolvedValue(makePage([]))
      const store = useReleasesStore()

      await store.fetchPage()
      expect(store.isEmpty).toBe(true)

      await store.setFilters({ q: 'nothing' })
      // Filtered to nothing is "no results", not an empty catalog
      expect(store.isEmpty).toBe(false)
      expect(store.hasFilters).toBe(true)
    })

    it('ignores whitespace-only search text when deciding hasFilters', async () => {
      releaseService.getAll.mockResolvedValue(makePage([]))
      const store = useReleasesStore()

      await store.setFilters({ q: '   ' })

      expect(store.hasFilters).toBe(false)
    })
  })

  describe('mutations', () => {
    it('updatePhase replaces the release in place and keeps it visible under a phase filter', async () => {
      // Deliberate: the user sees what they changed until they reload or change filters
      const release = makeRelease({ phase: 'PRE_RELEASE' })
      releaseService.getAll.mockResolvedValue(makePage([release]))
      releaseService.updatePhase.mockResolvedValue({ ...release, phase: 'PROMO' })
      const store = useReleasesStore()
      await store.setFilters({ phase: ['PRE_RELEASE'] })

      await store.updatePhase(release.id, 'PROMO')

      expect(store.releases).toHaveLength(1)
      expect(store.findById(release.id).phase).toBe('PROMO')
      expect(releaseService.getAll).toHaveBeenCalledTimes(1)
    })

    it('update replaces the release in place', async () => {
      const release = makeRelease({ notes: '' })
      releaseService.getAll.mockResolvedValue(makePage([release]))
      releaseService.update.mockResolvedValue({ ...release, notes: 'Final mix' })
      const store = useReleasesStore()
      await store.fetchPage()

      await store.update(release.id, { notes: 'Final mix' })

      expect(store.findById(release.id).notes).toBe('Final mix')
    })

    it('remove reloads the current page', async () => {
      const releases = [makeRelease(), makeRelease()]
      releaseService.getAll.mockResolvedValue(makePage(releases, { number: 1, totalElements: 26 }))
      releaseService.delete.mockResolvedValue()
      const store = useReleasesStore()
      await store.fetchPage(1)

      await store.remove(releases[0].id)

      expect(releaseService.delete).toHaveBeenCalledWith(releases[0].id)
      expect(releaseService.getAll).toHaveBeenLastCalledWith({ ...DEFAULT_QUERY, page: 1 })
    })

    it('remove steps back a page when it deletes the last release on it', async () => {
      const release = makeRelease()
      releaseService.getAll
        .mockResolvedValueOnce(makePage([release], { number: 1, totalElements: 25 }))
        .mockResolvedValueOnce(makePage([makeRelease()], { number: 0, totalElements: 24 }))
      releaseService.delete.mockResolvedValue()
      const store = useReleasesStore()
      await store.fetchPage(1)

      await store.remove(release.id)

      expect(releaseService.getAll).toHaveBeenLastCalledWith({ ...DEFAULT_QUERY, page: 0 })
    })

    it('a failed mutation is rethrown and leaves the list unchanged', async () => {
      const release = makeRelease()
      releaseService.getAll.mockResolvedValue(makePage([release]))
      releaseService.updatePhase.mockRejectedValue({ response: { status: 404 } })
      const store = useReleasesStore()
      await store.fetchPage()

      await expect(store.updatePhase(release.id, 'PROMO')).rejects.toBeTruthy()
      expect(store.releases).toEqual([release])
    })
  })

  describe('reset', () => {
    it('clears state and ignores a response still in flight', async () => {
      const pending = deferred()
      releaseService.getAll.mockReturnValueOnce(pending.promise)
      const store = useReleasesStore()

      const request = store.fetchPage()
      store.reset()
      pending.resolve(makePage([makeRelease()]))
      await request

      // The next account must never see the previous account's releases
      expect(store.releases).toEqual([])
      expect(store.ready).toBe(false)
      expect(store.hasFilters).toBe(false)
    })
  })
})