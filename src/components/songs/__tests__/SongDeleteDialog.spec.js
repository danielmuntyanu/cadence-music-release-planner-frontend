import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import SongDeleteDialog from '@/components/songs/SongDeleteDialog.vue'
import { songService } from '@/services/song.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeSong } from '@/test-utils/fixtures/songs'

vi.mock('@/services/song.service', () => ({
  songService: { delete: vi.fn() },
}))

const SONG = makeSong({ id: 72, title: 'Piano Before Midnight' })

async function openDialog() {
  const wrapper = mountWithPlugins(SongDeleteDialog, {
    props: { modelValue: false, releaseId: 42, song: SONG },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

// v-dialog teleports its content: search the component tree, not the wrapper's DOM
const button = (wrapper, text) =>
  wrapper.findAllComponents({ name: 'VBtn' }).find((btn) => btn.text() === text)

describe('SongDeleteDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('names the song and explains what happens to the tracklist', async () => {
    await openDialog()

    expect(document.body.textContent).toContain('Delete “Piano Before Midnight”?')
    expect(document.body.textContent).toContain('The tracks after it move up one place')
  })

  it('deletes the song of this release, reports it and closes', async () => {
    songService.delete.mockResolvedValue({ status: 204 })
    const wrapper = await openDialog()

    await button(wrapper, 'Delete song').trigger('click')
    await flushPromises()

    expect(songService.delete).toHaveBeenCalledWith(42, 72)
    expect(wrapper.emitted('deleted')).toEqual([[SONG]])
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('stays open with a message when the song is already gone', async () => {
    songService.delete.mockRejectedValue({ response: { status: 404 } })
    const wrapper = await openDialog()

    await button(wrapper, 'Delete song').trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('This song was already deleted.')
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })

  it('Cancel closes without deleting', async () => {
    const wrapper = await openDialog()

    await button(wrapper, 'Cancel').trigger('click')

    expect(songService.delete).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('clears an old error when opened again', async () => {
    songService.delete.mockRejectedValueOnce({ response: { status: 404 } })
    const wrapper = await openDialog()
    await button(wrapper, 'Delete song').trigger('click')
    await flushPromises()

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(document.body.textContent).not.toContain('This song was already deleted.')
  })
})