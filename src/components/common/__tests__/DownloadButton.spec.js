import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import DownloadButton from '@/components/common/DownloadButton.vue'
import { startDownload } from '@/utils/download'
import { mountWithPlugins } from '@/test-utils/mount'

vi.mock('@/utils/download', () => ({ startDownload: vi.fn() }))

const mountButton = (props) =>
  mountWithPlugins(DownloadButton, { props: { label: 'Download mix3', ...props }, attachTo: document.body })

/** A promise the test resolves or rejects when it wants to */
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('DownloadButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks for a link only when clicked, then starts the download', async () => {
    const getLink = vi.fn().mockResolvedValue({ url: 'https://storage.test/mix3.wav' })
    const wrapper = mountButton({ getLink })
    expect(getLink).not.toHaveBeenCalled()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(getLink).toHaveBeenCalledTimes(1)
    expect(startDownload).toHaveBeenCalledWith('https://storage.test/mix3.wav', { newTab: false })
  })

  it('opens external links in a new tab', async () => {
    const wrapper = mountButton({ getLink: vi.fn().mockResolvedValue({ url: 'https://img.test/c.jpg', external: true }) })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(startDownload).toHaveBeenCalledWith('https://img.test/c.jpg', { newTab: true })
  })

  it('shows progress while the link is prepared and ignores repeated clicks', async () => {
    const pending = deferred()
    const getLink = vi.fn(() => pending.promise)
    const wrapper = mountButton({ getLink })

    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    expect(wrapper.findComponent({ name: 'VBtn' }).props('loading')).toBe(true)

    pending.resolve({ url: 'https://storage.test/mix3.wav' })
    await flushPromises()

    expect(getLink).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent({ name: 'VBtn' }).props('loading')).toBe(false)
  })

  it('reports a failure and starts nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('HTTP 503')
    const wrapper = mountButton({ getLink: vi.fn().mockRejectedValue(failure) })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('error')).toEqual([[failure]])
    expect(startDownload).not.toHaveBeenCalled()
  })

  it('is labelled for screen readers and passes classes to the button', () => {
    const wrapper = mountWithPlugins(DownloadButton, {
      props: { getLink: vi.fn(), label: 'Download cover' },
      attrs: { class: 'cover-action' },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Download cover')
    expect(button.classes()).toContain('cover-action')
  })

  it('can look like the round buttons next to it', () => {
    const wrapper = mountWithPlugins(DownloadButton, {
      props: { getLink: vi.fn(), variant: 'elevated', density: 'default', size: 'small' },
    })

    expect(wrapper.findComponent({ name: 'VBtn' }).props()).toMatchObject({
      variant: 'elevated',
      density: 'default',
      size: 'small',
    })
  })
})