import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ReleaseList from '@/components/releases/ReleaseList.vue'
import ReleasePhaseMenu from '@/components/releases/ReleasePhaseMenu.vue'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

const mountList = (releases, props = {}) => mountWithPlugins(ReleaseList, { props: { releases, ...props } })

describe('ReleaseList', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 23, 12, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('renders one row per release with dividers between them', () => {
    const wrapper = mountList([makeRelease(), makeRelease(), makeRelease()])

    expect(wrapper.findAllComponents({ name: 'VListItem' })).toHaveLength(3)
    expect(wrapper.findAllComponents({ name: 'VDivider' })).toHaveLength(2)
  })

  it('links the title to the release page', () => {
    const wrapper = mountList([makeRelease({ id: 7, name: 'Night Drive' })])

    const title = wrapper.findAll('a').find((a) => a.text() === 'Night Drive')
    expect(title.attributes('href')).toBe('/releases/7')
  })

  it('summarizes artists, type and date in the subtitle', () => {
    const wrapper = mountList([
      makeRelease({ type: 'EP', releaseDate: '2026-10-26', artists: [{ id: 1, name: 'Nova' }, { id: 2, name: 'Ada' }] }),
    ])

    const subtitle = wrapper.findComponent({ name: 'VListItemSubtitle' }).text()
    expect(subtitle).toContain('Nova, Ada')
    expect(subtitle).toContain('EP')
    expect(subtitle).toContain('Out in 3 days')
  })

  it('says so when a release has no artist', () => {
    expect(mountList([makeRelease({ artists: [] })]).text()).toContain('No artist yet')
  })

  it('shows the phase as saving only for the release being updated', () => {
    const saving = makeRelease()
    const idle = makeRelease()
    const wrapper = mountList([saving, idle], { phaseLoadingId: saving.id })

    const menus = wrapper.findAllComponents(ReleasePhaseMenu)
    expect(menus[0].props('loading')).toBe(true)
    expect(menus[1].props('loading')).toBe(false)
  })

  it('re-emits a phase change together with the release', () => {
    const release = makeRelease()
    const wrapper = mountList([release])

    wrapper.findComponent(ReleasePhaseMenu).vm.$emit('change', 'CATALOG')

    expect(wrapper.emitted('change-phase')[0]).toEqual([release, 'CATALOG'])
  })

  it('re-emits delete with the release', () => {
    const release = makeRelease()
    const wrapper = mountList([release])

    wrapper.findComponent(ReleaseActionsMenu).vm.$emit('delete')

    expect(wrapper.emitted('delete')[0]).toEqual([release])
  })
})