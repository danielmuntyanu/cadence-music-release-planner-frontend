import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ArtistDeleteDialog from '@/components/artists/ArtistDeleteDialog.vue'
import { artistService } from '@/services/artist.service'
import { findButton, mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { delete: vi.fn() },
}))

/**
 * Dialog content is teleported to document.body, outside the wrapper's DOM.
 * findComponent walks the component tree instead, so it reaches the teleported card.
 */
async function openDialog(artist) {
  const wrapper = mountWithPlugins(ArtistDeleteDialog, {
    props: { modelValue: false, artist },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return { wrapper, dialog: wrapper.findComponent({ name: 'VCard' }) }
}

async function confirm(dialog) {
  await findButton(dialog, 'Delete artist').trigger('click')
  await flushPromises()
}

describe('ArtistDeleteDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('warns that releases will lose their artist', async () => {
    const { dialog } = await openDialog(makeArtist({ name: 'Nova', releaseCount: 3 }))

    expect(dialog.text()).toContain('Delete Nova?')
    expect(dialog.text()).toContain('3 releases will stay in your planner without an artist')
  })

  it('shows a plain warning when the artist has no releases', async () => {
    const { dialog } = await openDialog(makeArtist({ releaseCount: 0 }))

    expect(dialog.text()).toContain("This can't be undone.")
  })

  it('deletes the artist and emits it', async () => {
    const artist = makeArtist()
    artistService.delete.mockResolvedValue()
    const { wrapper, dialog } = await openDialog(artist)

    await confirm(dialog)

    expect(artistService.delete).toHaveBeenCalledWith(artist.id)
    expect(wrapper.emitted('deleted')[0]).toEqual([artist])
  })

  it('shows a message when the artist was already deleted', async () => {
    artistService.delete.mockRejectedValue({ response: { status: 404 } })
    const { wrapper, dialog } = await openDialog(makeArtist())

    await confirm(dialog)

    expect(dialog.text()).toContain('This artist was already deleted.')
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })
})