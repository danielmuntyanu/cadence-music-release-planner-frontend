import { describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import SongStatusMenu from '@/components/songs/SongStatusMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'

async function openMenu(status = 'RECORDING', props = {}) {
  const wrapper = mountWithPlugins(SongStatusMenu, { props: { status, ...props }, attachTo: document.body })
  await wrapper.findComponent({ name: 'VChip' }).trigger('click')
  await flushPromises()
  return wrapper
}

const item = (wrapper, title) =>
  wrapper.findAllComponents({ name: 'VListItem' }).find((i) => i.props('title') === title)

describe('SongStatusMenu', () => {
  it('shows the current status on the chip, with an accessible label', () => {
    const wrapper = mountWithPlugins(SongStatusMenu, { props: { status: 'RECORDING' } })

    const chip = wrapper.findComponent({ name: 'VChip' })
    expect(chip.text()).toContain('Recording')
    expect(chip.attributes('aria-label')).toBe('Status: Recording. Change status')
  })

  it('lists every status and marks the current one', async () => {
    const wrapper = await openMenu('RECORDING')

    const items = wrapper.findAllComponents({ name: 'VListItem' })
    expect(items).toHaveLength(5)
    expect(item(wrapper, 'Recording').props('active')).toBe(true)
    expect(item(wrapper, 'Done').props('active')).toBe(false)
  })

  it('emits the picked status', async () => {
    const wrapper = await openMenu('RECORDING')

    await item(wrapper, 'Done').trigger('click')

    expect(wrapper.emitted('change')).toEqual([['DONE']])
  })

  it('does not emit when the current status is picked again', async () => {
    const wrapper = await openMenu('RECORDING')

    await item(wrapper, 'Recording').trigger('click')

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('cannot be opened while saving', () => {
    const wrapper = mountWithPlugins(SongStatusMenu, { props: { status: 'RECORDING', loading: true } })

    expect(wrapper.findComponent({ name: 'VChip' }).props('disabled')).toBe(true)
  })
})