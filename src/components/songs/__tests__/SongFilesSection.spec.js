import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import SongFilesSection from '@/components/songs/SongFilesSection.vue'
import AudioUploader from '@/components/songs/AudioUploader.vue'
import DownloadButton from '@/components/common/DownloadButton.vue'
import { songService } from '@/services/song.service'
import { usePlayerStore } from '@/stores/player'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeSong } from '@/test-utils/fixtures/songs'

vi.mock('@/services/song.service', () => ({
  songService: {
    getFiles: vi.fn(),
    uploadFile: vi.fn(),
    renameFile: vi.fn(),
    setPrimaryFile: vi.fn(),
    fileDownloadLink: vi.fn(),
    deleteFile: vi.fn(),
  },
}))

const RELEASE = { id: 42, name: 'Neon Siesta', artworkUrl: null }
const SONG = makeSong({ id: 71, title: 'Siesta Lights' })
const file = (id, name, extra = {}) => ({
  id, displayName: name, originalFilename: `${name}.wav`, contentType: 'audio/wav',
  sizeBytes: 2 * 1024 * 1024, uploadedAt: '2026-10-28T10:00:00Z', primary: false,
  url: `https://signed.test/${id}.wav`, ...extra,
})
const MASTER = file(82, 'master', { primary: true })
const MIX = file(81, 'mix3')

