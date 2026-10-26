import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseArtworkDialog from '@/components/releases/ReleaseArtworkDialog.vue'
import ImageInput from '@/components/media/ImageInput.vue'
import { releaseService } from '@/services/release.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { uploadArtwork: vi.fn(), removeArtwork: vi.fn() },
}))

async function openDialog(release = makeRelease({ id: 42, artworkUrl: 'https://signed.test/old.jpg' })) {
  const wrapper = mountWithPlugins(ReleaseArtworkDialog, {
    props: { modelValue: false, release },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return { wrapper, input: wrapper.findComponent(ImageInput) }
}

describe('ReleaseArtworkDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the current cover as a square, without a link option', async () => {
    const { input } = await openDialog()

    expect(input.props('shape')).toBe('square')
    expect(input.props('src')).toBe('https://signed.test/old.jpg')
    // The server owns release covers: only uploads, no external links
    expect(input.props('saveLink')).toBeNull()
  })

  it('uploads to this release and reports the saved release', async () => {
    const saved = makeRelease({ id: 42, artworkUrl: 'https://signed.test/new.jpg' })
    releaseService.uploadArtwork.mockResolvedValue(saved)
    const { wrapper, input } = await openDialog()
    const file = new File(['x'], 'cover.png', { type: 'image/png' })
    const onProgress = vi.fn()

    await input.props('upload')(file, onProgress)

    expect(releaseService.uploadArtwork).toHaveBeenCalledWith(42, file, onProgress)
    expect(wrapper.emitted('updated')).toEqual([[saved]])
  })

  it('removes the cover', async () => {
    releaseService.removeArtwork.mockResolvedValue(makeRelease({ id: 42, artworkUrl: null }))
    const { wrapper, input } = await openDialog()

    await input.props('remove')()

    expect(releaseService.removeArtwork).toHaveBeenCalledWith(42)
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('closes after a successful change', async () => {
    const { wrapper, input } = await openDialog()

    await input.vm.$emit('uploaded')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })
})