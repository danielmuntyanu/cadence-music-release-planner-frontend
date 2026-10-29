import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReleaseCard from '@/components/releases/ReleaseCard.vue'
import ReleasePhaseMenu from '@/components/releases/ReleasePhaseMenu.vue'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import ReleaseProgress from '@/components/releases/ReleaseProgress.vue'
import ExplicitBadge from '@/components/common/ExplicitBadge.vue'
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

  describe('opening the release', () => {
    it('makes the whole card a link through its title, the only link on the card', () => {
      const wrapper = mountCard({ id: 7, name: 'Night Drive' })

      const links = wrapper.findAll('a')
      expect(links).toHaveLength(1)
      expect(links[0].text()).toBe('Night Drive')
      expect(links[0].attributes('href')).toBe('/releases/7')
      expect(links[0].classes()).toContain('card-link')
    })

    it('offers Edit in the actions menu', () => {
      const wrapper = mountCard({ id: 7 })

      expect(wrapper.findComponent(ReleaseActionsMenu).props('editTo'))
        .toEqual({ name: 'release-detail', params: { id: 7 } })
    })
  })

  describe('details', () => {
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

    it('marks a release with explicit songs', () => {
      expect(mountCard({ explicit: true }).findComponent(ExplicitBadge).exists()).toBe(true)
      expect(mountCard({ explicit: false }).findComponent(ExplicitBadge).exists()).toBe(false)
    })

    it('shows the release progress', () => {
      const wrapper = mountCard({ songCount: 4, doneSongCount: 1, progressPercent: 44 })

      expect(wrapper.findComponent(ReleaseProgress).props()).toMatchObject({ percent: 44, done: 1, total: 4 })
    })
  })

  describe('actions', () => {
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

    it('keeps its buttons above the card link, so they still work on their own', () => {
      const wrapper = mountCard()

      // v-menu has several root nodes, so .element is already the element around the menu:
      // closest() finds the raised wrapper whatever the exact nesting is
      const isRaised = (component) => wrapper.findComponent(component).element.closest('.z-1') !== null
      expect(isRaised(ReleasePhaseMenu)).toBe(true)
      expect(isRaised(ReleaseActionsMenu)).toBe(true)
    })
  })
})