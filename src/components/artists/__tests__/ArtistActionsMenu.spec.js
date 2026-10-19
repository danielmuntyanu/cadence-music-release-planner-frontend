import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ArtistActionsMenu from '@/components/artists/ArtistActionsMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'

// Menu content is teleported, so items are found through the component tree
async function openMenu() {
  const wrapper = mountWithPlugins(ArtistActionsMenu, { attachTo: document.body })
  await wrapper.find('button[aria-label="Artist actions"]').trigger('click')
  await flushPromises()
  return wrapper
}

const findItem = (wrapper, title) =>
  wrapper.findAllComponents({ name: 'VListItem' }).find((item) => item.props('title') === title)

describe('ArtistActionsMenu', () => {
  it.each([
    ['Edit', 'edit', 'delete'],
    ['Delete', 'delete', 'edit'],
  ])('clicking "%s" emits %s only', async (title, expected, other) => {
    const wrapper = await openMenu()

    await findItem(wrapper, title).trigger('click')

    expect(wrapper.emitted(expected)).toHaveLength(1)
    expect(wrapper.emitted(other)).toBeUndefined()
  })
})