import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import ReleaseDetailView from '@/views/ReleaseDetailView.vue'
import ReleaseHeader from '@/components/releases/ReleaseHeader.vue'
import ReleaseDeleteDialog from '@/components/releases/ReleaseDeleteDialog.vue'
import { releaseService } from '@/services/release.service'
import { createTestRouter, findButton, mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

// The header contains the cover dialog, and the delete dialog goes through the releases store:
// every service method any of them can reach is mocked
vi.mock('@/services/release.service', () => ({
  releaseService: {
    getById: vi.fn(),
    updatePhase: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
    uploadArtwork: vi.fn(),
    removeArtwork: vi.fn(),
  },
}))

// ---------- Helpers ----------

async function mountView(id = '42', router = createTestRouter(), path = `/releases/${id}`) {
  await router.push(path)
  const wrapper = mountWithPlugins(ReleaseDetailView, { props: { id }, router, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

// The header has its own snackbar (cover download), so look for the one that is open
function expectSnackbar(wrapper, message) {
  const open = wrapper.findAllComponents({ name: 'VSnackbar' }).filter((snackbar) => snackbar.props('modelValue'))
  expect(open).toHaveLength(1)
  expect(document.body.textContent).toContain(message)
}

/** Stands in for a tab: lets the test fire songs-changed like the tracklist does */
const TabStub = defineComponent({
  emits: ['songs-changed', 'updated'],
  setup(_, { emit }) {
    return () => h('button', { class: 'fire-songs-changed', onClick: () => emit('songs-changed') })
  },
})

function routerWithTabStub() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/releases', name: 'releases', component: TabStub },
      { path: '/artists/:id', name: 'artist-detail', component: TabStub },
      {
        path: '/releases/:id',
        // The view is mounted directly, so its RouterView renders this parent record
        component: TabStub,
        children: [
          { path: '', name: 'release-detail', component: TabStub },
          { path: 'tracklist', name: 'release-tracklist', component: TabStub },
        ],
      },
    ],
  })
}

// ---------- Tests ----------

