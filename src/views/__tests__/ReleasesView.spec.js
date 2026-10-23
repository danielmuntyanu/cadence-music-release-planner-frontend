import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleasesView from '@/views/ReleasesView.vue'
import ReleaseCard from '@/components/releases/ReleaseCard.vue'
import ReleaseCreateDialog from '@/components/releases/ReleaseCreateDialog.vue'
import ReleasesEmptyState from '@/components/releases/ReleasesEmptyState.vue'
import { useReleasesStore } from '@/stores/releases'
import { releaseService } from '@/services/release.service'
import { createTestRouter, findButton, mountWithPlugins } from '@/test-utils/mount'
import { makePage, makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { getAll: vi.fn(), updatePhase: vi.fn(), delete: vi.fn(), create: vi.fn() },
}))

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn().mockResolvedValue([]) },
}))

const DEFAULT_QUERY = { page: 0, size: 24, sort: 'createdAt,desc' }
const lastQuery = () => releaseService.getAll.mock.calls.at(-1)[0]
const asList = (value) => [].concat(value ?? [])

async function mountView(path = '/releases') {
  const router = createTestRouter()
  await router.push(path)
  const wrapper = mountWithPlugins(ReleasesView, { router, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

// Snackbar content is teleported to document.body, outside the wrapper's DOM
function expectSnackbar(wrapper, message) {
  expect(wrapper.findComponent({ name: 'VSnackbar' }).props('modelValue')).toBe(true)
  expect(document.body.textContent).toContain(message)
}

describe('ReleasesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    releaseService.getAll.mockResolvedValue(makePage([makeRelease(), makeRelease()]))
  })

  describe('loading and URL', () => {
    it('loads the first page and shows a card per release', async () => {
      const { wrapper } = await mountView()

      expect(releaseService.getAll).toHaveBeenCalledWith(DEFAULT_QUERY)
      expect(wrapper.findAllComponents(ReleaseCard)).toHaveLength(2)
    })

    it('reads filters, sort and page from the URL with a single request', async () => {
      await mountView('/releases?phase=PROMO&sort=name,asc&page=2')

      expect(releaseService.getAll).toHaveBeenCalledTimes(1)
      expect(releaseService.getAll).toHaveBeenCalledWith({ page: 1, size: 24, sort: 'name,asc', phase: ['PROMO'] })
    })

    it('writes filter changes to the URL', async () => {
      const { router } = await mountView()

      await useReleasesStore().setFilters({ phase: ['PROMO'] })
      await flushPromises()

      expect(asList(router.currentRoute.value.query.phase)).toEqual(['PROMO'])
    })

    it('loads the chosen page and shows it in the URL', async () => {
      releaseService.getAll.mockResolvedValue(makePage([makeRelease()], { totalElements: 50 }))
      const { wrapper, router } = await mountView()
      releaseService.getAll.mockResolvedValue(makePage([makeRelease()], { number: 1, totalElements: 50 }))

      wrapper.findComponent({ name: 'VPagination' }).vm.$emit('update:modelValue', 2)
      await flushPromises()

      expect(lastQuery().page).toBe(1)
      expect(router.currentRoute.value.query.page).toBe('2')
    })
  })

  describe('empty states', () => {
    it('shows the empty catalog and opens the create dialog from it', async () => {
      releaseService.getAll.mockResolvedValue(makePage([]))
      const { wrapper } = await mountView()

      expect(wrapper.findComponent(ReleasesEmptyState).exists()).toBe(true)
      await findButton(wrapper, 'Plan your first release').trigger('click')

      expect(wrapper.findComponent(ReleaseCreateDialog).props('modelValue')).toBe(true)
    })

    it('shows "no results" for active filters, with a working Clear filters', async () => {
      releaseService.getAll.mockResolvedValue(makePage([]))
      const { wrapper, router } = await mountView('/releases?phase=PROMO')

      expect(wrapper.text()).toContain('No releases match your filters.')
      await findButton(wrapper, 'Clear filters').trigger('click')
      await flushPromises()

      expect(lastQuery()).toEqual(DEFAULT_QUERY)
      expect(router.currentRoute.value.query).toEqual({})
    })
  })

  describe('card actions', () => {
    it('changes the phase from a card and confirms it', async () => {
      const release = makeRelease({ phase: 'PRE_RELEASE' })
      releaseService.getAll.mockResolvedValue(makePage([release]))
      releaseService.updatePhase.mockResolvedValue({ ...release, phase: 'PROMO' })
      const { wrapper } = await mountView()

      wrapper.findComponent(ReleaseCard).vm.$emit('change-phase', release, 'PROMO')
      await flushPromises()

      expect(releaseService.updatePhase).toHaveBeenCalledWith(release.id, 'PROMO')
      expectSnackbar(wrapper, 'Moved to Promo')
    })

    it('reports a failed phase change', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const release = makeRelease()
      releaseService.getAll.mockResolvedValue(makePage([release]))
      releaseService.updatePhase.mockRejectedValue(new Error('Network'))
      const { wrapper } = await mountView()

      wrapper.findComponent(ReleaseCard).vm.$emit('change-phase', release, 'PROMO')
      await flushPromises()

      expectSnackbar(wrapper, 'Could not change the phase')
    })
  })

  it('refreshes after creating and offers to open the new release', async () => {
    const { wrapper } = await mountView()
    releaseService.getAll.mockClear()

    wrapper.findComponent(ReleaseCreateDialog).vm.$emit('created', makeRelease({ id: 42 }))
    await flushPromises()

    expect(lastQuery()).toEqual(DEFAULT_QUERY)
    expectSnackbar(wrapper, 'Release created')
    expect(document.body.querySelector('a[href="/releases/42"]')).not.toBeNull()
  })
})