async function mountSection(files = [MASTER, MIX]) {
  songService.getFiles.mockResolvedValue(files)
  const wrapper = mountWithPlugins(SongFilesSection, { props: { release: RELEASE, song: SONG }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

const rows = (wrapper) => wrapper.findAll('.file-row')
const button = (wrapper, label) => wrapper.find(`button[aria-label="${label}"]`)
const anyButton = (wrapper, text) => wrapper.findAllComponents({ name: 'VBtn' }).find((btn) => btn.text() === text)

async function openMenuItem(wrapper, fileName, title) {
  await button(wrapper, `Actions for ${fileName}`).trigger('click')
  await flushPromises()
  await wrapper.findAllComponents({ name: 'VListItem' }).find((item) => item.props('title') === title).trigger('click')
  await flushPromises()
}

describe('SongFilesSection', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('list', () => {
    it('shows each file with its type, size and the heart', async () => {
      const wrapper = await mountSection()

      expect(songService.getFiles).toHaveBeenCalledWith(42, 71)
      expect(rows(wrapper)).toHaveLength(2)
      expect(rows(wrapper)[0].text()).toContain('master')
      expect(rows(wrapper)[0].text()).toContain('WAV · 2 MB')
      expect(button(wrapper, 'master is the main file. Unmark it').attributes('aria-pressed')).toBe('true')
      expect(button(wrapper, 'Mark mix3 as the main file').attributes('aria-pressed')).toBe('false')
    })

    it('invites an upload when there is no audio', async () => {
      const wrapper = await mountSection([])

      expect(wrapper.text()).toContain('No audio yet. Add a demo, a mix or a master.')
      expect(wrapper.findComponent(AudioUploader).exists()).toBe(true)
    })

    it('offers a retry when loading fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      songService.getFiles.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce([MIX])
      const wrapper = mountWithPlugins(SongFilesSection, { props: { release: RELEASE, song: SONG } })
      await flushPromises()
      expect(wrapper.text()).toContain('Could not load the files.')

      await wrapper.findAll('button').find((b) => b.text() === 'Retry').trigger('click')
      await flushPromises()

      expect(rows(wrapper)).toHaveLength(1)
    })
  })

  describe('actions', () => {
    it('plays a file through the global player', async () => {
      const wrapper = await mountSection()
      const playFile = vi.spyOn(usePlayerStore(), 'playFile').mockResolvedValue()

      await button(wrapper, 'Play mix3').trigger('click')

      expect(playFile).toHaveBeenCalledWith(RELEASE, SONG, MIX, [MASTER, MIX])
    })

    it('moves the heart and reports the change', async () => {
      songService.setPrimaryFile.mockResolvedValue([{ ...MASTER, primary: false }, { ...MIX, primary: true }])
      const wrapper = await mountSection()

      await button(wrapper, 'Mark mix3 as the main file').trigger('click')
      await flushPromises()

      expect(songService.setPrimaryFile).toHaveBeenCalledWith(42, 71, 81)
      expect(button(wrapper, 'mix3 is the main file. Unmark it').exists()).toBe(true)
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    it('clears the heart when the main file is clicked', async () => {
      songService.setPrimaryFile.mockResolvedValue([{ ...MASTER, primary: false }, MIX])
      const wrapper = await mountSection()

      await button(wrapper, 'master is the main file. Unmark it').trigger('click')
      await flushPromises()

      expect(songService.setPrimaryFile).toHaveBeenCalledWith(42, 71, null)
    })

    it('reports a failed change in place', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      songService.setPrimaryFile.mockRejectedValue(new Error('Network'))
      const wrapper = await mountSection()

      await button(wrapper, 'Mark mix3 as the main file').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Could not change the main file. Try again.')
      expect(wrapper.emitted('changed')).toBeUndefined()
    })

    it('downloads through a link fetched for that file', async () => {
      songService.fileDownloadLink.mockResolvedValue({ url: 'https://storage.test/download' })
      const wrapper = await mountSection()

      const download = wrapper.findAllComponents(DownloadButton).find((b) => b.props('label') === 'Download mix3')
      await download.props('getLink')()

      expect(songService.fileDownloadLink).toHaveBeenCalledWith(42, 71, 81)
    })
  })

  describe('rename', () => {
    it('saves a new name with Enter, without reloading the tracklist', async () => {
      songService.renameFile.mockResolvedValue({ ...MIX, displayName: 'Mix 3 (final)' })
      const wrapper = await mountSection()
      await openMenuItem(wrapper, 'mix3', 'Rename')

      const field = wrapper.findComponent({ name: 'VTextField' })
      field.vm.$emit('update:modelValue', '  Mix 3 (final) ')
      await flushPromises()
      await field.find('input').trigger('keydown', { key: 'Enter' })
      await flushPromises()

      expect(songService.renameFile).toHaveBeenCalledWith(42, 71, 81, 'Mix 3 (final)')
      expect(wrapper.text()).toContain('Mix 3 (final)')
      expect(wrapper.emitted('changed')).toBeUndefined()
    })

    it('Esc cancels without saving', async () => {
      const wrapper = await mountSection()
      await openMenuItem(wrapper, 'mix3', 'Rename')

      await wrapper.findComponent({ name: 'VTextField' }).find('input').trigger('keydown', { key: 'Escape' })

      expect(wrapper.findComponent({ name: 'VTextField' }).exists()).toBe(false)
      expect(songService.renameFile).not.toHaveBeenCalled()
    })

    it('an unchanged name saves nothing', async () => {
      const wrapper = await mountSection()
      await openMenuItem(wrapper, 'mix3', 'Rename')

      await button(wrapper, 'Save name').trigger('click')

      expect(songService.renameFile).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('asks first, then removes the file and reports the change', async () => {
      songService.deleteFile.mockResolvedValue({ status: 204 })
      const wrapper = await mountSection()
      await openMenuItem(wrapper, 'mix3', 'Delete')
      expect(document.body.textContent).toContain('Delete “mix3”?')

      await anyButton(wrapper, 'Delete file').trigger('click')
      await flushPromises()

      expect(songService.deleteFile).toHaveBeenCalledWith(42, 71, 81)
      expect(rows(wrapper)).toHaveLength(1)
      expect(wrapper.emitted('changed')).toHaveLength(1)
    })

    it('stops the player when the deleted file was playing', async () => {
      songService.deleteFile.mockResolvedValue({ status: 204 })
      const wrapper = await mountSection()
      const player = usePlayerStore()
      await player.playFile(RELEASE, SONG, MIX)
      const stop = vi.spyOn(player, 'stop')

      await openMenuItem(wrapper, 'mix3', 'Delete')
      await anyButton(wrapper, 'Delete file').trigger('click')
      await flushPromises()

      expect(stop).toHaveBeenCalled()
    })
  })

  it('puts a new upload at the top and reports the change', async () => {
    const wrapper = await mountSection([MIX])
    const uploaded = file(83, 'master_v5')

    wrapper.findComponent(AudioUploader).vm.$emit('uploaded', uploaded)
    await flushPromises()

    expect(rows(wrapper)[0].text()).toContain('master_v5')
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('uploads into this song', async () => {
    const wrapper = await mountSection([])
    const audio = new File(['x'], 'mix.wav')

    await wrapper.findComponent(AudioUploader).props('upload')(audio, { displayName: 'mix' })

    expect(songService.uploadFile).toHaveBeenCalledWith(42, 71, audio, { displayName: 'mix' })
  })
})