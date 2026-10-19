import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ArtistBio from '@/components/artists/ArtistBio.vue'
import { mountWithPlugins } from '@/test-utils/mount'

let resizeCallbacks = []

// Controllable observer: the component measures only when a resize is reported
class ResizeObserverMock {
  constructor(callback) {
    resizeCallbacks.push(callback)
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom has no layout engine, so overflow is simulated through element metrics
function mockLayout({ scrollHeight, clientHeight }) {
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(clientHeight)
}

async function mountBio(text) {
  const wrapper = mountWithPlugins(ArtistBio, { props: { text } })
  resizeCallbacks.forEach((callback) => callback([]))
  await nextTick()
  return wrapper
}

describe('ArtistBio', () => {
  beforeEach(() => {
    resizeCallbacks = []
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the placeholder when there is no bio', async () => {
    const wrapper = await mountBio('')
    expect(wrapper.text()).toContain('No bio yet.')
  })

  it('hides the toggle when the text fits', async () => {
    mockLayout({ scrollHeight: 40, clientHeight: 40 })
    const wrapper = await mountBio('Short bio')

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('expands and collapses an overflowing bio', async () => {
    mockLayout({ scrollHeight: 120, clientHeight: 40 })
    const wrapper = await mountBio('A very long bio...')
    const toggle = wrapper.find('button')
    const paragraph = wrapper.find('p')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(paragraph.classes()).toContain('line-clamp-2')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-label')).toBe('Show less')
    expect(paragraph.classes()).not.toContain('line-clamp-2')
  })
})