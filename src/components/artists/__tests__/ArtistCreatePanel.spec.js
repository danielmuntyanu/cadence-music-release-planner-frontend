import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ArtistCreatePanel from '@/components/artists/ArtistCreatePanel.vue'
import { artistService } from '@/services/artist.service'
import { findButton, findField, mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { create: vi.fn() },
}))

async function submit(wrapper) {
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

async function fillNameAndAddLink(wrapper) {
  await findField(wrapper, 'Name').find('input').setValue('Nova')
  await findButton(wrapper, 'Add link').trigger('click')
}

describe('ArtistCreatePanel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks submission without a name', async () => {
    const wrapper = mountWithPlugins(ArtistCreatePanel)

    await submit(wrapper)

    expect(artistService.create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Name is required')
  })

  it('rejects an invalid avatar URL', async () => {
    const wrapper = mountWithPlugins(ArtistCreatePanel)
    await findField(wrapper, 'Name').find('input').setValue('Nova')
    await findField(wrapper, 'Avatar URL').find('input').setValue('not-a-url')

    await submit(wrapper)

    expect(artistService.create).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Enter a valid URL')
  })

  it('creates the artist and emits it', async () => {
    const created = makeArtist({ name: 'Nova' })
    artistService.create.mockResolvedValue(created)
    const wrapper = mountWithPlugins(ArtistCreatePanel)
    await findField(wrapper, 'Name').find('input').setValue('  Nova ')
    await findField(wrapper, 'Genre').find('input').setValue('Synthwave')

    await submit(wrapper)

    expect(artistService.create).toHaveBeenCalledWith({
      name: 'Nova',
      genre: 'Synthwave',
      description: '',
      avatarUrl: '',
      bannerUrl: '',
      socials: [],
    })
    expect(wrapper.emitted('created')[0]).toEqual([created])
  })

  it('shows a readable message when the API rejects the data', async () => {
    artistService.create.mockRejectedValue({ response: { status: 400 } })
    const wrapper = mountWithPlugins(ArtistCreatePanel)
    await findField(wrapper, 'Name').find('input').setValue('Nova')

    await submit(wrapper)

    expect(wrapper.text()).toContain('Some fields are invalid')
    expect(wrapper.emitted('created')).toBeUndefined()
  })

  it('emits cancel', async () => {
    const wrapper = mountWithPlugins(ArtistCreatePanel)

    await findButton(wrapper, 'Cancel').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  describe('links', () => {
    it('requires a URL for an added link', async () => {
      const wrapper = mountWithPlugins(ArtistCreatePanel)
      await fillNameAndAddLink(wrapper)

      await submit(wrapper)

      expect(artistService.create).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('URL is required')
    })

    it('rejects an invalid link URL', async () => {
      const wrapper = mountWithPlugins(ArtistCreatePanel)
      await fillNameAndAddLink(wrapper)
      await findField(wrapper, 'URL').find('input').setValue('spotify artist page')

      await submit(wrapper)

      expect(artistService.create).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Enter a valid URL')
    })

    it('sends a valid link with the first unused platform', async () => {
      artistService.create.mockResolvedValue(makeArtist({ name: 'Nova' }))
      const wrapper = mountWithPlugins(ArtistCreatePanel)
      await fillNameAndAddLink(wrapper)
      await findField(wrapper, 'URL').find('input').setValue(' https://open.spotify.com/artist/1 ')

      await submit(wrapper)

      expect(artistService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          socials: [{ platform: 'SPOTIFY', url: 'https://open.spotify.com/artist/1' }],
        }),
      )
    })

    it('removes a link row', async () => {
      const wrapper = mountWithPlugins(ArtistCreatePanel)
      await fillNameAndAddLink(wrapper)
      expect(findField(wrapper, 'URL')).toBeDefined()

      await wrapper.find('button[aria-label="Remove SPOTIFY link"]').trigger('click')

      expect(findField(wrapper, 'URL')).toBeUndefined()
    })
  })
})