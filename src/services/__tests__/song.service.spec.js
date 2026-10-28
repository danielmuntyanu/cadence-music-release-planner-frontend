import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/services/api'
import { uploadService } from '@/services/upload.service'
import { songService } from '@/services/song.service'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/services/upload.service', () => ({
  uploadService: { putToStorage: vi.fn() },
}))

const SONG_DTO = { id: 71, trackNumber: 1, title: 'Intro', status: 'WRITING' }
const FILE_DTO = { id: 81, displayName: 'mix3', originalFilename: 'mix3.wav', primary: true, url: 'https://signed.test/a' }
const FILES_URL = '/releases/42/songs/71/files'
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } })

describe('songService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('songs', () => {
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
  })

  describe('files', () => {
    it('getFiles reads and maps the files of a song', async () => {
      api.get.mockResolvedValue({ data: [FILE_DTO] })

      const files = await songService.getFiles(42, 71)

      expect(api.get).toHaveBeenCalledWith(FILES_URL)
      expect(files).toEqual([expect.objectContaining({ id: 81, primary: true })])
    })

    describe('uploadFile', () => {
      const audio = new File(['abc'], 'mix3.wav', { type: 'audio/wav' })
      const UPLOAD = { key: 'users/1/song-files/k.wav', uploadUrl: 'https://storage.test/put', headers: { 'content-type': 'audio/wav' } }

      it('signs, uploads straight to storage, then confirms', async () => {
        api.post
          .mockResolvedValueOnce({ data: UPLOAD })
          .mockResolvedValueOnce({ data: FILE_DTO })
        uploadService.putToStorage.mockResolvedValue(undefined)
        const onProgress = vi.fn()
        const signal = new AbortController().signal

        const saved = await songService.uploadFile(42, 71, audio, { displayName: 'Mix 3', onProgress, signal })

        expect(api.post).toHaveBeenNthCalledWith(1, `${FILES_URL}/uploads`, { fileName: 'mix3.wav', sizeBytes: 3 }, { signal })
        expect(uploadService.putToStorage).toHaveBeenCalledWith(UPLOAD.uploadUrl, audio, UPLOAD.headers, { onProgress, signal })
        expect(api.post).toHaveBeenNthCalledWith(2, FILES_URL,
          { key: UPLOAD.key, fileName: 'mix3.wav', displayName: 'Mix 3' }, { signal })
        expect(saved).toMatchObject({ id: 81, primary: true })
      })

      it('lets the server name the file when no name is given', async () => {
        api.post.mockResolvedValueOnce({ data: UPLOAD }).mockResolvedValueOnce({ data: FILE_DTO })

        await songService.uploadFile(42, 71, audio)

        expect(api.post.mock.calls[1][1]).toMatchObject({ displayName: null })
      })

      it('does not confirm an upload that failed in storage', async () => {
        const error = httpError(403)
        api.post.mockResolvedValueOnce({ data: UPLOAD })
        uploadService.putToStorage.mockRejectedValue(error)

        await expect(songService.uploadFile(42, 71, audio)).rejects.toBe(error)

        expect(api.post).toHaveBeenCalledTimes(1)
      })
    })

    it('renameFile patches the name', async () => {
      api.patch.mockResolvedValue({ data: { ...FILE_DTO, displayName: 'Mix 3 (final)' } })

      const file = await songService.renameFile(42, 71, 81, 'Mix 3 (final)')

      expect(api.patch).toHaveBeenCalledWith(`${FILES_URL}/81`, { displayName: 'Mix 3 (final)' })
      expect(file.displayName).toBe('Mix 3 (final)')
    })

    it('setPrimaryFile moves the heart and returns the whole list', async () => {
      api.put.mockResolvedValue({ data: [FILE_DTO, { ...FILE_DTO, id: 82, primary: false }] })

      const files = await songService.setPrimaryFile(42, 71, 81)

      expect(api.put).toHaveBeenCalledWith('/releases/42/songs/71/primary-file', { fileId: 81 })
      expect(files).toHaveLength(2)
    })

    it('setPrimaryFile with null clears the heart', async () => {
      api.put.mockResolvedValue({ data: [] })

      await songService.setPrimaryFile(42, 71, null)

      expect(api.put).toHaveBeenCalledWith('/releases/42/songs/71/primary-file', { fileId: null })
    })

    it('fileDownloadLink returns the link as the server sent it', async () => {
      const link = { url: 'https://storage.test/download', expiresAt: '2026-10-28T12:05:00Z' }
      api.get.mockResolvedValue({ data: link })

      expect(await songService.fileDownloadLink(42, 71, 81)).toEqual(link)
      expect(api.get).toHaveBeenCalledWith(`${FILES_URL}/81/download`)
    })

    it('deleteFile removes the file', async () => {
      api.delete.mockResolvedValue({ status: 204 })

      await songService.deleteFile(42, 71, 81)

      expect(api.delete).toHaveBeenCalledWith(`${FILES_URL}/81`)
    })
  })

  it.each([
    ['getAll', 'get', [42]],
    ['create', 'post', [42, {}]],
    ['replace', 'put', [42, 71, {}]],
    ['updateStatus', 'patch', [42, 71, 'DONE']],
    ['reorder', 'put', [42, [71]]],
    ['delete', 'delete', [42, 71]],
    ['getFiles', 'get', [42, 71]],
    ['renameFile', 'patch', [42, 71, 81, 'x']],
    ['setPrimaryFile', 'put', [42, 71, 81]],
    ['fileDownloadLink', 'get', [42, 71, 81]],
    ['deleteFile', 'delete', [42, 71, 81]],
  ])('%s passes API errors to the caller untouched', async (method, httpMethod, args) => {
    const error = httpError(500)
    api[httpMethod].mockRejectedValue(error)

    await expect(songService[method](...args)).rejects.toBe(error)
  })
})