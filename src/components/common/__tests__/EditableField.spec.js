import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import EditableField from '@/components/common/EditableField.vue'
import { provideInlineEditGroup } from '@/composables/useInlineEdit'
import { findButton, mountWithPlugins } from '@/test-utils/mount'

const TextEditor = (rules = []) => ({
  editor: ({ draft, set }) =>
    h('input', { value: draft, class: 'editor', 'data-rules': rules.length, onInput: (e) => set(e.target.value) }),
})

function mountField(props = {}) {
  return mountWithPlugins(EditableField, {
    props: { label: 'Name', value: 'Night Drive', save: vi.fn().mockResolvedValue({}), ...props },
    slots: TextEditor(),
  })
}

const pencil = (wrapper) => wrapper.find('button[aria-label="Edit name"]')

describe('EditableField', () => {
  it('shows the label, the value and a pencil', () => {
    const wrapper = mountField()

    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Night Drive')
    expect(pencil(wrapper).exists()).toBe(true)
  })

  it('has no pencil when the field is not editable', () => {
    expect(pencil(mountField({ editable: false })).exists()).toBe(false)
  })

  it('opens the editor with a copy of the value', async () => {
    const wrapper = mountField()

    await pencil(wrapper).trigger('click')

    expect(wrapper.find('input.editor').element.value).toBe('Night Drive')
    expect(findButton(wrapper, 'Save')).toBeDefined()
  })

  it('saves the draft and closes', async () => {
    const save = vi.fn().mockResolvedValue({})
    const wrapper = mountField({ save })
    await pencil(wrapper).trigger('click')
    await wrapper.find('input.editor').setValue('Night Drive (Deluxe)')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(save).toHaveBeenCalledWith('Night Drive (Deluxe)')
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.find('input.editor').exists()).toBe(false)
  })

  it('closes without a request when nothing changed', async () => {
    const save = vi.fn()
    const wrapper = mountField({ save })
    await pencil(wrapper).trigger('click')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(save).not.toHaveBeenCalled()
    expect(wrapper.find('input.editor').exists()).toBe(false)
  })

  it('Cancel and Esc discard the draft', async () => {
    const save = vi.fn()
    const wrapper = mountField({ save })

    await pencil(wrapper).trigger('click')
    await wrapper.find('input.editor').setValue('Changed')
    await findButton(wrapper, 'Cancel').trigger('click')
    expect(wrapper.text()).toContain('Night Drive')

    await pencil(wrapper).trigger('click')
    await wrapper.find('input.editor').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('input.editor').exists()).toBe(false)

    expect(save).not.toHaveBeenCalled()
  })

  it('stays open and shows the error when saving fails', async () => {
    const save = vi.fn().mockRejectedValue({ response: { status: 409 } })
    const wrapper = mountField({ save, errorMessages: { 409: 'You already have a release with this name.' } })
    await pencil(wrapper).trigger('click')
    await wrapper.find('input.editor').setValue('Taken')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('You already have a release with this name.')
    expect(wrapper.find('input.editor').element.value).toBe('Taken')
  })

  it('does not save while saving is disabled', async () => {
    const save = vi.fn()
    const wrapper = mountField({ save, saveDisabled: true })
    await pencil(wrapper).trigger('click')
    await wrapper.find('input.editor').setValue('Changed')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(save).not.toHaveBeenCalled()
  })

  it('allows only one open editor within a group', async () => {
    const Group = defineComponent({
      setup() {
        provideInlineEditGroup()
        return () => [
          h(EditableField, { label: 'Name', value: 'A', save: vi.fn() }, TextEditor()),
          h(EditableField, { label: 'Notes', value: 'B', save: vi.fn() }, TextEditor()),
        ]
      },
    })
    const wrapper = mountWithPlugins(Group)

    await wrapper.find('button[aria-label="Edit name"]').trigger('click')
    await wrapper.find('button[aria-label="Edit notes"]').trigger('click')

    const editors = wrapper.findAll('input.editor')
    expect(editors).toHaveLength(1)
    expect(editors[0].element.value).toBe('B')
  })
})