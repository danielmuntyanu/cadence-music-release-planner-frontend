import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseArtistsPicker from '@/components/releases/ReleaseArtistsPicker.vue'
import { artistService } from '@/services/artist.service'
import { findButton, mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn(), create: vi.fn() },
}))

const nova = makeArtist({ name: 'Nova' })
const ada = makeArtist({ name: 'Ada' })

/** Mounts with a working v-model, like a parent component would provide */
async function mountPicker(artistIds = []) {
  const wrapper = mountWithPlugins(ReleaseArtistsPicker, {
    attachTo: document.body,
    props: {
      modelValue: artistIds,
      'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
      creatorOpen: false,
      'onUpdate:creatorOpen': (value) => wrapper.setProps({ creatorOpen: value }),
    },
  })
  await flushPromises()
  return wrapper
}

const selectedNames = (wrapper) =>
  wrapper.findAllComponents({ name: 'VListItemTitle' }).map((title) => title.text().replace('Primary', '').trim())

describe('ReleaseArtistsPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    artistService.getAll.mockResolvedValue([nova, ada])
  })

  it('appends a picked artist and marks the first one as primary', async () => {
    const wrapper = await mountPicker()
    const adder = wrapper.findComponent({ name: 'VAutocomplete' })

    adder.vm.$emit('update:modelValue', ada.id)
    await flushPromises()
    adder.vm.$emit('update:modelValue', nova.id)
    await flushPromises()

    expect(wrapper.props('modelValue')).toEqual([ada.id, nova.id])
    expect(selectedNames(wrapper)).toEqual(['Ada', 'Nova'])
    expect(wrapper.text()).toContain('Primary')
  })

  it('does not add the same artist twice', async () => {
    const wrapper = await mountPicker([nova.id])

    wrapper.findComponent({ name: 'VAutocomplete' }).vm.$emit('update:modelValue', nova.id)
    await flushPromises()

    expect(wrapper.props('modelValue')).toEqual([nova.id])
  })

  it('reorders with the arrow buttons', async () => {
    const wrapper = await mountPicker([nova.id, ada.id])

    await wrapper.find('button[aria-label="Move Ada up"]').trigger('click')

    expect(wrapper.props('modelValue')).toEqual([ada.id, nova.id])
  })

  it('cannot move the first artist up or the last one down', async () => {
    const wrapper = await mountPicker([nova.id, ada.id])

    expect(wrapper.find('button[aria-label="Move Nova up"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[aria-label="Move Ada down"]').attributes('disabled')).toBeDefined()
  })

  it('removes an artist', async () => {
    const wrapper = await mountPicker([nova.id, ada.id])

    await wrapper.find('button[aria-label="Remove Nova"]').trigger('click')

    expect(wrapper.props('modelValue')).toEqual([ada.id])
  })

  it('creates a new artist inline from the search text and selects it', async () => {
    const created = makeArtist({ name: 'Kai Blue' })
    artistService.create.mockResolvedValue(created)
    const wrapper = await mountPicker()
    const input = wrapper.findComponent({ name: 'VAutocomplete' }).find('input')

    // Typing a name nobody has opens the menu with "Create …"
    await input.trigger('focus')
    await input.setValue('Kai Blue')
    await flushPromises()
    await wrapper.findAllComponents({ name: 'VListItem' })
      .find((item) => item.props('title') === 'Create “Kai Blue”')
      .trigger('click')
    await flushPromises()
    expect(wrapper.props('creatorOpen')).toBe(true)

    await findButton(wrapper, 'Create artist').trigger('click')
    await flushPromises()

    expect(artistService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Kai Blue' }))
    expect(wrapper.props('modelValue')).toEqual([created.id])
    expect(wrapper.props('creatorOpen')).toBe(false)
  })
})