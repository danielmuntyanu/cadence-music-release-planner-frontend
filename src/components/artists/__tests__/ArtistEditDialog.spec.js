import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ArtistEditDialog from '@/components/artists/ArtistEditDialog.vue'
import { artistService } from '@/services/artist.service'
import { findButton, findField, mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { update: vi.fn() },
}))

/**
 * Opened after mount, as in the app: the draft is built on the closed -> open transition.
 * Dialog content is teleported, so it is queried through findComponent.
 */
async function openDialog(artist) {
  const wrapper = mountWithPlugins(ArtistEditDialog, {
    props: { modelValue: false, artist },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return { wrapper, dialog: wrapper.findComponent({ name: 'VCard' }) }
}

async function submit(dialog) {
  await dialog.find('form').trigger('submit')
  await flushPromises()
}

describe('ArtistEditDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prefills the form from the artist', async () => {
    const { dialog } = await openDialog(makeArtist({ name: 'Nova', genre: 'Synthwave' }))

    expect(findField(dialog, 'Name').find('input').element.value).toBe('Nova')
    expect(findField(dialog, 'Genre').find('input').element.value).toBe('Synthwave')
  })

  it('keeps Save disabled until something changes', async () => {
    const { dialog } = await openDialog(makeArtist({ name: 'Nova' }))
    expect(findButton(dialog, 'Save changes').attributes('disabled')).toBeDefined()

    await findField(dialog, 'Name').find('input').setValue('Nova Remix')

    expect(findButton(dialog, 'Save changes').attributes('disabled')).toBeUndefined()
  })

  it('does not count whitespace-only edits as changes', async () => {
    const { dialog } = await openDialog(makeArtist({ name: 'Nova' }))

    await findField(dialog, 'Name').find('input').setValue('Nova   ')

    expect(findButton(dialog, 'Save changes').attributes('disabled')).toBeDefined()
  })

  it('saves the changes and closes', async () => {
    const artist = makeArtist({ name: 'Nova' })
    const updated = { ...artist, name: 'Nova Remix' }
    artistService.update.mockResolvedValue(updated)
    const { wrapper, dialog } = await openDialog(artist)
    await findField(dialog, 'Name').find('input').setValue('Nova Remix')

    await submit(dialog)

    expect(artistService.update).toHaveBeenCalledWith(artist.id, expect.objectContaining({ name: 'Nova Remix' }))
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    expect(wrapper.emitted('updated')[0]).toEqual([updated])
  })

  it('stays open and explains when the artist no longer exists', async () => {
    artistService.update.mockRejectedValue({ response: { status: 404 } })
    const { wrapper, dialog } = await openDialog(makeArtist({ name: 'Nova' }))
    await findField(dialog, 'Name').find('input').setValue('Nova Remix')

    await submit(dialog)

    expect(dialog.text()).toContain('This artist no longer exists.')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })
})