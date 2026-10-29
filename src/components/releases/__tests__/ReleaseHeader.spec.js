import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseHeader from '@/components/releases/ReleaseHeader.vue'
import ReleasePhaseMenu from '@/components/releases/ReleasePhaseMenu.vue'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import ReleaseArtworkDialog from '@/components/releases/ReleaseArtworkDialog.vue'
import ReleaseProgress from '@/components/releases/ReleaseProgress.vue'
import DownloadButton from '@/components/common/DownloadButton.vue'
import ExplicitBadge from '@/components/common/ExplicitBadge.vue'
import { releaseService } from '@/services/release.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

// The header contains the cover dialog and the cover download, which use the release service
vi.mock('@/services/release.service', () => ({
  releaseService: { uploadArtwork: vi.fn(), removeArtwork: vi.fn(), artworkDownloadLink: vi.fn() },
}))

const COVER = 'https://signed.test/cover.jpg'

const mountHeader = (overrides = {}, props = {}) =>
  mountWithPlugins(ReleaseHeader, { props: { release: makeRelease(overrides), ...props }, attachTo: document.body })

describe('ReleaseHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 26, 12, 0))
  })

  afterEach(() => vi.useRealTimers())

  describe('details', () => {
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

    it('marks a release with explicit songs', () => {
      expect(mountHeader({ explicit: true }).findComponent(ExplicitBadge).exists()).toBe(true)
      expect(mountHeader({ explicit: false }).findComponent(ExplicitBadge).exists()).toBe(false)
    })

    it('shows the release progress', () => {
      const wrapper = mountHeader({ progressPercent: 50, doneSongCount: 1, songCount: 5 })

      expect(wrapper.findComponent(ReleaseProgress).props()).toMatchObject({ percent: 50, done: 1, total: 5 })
    })
  })

  describe('actions', () => {
    it('re-emits a phase change and shows it as saving', () => {
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
  })

  describe('cover', () => {
    it('opens the full-size view from the cover itself', async () => {
      const wrapper = mountHeader({ name: 'Night Drive', artworkUrl: COVER })

      await wrapper.find('button[aria-label="View Night Drive cover"]').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'VDialog' }).props('modelValue')).toBe(true)
      expect(document.body.querySelector('img[alt="Night Drive cover"]').getAttribute('src')).toBe(COVER)
    })

    it('opens the same view from the zoom button', async () => {
      const wrapper = mountHeader({ artworkUrl: COVER })

      await wrapper.find('button[aria-label="View cover full size"]').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'VDialog' }).props('modelValue')).toBe(true)
    })

    it('without a cover offers only to add one', () => {
      const wrapper = mountHeader({ artworkUrl: null })

      expect(wrapper.find('button.artwork').attributes('disabled')).toBeDefined()
      expect(wrapper.find('button[aria-label="View cover full size"]').exists()).toBe(false)
      expect(wrapper.findComponent(DownloadButton).exists()).toBe(false)
      expect(wrapper.find('button[aria-label="Change cover"]').exists()).toBe(true)
    })

    it('opens the cover dialog from the camera button', async () => {
      const wrapper = mountHeader({ name: 'Night Drive' })

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

  describe('cover download', () => {
    const getLink = (wrapper) => wrapper.findComponent(DownloadButton).props('getLink')

    it('downloads the original from storage', async () => {
      const link = { url: 'https://storage.test/original.png' }
      releaseService.artworkDownloadLink.mockResolvedValue(link)
      const wrapper = mountHeader({ id: 5, artworkUrl: COVER })

      expect(await getLink(wrapper)()).toEqual(link)
      expect(releaseService.artworkDownloadLink).toHaveBeenCalledWith(5)
    })

    it('opens a cover set by link where it lives, since storage does not have it', async () => {
      releaseService.artworkDownloadLink.mockRejectedValue({ response: { status: 404 } })
      const wrapper = mountHeader({ artworkUrl: 'https://img.test/external.jpg' })

      expect(await getLink(wrapper)()).toEqual({ url: 'https://img.test/external.jpg', external: true })
    })

    it('passes other failures on to the button', async () => {
      const failure = { response: { status: 503 } }
      releaseService.artworkDownloadLink.mockRejectedValue(failure)
      const wrapper = mountHeader({ artworkUrl: COVER })

      await expect(getLink(wrapper)()).rejects.toBe(failure)
    })

    it('tells the user when the download could not start', async () => {
      const wrapper = mountHeader({ artworkUrl: COVER })

      wrapper.findComponent(DownloadButton).vm.$emit('error', new Error('HTTP 503'))
      await flushPromises()

      expect(document.body.textContent).toContain('Could not prepare the download. Try again.')
    })
  })
})