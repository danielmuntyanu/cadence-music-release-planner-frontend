import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import CopyButton from '@/components/common/CopyButton.vue'
import { mountWithPlugins } from '@/test-utils/mount'

describe('CopyButton', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue() } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('copies the text and confirms it', async () => {
    const wrapper = mountWithPlugins(CopyButton, { props: { text: 'USABC2600001', label: 'Copy ISRC' } })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('USABC2600001')
    expect(wrapper.emitted('copied')).toHaveLength(1)
    expect(wrapper.find('button').attributes('aria-label')).toBe('Copied')
  })

  it('returns to its normal state after a moment', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const wrapper = mountWithPlugins(CopyButton, { props: { text: 'X', label: 'Copy ISRC' } })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    vi.advanceTimersByTime(1500)
    await flushPromises()

    expect(wrapper.find('button').attributes('aria-label')).toBe('Copy ISRC')
  })

  it('does not report success when the clipboard is blocked', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    navigator.clipboard.writeText.mockRejectedValue(new Error('NotAllowedError'))
    const wrapper = mountWithPlugins(CopyButton, { props: { text: 'X' } })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('copied')).toBeUndefined()
  })
})