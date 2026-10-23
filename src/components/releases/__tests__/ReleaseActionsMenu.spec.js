import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'

// Menu content is teleported, so items are found through the component tree
async function openMenu(props = {}) {
  const wrapper = mountWithPlugins(ReleaseActionsMenu, { props, attachTo: document.body })
  await wrapper.find('button[aria-label="Release actions"]').trigger('click')
  await flushPromises()
  return wrapper
}

const findItem = (wrapper, title) =>
  wrapper.findAllComponents({ name: 'VListItem' }).find((item) => item.props('title') === title)

describe('ReleaseActionsMenu', () => {
  it('emits delete when Delete is clicked', async () => {
    const wrapper = await openMenu()

    await findItem(wrapper, 'Delete').trigger('click')

    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('does not emit anything just by opening', async () => {
    const wrapper = await openMenu()

    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('uses the translucent style when placed over artwork', () => {
    const floating = mountWithPlugins(ReleaseActionsMenu, { props: { floating: true } })
    const plain = mountWithPlugins(ReleaseActionsMenu)

    expect(floating.find('button').classes()).toContain('menu-floating')
    expect(plain.find('button').classes()).not.toContain('menu-floating')
  })
})