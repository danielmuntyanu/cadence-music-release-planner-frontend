import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ArtistImagesSection from '@/components/artists/ArtistImagesSection.vue'
import ImageInput from '@/components/media/ImageInput.vue'
import { artistService } from '@/services/artist.service'
import { useArtistsStore } from '@/stores/artists'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn(), update: vi.fn(), uploadImage: vi.fn(), removeImage: vi.fn() },
}))

const nova = makeArtist({ name: 'Nova', avatarUrl: 'https://signed.test/a.jpg', bannerUrl: null })

async function mountSection() {
  artistService.getAll.mockResolvedValue([nova])
  await useArtistsStore().load()
  const wrapper = mountWithPlugins(ArtistImagesSection, { props: { artistId: nova.id } })
  const [avatar, banner] = wrapper.findAllComponents(ImageInput)
  return { wrapper, avatar, banner }
}

describe('ArtistImagesSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the current images from the store', async () => {
    const { avatar, banner } = await mountSection()

    expect(avatar.props('shape')).toBe('circle')
    expect(avatar.props('src')).toBe('https://signed.test/a.jpg')
    expect(banner.props('shape')).toBe('wide')
    expect(banner.props('src')).toBeNull()
  })

  it('uploads the avatar to the avatar slot and updates the store', async () => {
    artistService.uploadImage.mockResolvedValue({ ...nova, avatarUrl: 'https://signed.test/new.jpg' })
    const { wrapper, avatar } = await mountSection()
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const onProgress = vi.fn()

    await avatar.props('upload')(file, onProgress)
    await flushPromises()

    expect(artistService.uploadImage).toHaveBeenCalledWith(nova.id, 'avatar', file, onProgress)
    expect(avatar.props('src')).toBe('https://signed.test/new.jpg')
    expect(wrapper.findAllComponents(ImageInput)[0].props('src')).toBe('https://signed.test/new.jpg')
  })

  it('saves a banner link through the artist PATCH', async () => {
    artistService.update.mockResolvedValue({ ...nova, bannerUrl: 'https://img.test/b.jpg' })
    const { banner } = await mountSection()

    await banner.props('saveLink')('https://img.test/b.jpg')

    expect(artistService.update).toHaveBeenCalledWith(nova.id, { bannerUrl: 'https://img.test/b.jpg' })
  })

  it('removes the avatar', async () => {
    artistService.removeImage.mockResolvedValue({ ...nova, avatarUrl: null })
    const { avatar } = await mountSection()

    await avatar.props('remove')()

    expect(artistService.removeImage).toHaveBeenCalledWith(nova.id, 'avatar')
  })

  it('re-emits a change from any image', async () => {
    const { wrapper, banner } = await mountSection()

    banner.vm.$emit('uploaded')

    expect(wrapper.emitted('changed')).toHaveLength(1)
  })
})