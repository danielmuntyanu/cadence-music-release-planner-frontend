import { describe, expect, it } from 'vitest'
import ArtistBanner from '@/components/artists/ArtistBanner.vue'
import { mountWithPlugins } from '@/test-utils/mount'

const fallback = (wrapper) => wrapper.find('.artist-banner-fallback')

describe('ArtistBanner', () => {
  it('shows the image when there is one', () => {
    const wrapper = mountWithPlugins(ArtistBanner, { props: { src: 'https://img.test/b.jpg', alt: 'Nova banner' } })

    const image = wrapper.findComponent({ name: 'VImg' })
    expect(image.props('src')).toBe('https://img.test/b.jpg')
    expect(image.props('alt')).toBe('Nova banner')
    expect(fallback(wrapper).exists()).toBe(false)
  })

  it('shows the gradient without an image', () => {
    const wrapper = mountWithPlugins(ArtistBanner)

    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(false)
    expect(fallback(wrapper).exists()).toBe(true)
  })

  it('falls back to the gradient when the image fails, e.g. an expired signed URL', async () => {
    const wrapper = mountWithPlugins(ArtistBanner, { props: { src: 'https://signed.test/expired.jpg' } })

    await wrapper.findComponent({ name: 'VImg' }).vm.$emit('error')

    expect(fallback(wrapper).exists()).toBe(true)
  })

  it('tries again when a new image arrives', async () => {
    const wrapper = mountWithPlugins(ArtistBanner, { props: { src: 'https://signed.test/expired.jpg' } })
    await wrapper.findComponent({ name: 'VImg' }).vm.$emit('error')

    await wrapper.setProps({ src: 'https://signed.test/fresh.jpg' })

    expect(wrapper.findComponent({ name: 'VImg' }).props('src')).toBe('https://signed.test/fresh.jpg')
  })

  it('renders slot content over the gradient only', async () => {
    const wrapper = mountWithPlugins(ArtistBanner, { slots: { default: '<span class="hint">Add banner</span>' } })
    expect(wrapper.find('.hint').exists()).toBe(true)

    await wrapper.setProps({ src: 'https://img.test/b.jpg' })
    expect(wrapper.find('.hint').exists()).toBe(false)
  })
})