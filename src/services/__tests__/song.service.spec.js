import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { songService } from '@/services/song.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const SONG_DTO = { id: 71, trackNumber: 1, title: 'Intro', status: 'WRITING' }
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('songService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll reads the release tracklist', async () => {
    api.get.mockResolvedValue({ data: [SONG_DTO] })

    const songs = await songService.getAll(42)

    expect(api.get).toHaveBeenCalledWith('/releases/42/songs')
    expect(songs[0].title).toBe('Intro')
  })

  it('create posts to the release', async () => {
    api.post.mockResolvedValue({ data: SONG_DTO })
    const payload = { title: 'Intro', status: 'WRITING' }

    await songService.create(42, payload)

    expect(api.post).toHaveBeenCalledWith('/releases/42/songs', payload)
  })

  it('replace puts the whole song', async () => {
    api.put.mockResolvedValue({ data: SONG_DTO })
    const payload = { title: 'Intro', status: 'DONE' }

    await songService.replace(42, 71, payload)

    expect(api.put).toHaveBeenCalledWith('/releases/42/songs/71', payload)
  })

  it('updateStatus patches only the status', async () => {
    api.patch.mockResolvedValue({ data: { ...SONG_DTO, status: 'DONE' } })

    const song = await songService.updateStatus(42, 71, 'DONE')

    expect(api.patch).toHaveBeenCalledWith('/releases/42/songs/71/status', { status: 'DONE' })
    expect(song.status).toBe('DONE')
  })

  it('reorder puts the full order and returns the confirmed tracklist', async () => {
    api.put.mockResolvedValue({ data: [{ ...SONG_DTO, id: 73 }, SONG_DTO] })

    const songs = await songService.reorder(42, [73, 71])

    expect(api.put).toHaveBeenCalledWith('/releases/42/songs/order', { songIds: [73, 71] })
    expect(songs.map((song) => song.id)).toEqual([73, 71])
  })

  it('delete removes the song', async () => {
    api.delete.mockResolvedValue({ status: 204 })

    await songService.delete(42, 71)

    expect(api.delete).toHaveBeenCalledWith('/releases/42/songs/71')
  })

  it.each([
    ['getAll', 'get', [42]],
    ['create', 'post', [42, {}]],
    ['replace', 'put', [42, 71, {}]],
    ['updateStatus', 'patch', [42, 71, 'DONE']],
    ['reorder', 'put', [42, [71]]],
    ['delete', 'delete', [42, 71]],
  ])('%s passes API errors to the caller untouched', async (method, httpMethod, args) => {
    const error = httpError(500)
    api[httpMethod].mockRejectedValue(error)

    await expect(songService[method](...args)).rejects.toBe(error)
  })
})