import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ReleaseFiltersBar from '@/components/releases/ReleaseFiltersBar.vue'
import { useReleasesStore } from '@/stores/releases'
import { releaseService } from '@/services/release.service'
import { findButton, mountWithPlugins } from '@/test-utils/mount'
import { makePage } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { getAll: vi.fn() },
}))

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn().mockResolvedValue([]) },
}))

const lastQuery = () => releaseService.getAll.mock.calls.at(-1)?.[0]

describe('ReleaseFiltersBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    releaseService.getAll.mockResolvedValue(makePage([]))
  })

  afterEach(() => vi.useRealTimers())

  it('toggling a phase chip filters by that phase', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar)

    await wrapper.findAllComponents({ name: 'VChip' }).find((chip) => chip.text().includes('Promo')).trigger('click')
    await flushPromises()

    expect(lastQuery().phase).toEqual(['PROMO'])
  })

  it('debounces the search: one request after the user stops typing', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar)
    // setImmediate stays real, so flushPromises keeps working
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const input = wrapper.find('input[placeholder="Search releases"]')

    await input.setValue('n')
    await input.setValue('ni')
    await input.setValue('night')
    vi.advanceTimersByTime(299)
    expect(releaseService.getAll).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()

    expect(releaseService.getAll).toHaveBeenCalledTimes(1)
    expect(lastQuery().q).toBe('night')
  })

  it('mirrors a search cleared elsewhere back into the field', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar)
    const store = useReleasesStore()
    await store.setFilters({ q: 'night' })
    await nextTick()

    await store.clearFilters()
    await nextTick()

    expect(wrapper.find('input[placeholder="Search releases"]').element.value).toBe('')
  })

  it('changes the sort', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar)

    wrapper.findComponent({ name: 'VSelect' }).vm.$emit('update:modelValue', 'name,asc')
    await flushPromises()

    expect(lastQuery().sort).toBe('name,asc')
  })

  it('counts the filters hidden behind the Filters button', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar)

    await useReleasesStore().setFilters({ genre: ['POP', 'ROCK'], artistId: 3 })
    await nextTick()

    const badge = wrapper.findComponent({ name: 'VBadge' })
    expect(badge.props('modelValue')).toBe(true)
    expect(badge.props('content')).toBe(3)
  })

  it('shows Clear only while a filter is active', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar)
    expect(findButton(wrapper, 'Clear')).toBeUndefined()

    await useReleasesStore().setFilters({ phase: ['PROMO'] })
    await nextTick()
    await findButton(wrapper, 'Clear').trigger('click')
    await flushPromises()

    expect(useReleasesStore().hasFilters).toBe(false)
  })

  it('switches the view through v-model', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersBar, { props: { view: 'grid' } })

    await wrapper.find('button[aria-label="List view"]').trigger('click')

    expect(wrapper.emitted('update:view')).toEqual([['list']])
  })
})