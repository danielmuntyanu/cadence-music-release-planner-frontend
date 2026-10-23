import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReleaseCard from '@/components/releases/ReleaseCard.vue'
import ReleasePhaseMenu from '@/components/releases/ReleasePhaseMenu.vue'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

const mountCard = (overrides = {}) => mountWithPlugins(ReleaseCard, { props: { release: makeRelease(overrides) } })

describe('ReleaseCard', () => {
  beforeEach(() => {
    // Only Date is faked: the countdown depends on "today", nothing else needs fake timers
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 23, 12, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('links the title and the Overview button to the release page', () => {
    const wrapper = mountCard({ id: 7, name: 'Night Drive' })

    const title = wrapper.findAll('a').find((a) => a.text() === 'Night Drive')
    const overview = wrapper.findAll('a').find((a) => a.text().includes('Overview / Edit'))

    expect(title.attributes('href')).toBe('/releases/7')
    expect(overview.attributes('href')).toBe('/releases/7')
  })

  it('lists artists in order, primary first', () => {
    const wrapper = mountCard({ artists: [{ id: 2, name: 'Ada' }, { id: 1, name: 'Nova' }] })

    expect(wrapper.text()).toContain('Ada, Nova')
  })

  it('says so when the release has no artist', () => {
    expect(mountCard({ artists: [] }).text()).toContain('No artist yet')
  })

  it('shows both genres', () => {
    expect(mountCard({ primaryGenre: 'POP', secondaryGenre: 'ROCK' }).text()).toContain('Pop / Rock')
  })

  it('counts down to the release date', () => {
    expect(mountCard({ releaseDate: '2026-10-26' }).text()).toContain('Out in 3 days')
  })

  it('re-emits a phase change together with the release', () => {
    const release = makeRelease()
    const wrapper = mountWithPlugins(ReleaseCard, { props: { release } })

    wrapper.findComponent(ReleasePhaseMenu).vm.$emit('change', 'PROMO')

    expect(wrapper.emitted('change-phase')[0]).toEqual([release, 'PROMO'])
  })

  it('re-emits delete with the release', () => {
    const release = makeRelease()
    const wrapper = mountWithPlugins(ReleaseCard, { props: { release } })

    wrapper.findComponent(ReleaseActionsMenu).vm.$emit('delete')

    expect(wrapper.emitted('delete')[0]).toEqual([release])
  })
})