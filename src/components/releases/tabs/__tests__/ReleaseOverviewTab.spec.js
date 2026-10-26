import { describe, expect, it } from 'vitest'
import ReleaseOverviewTab from '@/components/releases/tabs/ReleaseOverviewTab.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

const mountTab = (overrides = {}) =>
  mountWithPlugins(ReleaseOverviewTab, { props: { release: makeRelease(overrides) } })

/** The value span of the spec row with the given label */
const row = (wrapper, label) => {
  const found = wrapper.findAll('.spec-row').find((r) => r.find('span').text() === label)
  return found.findAll('span')[1]
}

describe('ReleaseOverviewTab', () => {
  it('shows filled values in the brand color', () => {
    const wrapper = mountTab({ type: 'ALBUM', phase: 'PROMO' })

    expect(row(wrapper, 'Type').text()).toBe('Album')
    expect(row(wrapper, 'Type').classes()).toContain('text-primary')
    expect(row(wrapper, 'Phase').text()).toBe('Promo')
  })

  it('joins both genres in one row', () => {
    expect(row(mountTab({ primaryGenre: 'ROCK', secondaryGenre: 'POP' }), 'Genres').text()).toBe('Rock · Pop')
    expect(row(mountTab({ primaryGenre: 'ROCK', secondaryGenre: null }), 'Genres').text()).toBe('Rock')
  })

  it('keeps missing values muted so they stand out as not filled in', () => {
    const wrapper = mountTab({ releaseDate: null, originalReleaseDate: null })

    expect(row(wrapper, 'Release date').text()).toBe('Not set')
    expect(row(wrapper, 'Release date').classes()).not.toContain('text-primary')
    expect(row(wrapper, 'Original release').text()).toBe('Not a reissue')
  })

  it('formats the release date without shifting the day', () => {
    expect(row(mountTab({ releaseDate: '2026-11-14' }), 'Release date').text()).toContain('14')
  })

  it('shows notes in a collapsible block', () => {
    const wrapper = mountTab({ notes: 'Master v3 approved' })

    const notes = wrapper.findComponent(ExpandableText)
    expect(notes.props('text')).toBe('Master v3 approved')
    expect(notes.props('lines')).toBe(4)
  })

  it('lists artists with links, marking the primary one', () => {
    const wrapper = mountTab({ artists: [{ id: 2, name: 'Ada', avatarUrl: null }, { id: 1, name: 'Nova', avatarUrl: null }] })

    const items = wrapper.findAllComponents({ name: 'VListItem' })
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Primary artist')
    expect(items[1].text()).not.toContain('Primary artist')
    expect(wrapper.find('a[href="/artists/2"]').exists()).toBe(true)
  })
})