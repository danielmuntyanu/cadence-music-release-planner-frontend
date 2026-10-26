import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { VueDraggable } from 'vue-draggable-plus'
import ReleaseTracklistTab from '@/components/releases/tabs/ReleaseTracklistTab.vue'
import SongStatusMenu from '@/components/songs/SongStatusMenu.vue'
import SongDeleteDialog from '@/components/songs/SongDeleteDialog.vue'
import { songService } from '@/services/song.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/song.service', () => ({
  songService: { getAll: vi.fn(), reorder: vi.fn(), updateStatus: vi.fn(), delete: vi.fn() },
}))

const song = (id, title, extra = {}) => ({
  id, trackNumber: 0, title, durationSeconds: null, isrc: null,
  status: 'WRITING', lyrics: '', explicit: false, createdAt: null, ...extra,
})

const intro = song(71, 'Intro', { durationSeconds: 60 })
const title = song(72, 'Night Drive', { durationSeconds: 215, isrc: 'USABC2600001', explicit: true })
const outro = song(73, 'Outro', { durationSeconds: 125 })

async function mountTab(songs = [intro, title, outro]) {
  songService.getAll.mockResolvedValue(songs)
  const wrapper = mountWithPlugins(ReleaseTracklistTab, {
    props: { release: makeRelease({ id: 42, name: 'Night Drive' }) },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

const rowTitles = (wrapper) => wrapper.findAll('.song-row').map((row) => row.find('.song-title .truncate').text())

/** Simulates a drag that ends with the given order */
async function dragTo(wrapper, order) {
  const draggable = wrapper.findComponent(VueDraggable)
  draggable.vm.$emit('start')
  draggable.vm.$emit('update:modelValue', order)
  draggable.vm.$emit('end')
  await flushPromises()
}

describe('ReleaseTracklistTab', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('display', () => {
    it('loads the tracklist of this release', async () => {
      const wrapper = await mountTab()

      expect(songService.getAll).toHaveBeenCalledWith(42)
      expect(rowTitles(wrapper)).toEqual(['Intro', 'Night Drive', 'Outro'])
    })

    it('sums up the song count and total duration', async () => {
      const wrapper = await mountTab()

      expect(wrapper.text()).toContain('3 songs · 6:40')
    })

    it('marks explicit songs', async () => {
      const wrapper = await mountTab()

      const rows = wrapper.findAll('.song-row')
      expect(rows[1].find('[aria-label="Explicit"]').exists()).toBe(true)
      expect(rows[0].find('[aria-label="Explicit"]').exists()).toBe(false)
    })

    it('keeps the ISRC out of the row: it belongs to the song details', async () => {
      const wrapper = await mountTab()

      expect(wrapper.text()).not.toContain('US-ABC-26-00001')
      expect(wrapper.findComponent({ name: 'CopyButton' }).exists()).toBe(false)
    })

    it('shows an empty state without songs', async () => {
      const wrapper = await mountTab([])

      expect(wrapper.text()).toContain('No tracks yet')
    })
  })

  describe('reordering', () => {
    it('saves a dragged order and keeps the confirmed tracklist', async () => {
      songService.reorder.mockResolvedValue([outro, intro, title])
      const wrapper = await mountTab()

      await dragTo(wrapper, [outro, intro, title])

      expect(songService.reorder).toHaveBeenCalledWith(42, [73, 71, 72])
      expect(rowTitles(wrapper)).toEqual(['Outro', 'Intro', 'Night Drive'])
    })

    it('does not save when the order did not change', async () => {
      const wrapper = await mountTab()

      await dragTo(wrapper, [intro, title, outro])

      expect(songService.reorder).not.toHaveBeenCalled()
    })

    it('moves a song with the menu, for keyboard users', async () => {
      songService.reorder.mockResolvedValue([title, intro, outro])
      const wrapper = await mountTab()

      await wrapper.findAll('button[aria-label^="Actions for"]')[1].trigger('click')
      await flushPromises()
      await wrapper.findAllComponents({ name: 'VListItem' }).find((item) => item.props('title') === 'Move up').trigger('click')
      await flushPromises()

      expect(songService.reorder).toHaveBeenCalledWith(42, [72, 71, 73])
    })

    it('reloads the tracklist when the server says the order is stale', async () => {
      songService.reorder.mockRejectedValue({ response: { status: 400 } })
      const wrapper = await mountTab()
      songService.getAll.mockResolvedValue([intro, outro])

      await dragTo(wrapper, [outro, intro, title])

      expect(songService.getAll).toHaveBeenCalledTimes(2)
      expect(rowTitles(wrapper)).toEqual(['Intro', 'Outro'])
      expect(document.body.textContent).toContain('The tracklist changed elsewhere')
    })

    it('restores the previous order when saving fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      songService.reorder.mockRejectedValue(new Error('Network'))
      const wrapper = await mountTab()

      await dragTo(wrapper, [outro, intro, title])

      expect(rowTitles(wrapper)).toEqual(['Intro', 'Night Drive', 'Outro'])
      expect(document.body.textContent).toContain('Could not save the new order')
    })
  })

  describe('status and delete', () => {
    it('changes a status from the row', async () => {
      songService.updateStatus.mockResolvedValue({ ...intro, status: 'RECORDING' })
      const wrapper = await mountTab()

      wrapper.findAllComponents(SongStatusMenu)[0].vm.$emit('change', 'RECORDING')
      await flushPromises()

      expect(songService.updateStatus).toHaveBeenCalledWith(42, 71, 'RECORDING')
      expect(wrapper.findAllComponents(SongStatusMenu)[0].props('status')).toBe('RECORDING')
    })

    it('removes a deleted song from the list', async () => {
      const wrapper = await mountTab()

      wrapper.findComponent(SongDeleteDialog).vm.$emit('deleted', title)
      await flushPromises()

      expect(rowTitles(wrapper)).toEqual(['Intro', 'Outro'])
    })
  })

  it('summarizes length, explicit songs and statuses', async () => {
    const wrapper = await mountTab([
      intro,
      { ...title, status: 'DONE' },
      { ...outro, durationSeconds: null, status: 'DONE' },
    ])

    const text = wrapper.text()
    expect(text).toContain('1 without length')
    expect(text).toMatch(/Explicit\s*1/)
    expect(text).toMatch(/Done\s*2/)
    expect(text).toMatch(/Writing\s*1/)
  })
})