import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ImageInput from '@/components/media/ImageInput.vue'
import { findButton, mountWithPlugins } from '@/test-utils/mount'

const imageFile = (name = 'cover.png', type = 'image/png', size = 1000) => {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/** jsdom does not let tests set input.files directly, so the property is redefined */
async function pickFile(wrapper, file) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

const mountInput = (props = {}) =>
  mountWithPlugins(ImageInput, { props: { upload: vi.fn().mockResolvedValue({}), ...props } })

describe('ImageInput', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => vi.restoreAllMocks())

  describe('display', () => {
    it('shows the current image', () => {
      const wrapper = mountInput({ src: 'https://img.test/a.jpg', alt: 'Artist avatar' })

      expect(wrapper.find('img').attributes('src')).toBe('https://img.test/a.jpg')
      expect(wrapper.find('img').attributes('alt')).toBe('Artist avatar')
    })

    it('shows a placeholder without an image, and accepts a custom one', () => {
      const wrapper = mountWithPlugins(ImageInput, {
        props: { upload: vi.fn() },
        slots: { placeholder: '<span class="initials">NV</span>' },
      })

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.find('.initials').text()).toBe('NV')
    })
  })

  describe('picking a file', () => {
    it('previews a valid file and offers Upload and Cancel', async () => {
      const wrapper = mountInput({ src: 'https://img.test/old.jpg' })

      await pickFile(wrapper, imageFile())

      expect(wrapper.find('img').attributes('src')).toBe('blob:preview')
      expect(findButton(wrapper, 'Upload')).toBeDefined()
      expect(findButton(wrapper, 'Cancel')).toBeDefined()
    })

    it('rejects an unsupported type without previewing it', async () => {
      const wrapper = mountInput()

      await pickFile(wrapper, imageFile('anim.gif', 'image/gif'))

      expect(wrapper.text()).toContain('Use a JPEG, PNG or WebP image.')
      expect(wrapper.find('img').exists()).toBe(false)
    })

    it('rejects a file over the limit', async () => {
      const wrapper = mountInput({ maxBytes: 1024 })

      await pickFile(wrapper, imageFile('big.png', 'image/png', 2048))

      expect(wrapper.text()).toContain('The image is larger than')
    })

    it('Cancel drops the preview and releases its memory', async () => {
      const wrapper = mountInput({ src: 'https://img.test/old.jpg' })
      await pickFile(wrapper, imageFile())

      await findButton(wrapper, 'Cancel').trigger('click')

      expect(wrapper.find('img').attributes('src')).toBe('https://img.test/old.jpg')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    })

    it('accepts a dropped file', async () => {
      const wrapper = mountInput()

      await wrapper.find('[role="button"]').trigger('drop', { dataTransfer: { files: [imageFile()] } })

      expect(wrapper.find('img').attributes('src')).toBe('blob:preview')
    })
  })

  describe('uploading', () => {
    it('uploads the picked file, emits uploaded and clears the preview', async () => {
      const upload = vi.fn().mockResolvedValue({})
      const file = imageFile()
      const wrapper = mountInput({ upload, src: 'https://img.test/new.jpg' })
      await pickFile(wrapper, file)

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(upload).toHaveBeenCalledWith(file, expect.any(Function))
      expect(wrapper.emitted('uploaded')).toHaveLength(1)
      expect(wrapper.find('img').attributes('src')).toBe('https://img.test/new.jpg')
    })

    it('shows upload progress while the request runs', async () => {
      const pending = deferred()
      const upload = vi.fn((file, onProgress) => {
        onProgress(0.4)
        return pending.promise
      })
      const wrapper = mountInput({ upload })
      await pickFile(wrapper, imageFile())

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'VProgressCircular' }).props('modelValue')).toBe(40)

      pending.resolve({})
      await flushPromises()
      expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(false)
    })

    it('keeps the file after a failed upload so the user can retry', async () => {
      const upload = vi.fn().mockRejectedValue({ response: { status: 400 } })
      const wrapper = mountInput({ upload })
      await pickFile(wrapper, imageFile())

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('This image could not be used')
      expect(findButton(wrapper, 'Upload')).toBeDefined()
      expect(wrapper.emitted('uploaded')).toBeUndefined()
    })

    it('uses custom error messages from the parent', async () => {
      const upload = vi.fn().mockRejectedValue({ response: { status: 403 } })
      const wrapper = mountInput({ upload, errorMessages: { 403: 'Not your artist.' } })
      await pickFile(wrapper, imageFile())

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Not your artist.')
    })
  })

  describe('removing', () => {
    it('offers Remove only when there is an image and a remove action', () => {
      expect(findButton(mountInput({ src: 'https://img.test/a.jpg' }), 'Remove')).toBeUndefined()
      expect(findButton(mountInput({ remove: vi.fn() }), 'Remove')).toBeUndefined()
      expect(findButton(mountInput({ src: 'https://img.test/a.jpg', remove: vi.fn() }), 'Remove')).toBeDefined()
    })

    it('calls remove and emits removed', async () => {
      const remove = vi.fn().mockResolvedValue({})
      const wrapper = mountInput({ src: 'https://img.test/a.jpg', remove })

      await findButton(wrapper, 'Remove').trigger('click')
      await flushPromises()

      expect(remove).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('removed')).toHaveLength(1)
    })
  })

  describe('link mode', () => {
    it('is offered only when the parent supports links', () => {
      expect(findButton(mountInput(), 'Link')).toBeUndefined()
      expect(findButton(mountInput({ saveLink: vi.fn() }), 'Link')).toBeDefined()
    })

    it('saves a valid link, trimmed, and emits linked', async () => {
      const saveLink = vi.fn().mockResolvedValue({})
      const wrapper = mountInput({ saveLink })
      await findButton(wrapper, 'Link').trigger('click')

      await wrapper.find('input[type="url"]').setValue('  https://img.test/cover.jpg ')
      await findButton(wrapper, 'Save link').trigger('click')
      await flushPromises()

      expect(saveLink).toHaveBeenCalledWith('https://img.test/cover.jpg')
      expect(wrapper.emitted('linked')).toHaveLength(1)
    })

    it('does not save an invalid link', async () => {
      const saveLink = vi.fn()
      const wrapper = mountInput({ saveLink })
      await findButton(wrapper, 'Link').trigger('click')

      await wrapper.find('input[type="url"]').setValue('not a url')
      await findButton(wrapper, 'Save link').trigger('click')
      await flushPromises()

      expect(saveLink).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Enter a valid URL')
    })
  })

  it('releases the preview memory when unmounted', async () => {
    const wrapper = mountInput()
    await pickFile(wrapper, imageFile())

    wrapper.unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })
})