describe('ReleaseDetailView', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('loading', () => {
    it('loads the release and shows the header and tabs', async () => {
      releaseService.getById.mockResolvedValue(makeRelease({ id: 42, name: 'Night Drive' }))

      const { wrapper } = await mountView()

      expect(releaseService.getById).toHaveBeenCalledWith(42)
      expect(wrapper.findComponent(ReleaseHeader).props('release').name).toBe('Night Drive')
      const tabs = wrapper.findAllComponents({ name: 'VTab' }).map((tab) => tab.text())
      expect(tabs).toEqual(['Overview', 'Tracklist'])
    })

    it('links the tabs to their routes', async () => {
      releaseService.getById.mockResolvedValue(makeRelease({ id: 42 }))

      const { wrapper } = await mountView()

      const hrefs = wrapper.findAllComponents({ name: 'VTab' }).map((tab) => tab.attributes('href'))
      expect(hrefs).toEqual(['/releases/42', '/releases/42/tracklist'])
    })

    it.each([403, 404])('shows "not found" for HTTP %i', async (status) => {
      releaseService.getById.mockRejectedValue({ response: { status } })

      const { wrapper } = await mountView()

      expect(wrapper.text()).toContain('Release not found')
      expect(wrapper.findComponent(ReleaseHeader).exists()).toBe(false)
    })

    it('shows an error with a working retry', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      releaseService.getById
        .mockRejectedValueOnce(new Error('Network'))
        .mockResolvedValueOnce(makeRelease({ id: 42 }))
      const { wrapper } = await mountView()
      expect(wrapper.text()).toContain('Could not load the release')

      await findButton(wrapper, 'Retry').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(ReleaseHeader).exists()).toBe(true)
    })

    it('loads the new release when the route id changes', async () => {
      releaseService.getById
        .mockResolvedValueOnce(makeRelease({ id: 42, name: 'First' }))
        .mockResolvedValueOnce(makeRelease({ id: 43, name: 'Second' }))
      const { wrapper } = await mountView()

      await wrapper.setProps({ id: '43' })
      await flushPromises()

      expect(releaseService.getById).toHaveBeenLastCalledWith(43)
      expect(wrapper.findComponent(ReleaseHeader).props('release').name).toBe('Second')
    })
  })

  describe('phase', () => {
    it('changes the phase and shows the saved release', async () => {
      const release = makeRelease({ id: 42, phase: 'PRE_RELEASE' })
      releaseService.getById.mockResolvedValue(release)
      releaseService.updatePhase.mockResolvedValue({ ...release, phase: 'PROMO' })
      const { wrapper } = await mountView()

      wrapper.findComponent(ReleaseHeader).vm.$emit('change-phase', 'PROMO')
      await flushPromises()

      expect(releaseService.updatePhase).toHaveBeenCalledWith(42, 'PROMO')
      expect(wrapper.findComponent(ReleaseHeader).props('release').phase).toBe('PROMO')
      expectSnackbar(wrapper, 'Moved to Promo')
    })

    it('reports a failed phase change and keeps the old phase', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      releaseService.getById.mockResolvedValue(makeRelease({ id: 42, phase: 'PRE_RELEASE' }))
      releaseService.updatePhase.mockRejectedValue(new Error('Network'))
      const { wrapper } = await mountView()

      wrapper.findComponent(ReleaseHeader).vm.$emit('change-phase', 'PROMO')
      await flushPromises()

      expect(wrapper.findComponent(ReleaseHeader).props('release').phase).toBe('PRE_RELEASE')
      expectSnackbar(wrapper, 'Could not change the phase')
    })
  })

  describe('header updates', () => {
    it('shows a release saved from the header, such as a new cover', async () => {
      releaseService.getById.mockResolvedValue(makeRelease({ id: 42, artworkUrl: null }))
      const { wrapper } = await mountView()

      wrapper.findComponent(ReleaseHeader).vm.$emit('updated', makeRelease({ id: 42, artworkUrl: 'https://signed.test/new.jpg' }))
      await flushPromises()

      expect(wrapper.findComponent(ReleaseHeader).props('release').artworkUrl).toBe('https://signed.test/new.jpg')
    })
  })

  describe('song changes', () => {
    it('quietly reloads the release when its songs change', async () => {
      releaseService.getById
        .mockResolvedValueOnce(makeRelease({ id: 42, songCount: 1, progressPercent: 0 }))
        .mockResolvedValueOnce(makeRelease({ id: 42, songCount: 1, progressPercent: 100 }))
      const { wrapper } = await mountView('42', routerWithTabStub(), '/releases/42/tracklist')

      await wrapper.find('.fire-songs-changed').trigger('click')
      await flushPromises()

      expect(releaseService.getById).toHaveBeenCalledTimes(2)
      expect(wrapper.findComponent(ReleaseHeader).props('release').progressPercent).toBe(100)
      // Quiet: the page never dropped back to its loading skeleton, so the tab stayed mounted
      expect(wrapper.find('.fire-songs-changed').exists()).toBe(true)
    })

    it('keeps the current release when the quiet reload fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      releaseService.getById
        .mockResolvedValueOnce(makeRelease({ id: 42, name: 'Neon Siesta' }))
        .mockRejectedValueOnce(new Error('Network'))
      const { wrapper } = await mountView('42', routerWithTabStub(), '/releases/42/tracklist')

      await wrapper.find('.fire-songs-changed').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(ReleaseHeader).props('release').name).toBe('Neon Siesta')
      expect(wrapper.text()).not.toContain('Could not load the release')
    })
  })

  describe('delete', () => {
    it('opens the delete dialog and goes back to the list after deleting', async () => {
      const release = makeRelease({ id: 42 })
      releaseService.getById.mockResolvedValue(release)
      const { wrapper, router } = await mountView()
      const replace = vi.spyOn(router, 'replace')

      wrapper.findComponent(ReleaseHeader).vm.$emit('delete')
      await flushPromises()
      expect(wrapper.findComponent(ReleaseDeleteDialog).props('modelValue')).toBe(true)

      wrapper.findComponent(ReleaseDeleteDialog).vm.$emit('deleted', release)
      await flushPromises()

      // replace, not push: the deleted release must not stay in the browser history
      expect(replace).toHaveBeenCalledWith({ name: 'releases' })
    })
  })
})