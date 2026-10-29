import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseActionsMenu from '@/components/releases/ReleaseActionsMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'

async function openMenu(props = {}) {
  const wrapper = mountWithPlugins(ReleaseActionsMenu, { props, attachTo: document.body })
  await wrapper.find('button[aria-label="Release actions"]').trigger('click')
  await flushPromises()
  return wrapper
}

const item = (wrapper, title) =>
  wrapper.findAllComponents({ name: 'VListItem' }).find((listItem) => listItem.props('title') === title)

describe('ReleaseActionsMenu', () => {
  it('offers Edit as a link to the release when given where it leads', async () => {
    const wrapper = await openMenu({ editTo: { name: 'release-detail', params: { id: 7 } } })

    expect(item(wrapper, 'Edit').props('to')).toEqual({ name: 'release-detail', params: { id: 7 } })
    expect(document.body.querySelector('a[href="/releases/7"]')).not.toBeNull()
  })

  it('offers only Delete without an edit link, e.g. on the release page itself', async () => {
    const wrapper = await openMenu()

    expect(item(wrapper, 'Edit')).toBeUndefined()
    expect(item(wrapper, 'Delete')).toBeDefined()
  })

  it('reports Delete', async () => {
    const wrapper = await openMenu()

    await item(wrapper, 'Delete').trigger('click')

    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('gets a translucent background over artwork', () => {
    const plain = mountWithPlugins(ReleaseActionsMenu)
    const floating = mountWithPlugins(ReleaseActionsMenu, { props: { floating: true } })

    expect(plain.find('button').classes()).not.toContain('menu-floating')
    expect(floating.find('button').classes()).toContain('menu-floating')
  })
})