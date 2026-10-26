import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseDetailView from '@/views/ReleaseDetailView.vue'
import ReleaseHeader from '@/components/releases/ReleaseHeader.vue'
import ReleaseDeleteDialog from '@/components/releases/ReleaseDeleteDialog.vue'
import { releaseService } from '@/services/release.service'
import { createTestRouter, findButton, mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { getById: vi.fn(), updatePhase: vi.fn(), getAll: vi.fn(), delete: vi.fn() },
}))

async function mountView(id = '42') {
  const router = createTestRouter()
  await router.push(`/releases/${id}`)
  const wrapper = mountWithPlugins(ReleaseDetailView, { props: { id }, router, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

function expectSnackbar(wrapper, message) {
  expect(wrapper.findComponent({ name: 'VSnackbar' }).props('modelValue')).toBe(true)
  expect(document.body.textContent).toContain(message)
}

describe('ReleaseDetailView', () => {
  beforeEach(() => vi.clearAllMocks())

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