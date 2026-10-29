import { afterEach, describe, expect, it, vi } from 'vitest'
import { startDownload } from '@/utils/download'

describe('startDownload', () => {
  afterEach(() => vi.restoreAllMocks())

  it('follows the link through a temporary anchor and removes it', () => {
    let seen = null
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      seen = { href: this.href, target: this.target, attached: this.isConnected }
    })

    startDownload('https://storage.test/mix3.wav')

    expect(click).toHaveBeenCalledTimes(1)
    expect(seen).toEqual({ href: 'https://storage.test/mix3.wav', target: '', attached: true })
    expect(document.querySelector('a[href="https://storage.test/mix3.wav"]')).toBeNull()
  })

  it('opens links that may show instead of saving in a new tab, so the app stays open', () => {
    let target = null
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { target = this.target })

    startDownload('https://img.test/cover.jpg', { newTab: true })

    expect(target).toBe('_blank')
  })
})