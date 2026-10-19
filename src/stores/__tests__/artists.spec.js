import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useArtistsStore } from '@/stores/artists'
import { artistService } from '@/services/artist.service'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

describe('artists store', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('load', () => {
    it('fetches once and sorts artists by name', async () => {
      artistService.getAll.mockResolvedValue([makeArtist({ name: 'Zed' }), makeArtist({ name: 'Ada' })])
      const store = useArtistsStore()

      await Promise.all([store.load(), store.load()])

      expect(artistService.getAll).toHaveBeenCalledTimes(1)
      expect(store.artists.map((a) => a.name)).toEqual(['Ada', 'Zed'])
      expect(store.ready).toBe(true)
    })

    it('stores the error and allows a retry after a failure', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      artistService.getAll.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce([])
      const store = useArtistsStore()

      await store.load()
      expect(store.error).toBeTruthy()
      expect(store.ready).toBe(false)

      await store.load()
      expect(artistService.getAll).toHaveBeenCalledTimes(2)
      expect(store.error).toBeNull()
      expect(store.isEmpty).toBe(true)
    })
  })

  it('inserts a created artist in name order', async () => {
    artistService.getAll.mockResolvedValue([makeArtist({ name: 'Ada' }), makeArtist({ name: 'Zed' })])
    artistService.create.mockResolvedValue(makeArtist({ name: 'Mia' }))
    const store = useArtistsStore()
    await store.load()

    await store.create({ name: 'Mia' })

    expect(store.artists.map((a) => a.name)).toEqual(['Ada', 'Mia', 'Zed'])
  })

  it('replaces an updated artist', async () => {
    const artist = makeArtist({ name: 'Ada' })
    artistService.getAll.mockResolvedValue([artist])
    artistService.update.mockResolvedValue({ ...artist, genre: 'House' })
    const store = useArtistsStore()
    await store.load()

    await store.update(artist.id, { genre: 'House' })

    expect(store.findById(artist.id).genre).toBe('House')
  })

  it('removes a deleted artist', async () => {
    const artist = makeArtist()
    artistService.getAll.mockResolvedValue([artist])
    artistService.delete.mockResolvedValue()
    const store = useArtistsStore()
    await store.load()

    await store.remove(artist.id)

    expect(store.artists).toEqual([])
  })

  it('keeps the list unchanged when a mutation fails', async () => {
    const artist = makeArtist()
    artistService.getAll.mockResolvedValue([artist])
    artistService.delete.mockRejectedValue({ response: { status: 404 } })
    const store = useArtistsStore()
    await store.load()

    await expect(store.remove(artist.id)).rejects.toBeTruthy()
    expect(store.artists).toEqual([artist])
  })

  it('fetchById adds a missing artist and replaces an existing one', async () => {
    const artist = makeArtist({ name: 'Ada' })
    artistService.getById.mockResolvedValueOnce(artist).mockResolvedValueOnce({ ...artist, name: 'Ada K' })
    const store = useArtistsStore()

    await store.fetchById(artist.id)
    await store.fetchById(artist.id)

    expect(store.artists).toHaveLength(1)
    expect(store.artists[0].name).toBe('Ada K')
  })

  it('reset clears data and lets load fetch again', async () => {
    artistService.getAll.mockResolvedValue([makeArtist()])
    const store = useArtistsStore()
    await store.load()

    store.reset()
    expect(store.artists).toEqual([])
    expect(store.ready).toBe(false)

    await store.load()
    expect(artistService.getAll).toHaveBeenCalledTimes(2)
  })
})