import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseHeader from '@/components/releases/ReleaseHeader.vue'
import ReleasePhaseMenu from '@/components/releases/ReleasePhaseMenu.vue'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import ReleaseArtworkDialog from '@/components/releases/ReleaseArtworkDialog.vue'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

// The header now contains ReleaseArtworkDialog, which imports the release service.
// The mock keeps these tests away from the real API.
vi.mock('@/services/release.service', () => ({
  releaseService: { uploadArtwork: vi.fn(), removeArtwork: vi.fn() },
}))

const mountHeader = (overrides = {}, props = {}) =>
  mountWithPlugins(ReleaseHeader, { props: { release: makeRelease(overrides), ...props } })

describe('ReleaseHeader', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 26, 12, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('shows the type, name, date countdown and genres', () => {
    const wrapper = mountHeader({
      type: 'EP',
      name: 'Night Drive',
      releaseDate: '2026-10-30',
      primaryGenre: 'POP',
      secondaryGenre: 'ELECTRONIC',
    })

    expect(wrapper.text()).toContain('EP')
    expect(wrapper.find('h1').text()).toBe('Night Drive')
    expect(wrapper.text()).toContain('Out in 4 days')
    expect(wrapper.text()).toContain('Pop · Electronic')
  })

  it('links every artist to their page, in order', () => {
    const wrapper = mountHeader({ artists: [{ id: 2, name: 'Ada' }, { id: 1, name: 'Nova' }] })

    const links = wrapper.findAll('a').filter((a) => ['Ada', 'Nova'].includes(a.text()))
    expect(links.map((a) => a.text())).toEqual(['Ada', 'Nova'])
    expect(links[0].attributes('href')).toBe('/artists/2')
  })

  it('says so when the release has no artist', () => {
    expect(mountHeader({ artists: [] }).text()).toContain('No artist yet')
  })

  it('re-emits a phase change and shows it as saving', async () => {
    const wrapper = mountHeader({}, { phaseSaving: true })
    const menu = wrapper.findComponent(ReleasePhaseMenu)

    expect(menu.props('loading')).toBe(true)
    menu.vm.$emit('change', 'PROMO')

    expect(wrapper.emitted('change-phase')).toEqual([['PROMO']])
  })

  it('re-emits delete', () => {
    const wrapper = mountHeader()

    wrapper.findComponent(ReleaseActionsMenu).vm.$emit('delete')

    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('opens the cover in full size', async () => {
    const wrapper = mountWithPlugins(ReleaseHeader, {
      props: { release: makeRelease({ name: 'Night Drive', artworkUrl: 'https://signed.test/cover.jpg' }) },
      attachTo: document.body,
    })

    await wrapper.find('button[aria-label="View Night Drive cover"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'VDialog' }).props('modelValue')).toBe(true)
    expect(document.body.querySelector('img[alt="Night Drive cover"]').getAttribute('src'))
      .toBe('https://signed.test/cover.jpg')
  })

  it('does not offer the full-size view without a cover', () => {
    const wrapper = mountHeader({ artworkUrl: null })

    expect(wrapper.find('button.artwork').attributes('disabled')).toBeDefined()
  })

  it('opens the cover dialog from the camera button', async () => {
    const wrapper = mountWithPlugins(ReleaseHeader, {
      props: { release: makeRelease({ name: 'Night Drive' }) },
      attachTo: document.body,
    })

    await wrapper.find('button[aria-label="Change cover"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(ReleaseArtworkDialog).props('modelValue')).toBe(true)
  })

  it('re-emits the release saved in the cover dialog', () => {
    const wrapper = mountHeader()
    const saved = makeRelease({ artworkUrl: 'https://signed.test/new.jpg' })

    wrapper.findComponent(ReleaseArtworkDialog).vm.$emit('updated', saved)

    expect(wrapper.emitted('updated')).toEqual([[saved]])
  })
})