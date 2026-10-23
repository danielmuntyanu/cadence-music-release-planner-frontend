import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleasePhaseMenu from '@/components/releases/ReleasePhaseMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'

// The menu content is teleported, so items are found through the component tree
async function openMenu(props) {
  const wrapper = mountWithPlugins(ReleasePhaseMenu, { props, attachTo: document.body })
  await wrapper.findComponent({ name: 'VChip' }).trigger('click')
  await flushPromises()
  return wrapper
}

const findItem = (wrapper, title) =>
  wrapper.findAllComponents({ name: 'VListItem' }).find((item) => item.props('title') === title)

describe('ReleasePhaseMenu', () => {
  it('shows the current phase on the chip', () => {
    const wrapper = mountWithPlugins(ReleasePhaseMenu, { props: { phase: 'PROMO' } })

    expect(wrapper.findComponent({ name: 'VChip' }).text()).toContain('Promo')
  })

  it('emits the picked phase', async () => {
    const wrapper = await openMenu({ phase: 'PROMO' })

    await findItem(wrapper, 'Catalog').trigger('click')

    expect(wrapper.emitted('change')).toEqual([['CATALOG']])
  })

  it('does not emit when the current phase is picked again', async () => {
    const wrapper = await openMenu({ phase: 'PROMO' })

    await findItem(wrapper, 'Promo').trigger('click')

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('is disabled while the phase is being saved', () => {
    const wrapper = mountWithPlugins(ReleasePhaseMenu, { props: { phase: 'PROMO', loading: true } })

    expect(wrapper.findComponent({ name: 'VChip' }).props('disabled')).toBe(true)
  })
})