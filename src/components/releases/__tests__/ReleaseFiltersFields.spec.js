import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseFiltersFields from '@/components/releases/ReleaseFiltersFields.vue'
import { useReleasesStore } from '@/stores/releases'
import { releaseService } from '@/services/release.service'
import { artistService } from '@/services/artist.service'
import { findByLabel, mountWithPlugins } from '@/test-utils/mount'
import { makePage } from '@/test-utils/fixtures/releases'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/release.service', () => ({
  releaseService: { getAll: vi.fn() },
}))

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn() },
}))

const lastQuery = () => releaseService.getAll.mock.calls.at(-1)[0]

async function mountFields() {
  const wrapper = mountWithPlugins(ReleaseFiltersFields)
  await flushPromises()
  return wrapper
}

describe('ReleaseFiltersFields', () => {
  const nova = makeArtist({ name: 'Nova' })

  beforeEach(() => {
    vi.clearAllMocks()
    releaseService.getAll.mockResolvedValue(makePage([]))
    artistService.getAll.mockResolvedValue([nova])
  })

  it('loads the artists for the artist filter', async () => {
    const wrapper = await mountFields()

    expect(artistService.getAll).toHaveBeenCalled()
    expect(findByLabel(wrapper, 'VAutocomplete', 'Artist').props('items')).toEqual([{ title: 'Nova', value: nova.id }])
  })

  it('filters by type', async () => {
    const wrapper = await mountFields()

    findByLabel(wrapper, 'VSelect', 'Type').vm.$emit('update:modelValue', ['EP', 'ALBUM'])
    await flushPromises()

    expect(lastQuery().type).toEqual(['EP', 'ALBUM'])
  })

  it('filters by genre', async () => {
    const wrapper = await mountFields()

    findByLabel(wrapper, 'VAutocomplete', 'Genre').vm.$emit('update:modelValue', ['POP'])
    await flushPromises()

    expect(lastQuery().genre).toEqual(['POP'])
  })

  it('filters by artist', async () => {
    const wrapper = await mountFields()

    findByLabel(wrapper, 'VAutocomplete', 'Artist').vm.$emit('update:modelValue', nova.id)
    await flushPromises()

    expect(lastQuery().artistId).toBe(nova.id)
  })

  it.each([
    ['VSelect', 'Type', 'type', []],
    ['VAutocomplete', 'Genre', 'genre', []],
    ['VAutocomplete', 'Artist', 'artistId', null],
  ])('clearing %s "%s" resets the filter instead of storing null', async (component, label, key, empty) => {
    // `clearable` emits null; the store expects [] for lists, or toReleaseQuery would crash on .length
    const wrapper = await mountFields()

    findByLabel(wrapper, component, label).vm.$emit('update:modelValue', null)
    await flushPromises()

    expect(useReleasesStore().filters[key]).toEqual(empty)
  })

  it('shows the current store filters', async () => {
    await useReleasesStore().setFilters({ type: ['EP'], genre: ['ROCK'], artistId: nova.id })
    const wrapper = await mountFields()

    expect(findByLabel(wrapper, 'VSelect', 'Type').props('modelValue')).toEqual(['EP'])
    expect(findByLabel(wrapper, 'VAutocomplete', 'Genre').props('modelValue')).toEqual(['ROCK'])
    expect(findByLabel(wrapper, 'VAutocomplete', 'Artist').props('modelValue')).toBe(nova.id)
  })

  it('offers the sort only when asked: narrow screens move it in here', () => {
    const plain = mountWithPlugins(ReleaseFiltersFields)
    const withSort = mountWithPlugins(ReleaseFiltersFields, { props: { withSort: true } })

    const sortField = (wrapper) =>
      wrapper.findAllComponents({ name: 'VSelect' }).find((select) => select.props('label') === 'Sort by')
    expect(sortField(plain)).toBeUndefined()
    expect(sortField(withSort)).toBeDefined()
  })

  it('changes the sort from the sheet', async () => {
    const wrapper = mountWithPlugins(ReleaseFiltersFields, { props: { withSort: true } })
    const sort = wrapper.findAllComponents({ name: 'VSelect' }).find((select) => select.props('label') === 'Sort by')

    sort.vm.$emit('update:modelValue', 'name,asc')
    await flushPromises()

    expect(useReleasesStore().sort).toBe('name,asc')
  })
})