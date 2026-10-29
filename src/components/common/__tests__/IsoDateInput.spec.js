import { describe, expect, it } from 'vitest'
import IsoDateInput from '@/components/common/IsoDateInput.vue'
import { mountWithPlugins } from '@/test-utils/mount'

describe('IsoDateInput', () => {
  it('shows an ISO date as a local date', () => {
    const wrapper = mountWithPlugins(IsoDateInput, { props: { modelValue: '2026-11-14' } })

    const date = wrapper.findComponent({ name: 'VDateInput' }).props('modelValue')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 14])
  })

  it('emits a picked date as YYYY-MM-DD without shifting the day', async () => {
    const wrapper = mountWithPlugins(IsoDateInput, { props: { modelValue: null } })

    await wrapper.findComponent({ name: 'VDateInput' }).vm.$emit('update:modelValue', new Date(2026, 10, 14))

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-11-14']])
  })

  it('emits null when cleared', async () => {
    const wrapper = mountWithPlugins(IsoDateInput, { props: { modelValue: '2026-11-14' } })

    await wrapper.findComponent({ name: 'VDateInput' }).vm.$emit('update:modelValue', null)

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('passes label and other attributes to the date input', () => {
    const wrapper = mountWithPlugins(IsoDateInput, { props: { label: 'Release date' } })

    expect(wrapper.findComponent({ name: 'VDateInput' }).props('label')).toBe('Release date')
  })
})