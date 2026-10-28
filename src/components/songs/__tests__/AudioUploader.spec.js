import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import AudioUploader from '@/components/songs/AudioUploader.vue'
import { findButton, mountWithPlugins } from '@/test-utils/mount'

const audioFile = (name = 'I Belong To You mix3.wav', size = 2048) => {
  const file = new File(['RIFF'], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const mountUploader = (props = {}) => mountWithPlugins(AudioUploader, { props: { upload: vi.fn(), ...props } })

async function pick(wrapper, file) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

const nameField = (wrapper) => wrapper.findComponent({ name: 'VTextField' })

async function setName(wrapper, value) {
  nameField(wrapper).vm.$emit('update:modelValue', value)
  await flushPromises()
}

describe('AudioUploader', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('picking', () => {
    it('names the file after the picked file, without the extension', async () => {
      const wrapper = mountUploader()

      await pick(wrapper, audioFile())

      expect(nameField(wrapper).props('modelValue')).toBe('I Belong To You mix3')
      expect(nameField(wrapper).props('hint')).toBe('From I Belong To You mix3.wav · 2 KB')
    })

    it('accepts a dropped file', async () => {
      const wrapper = mountUploader()

      await wrapper.find('[role="button"]').trigger('drop', { dataTransfer: { files: [audioFile('master.flac')] } })

      expect(nameField(wrapper).props('modelValue')).toBe('master')
    })

    it('rejects a file that is not audio and keeps the drop zone', async () => {
      const wrapper = mountUploader()

      await pick(wrapper, audioFile('cover.png'))

      expect(wrapper.text()).toContain('Use WAV, AIFF, FLAC, MP3, M4A, AAC or OGG audio.')
      expect(nameField(wrapper).exists()).toBe(false)
    })

    it('rejects a file over the limit', async () => {
      const wrapper = mountUploader({ maxBytes: 1024 * 1024 })

      await pick(wrapper, audioFile('master.wav', 2 * 1024 * 1024))

      expect(wrapper.text()).toContain('The file is larger than 1 MB.')
    })

    it('Cancel before uploading forgets the file', async () => {
      const wrapper = mountUploader()
      await pick(wrapper, audioFile())

      await findButton(wrapper, 'Cancel').trigger('click')

      expect(nameField(wrapper).exists()).toBe(false)
    })
  })

  describe('uploading', () => {
    it('uploads under the edited name and resets', async () => {
      const saved = { id: 81, displayName: 'Mix 3 (final)' }
      const upload = vi.fn().mockResolvedValue(saved)
      const wrapper = mountUploader({ upload })
      const file = audioFile()
      await pick(wrapper, file)
      await setName(wrapper, '  Mix 3 (final) ')

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(upload).toHaveBeenCalledWith(file, {
        displayName: 'Mix 3 (final)',
        onProgress: expect.any(Function),
        signal: expect.any(AbortSignal),
      })
      expect(wrapper.emitted('uploaded')).toEqual([[saved]])
      expect(nameField(wrapper).exists()).toBe(false)
    })

    it('lets the server name the file when the name is cleared', async () => {
      const upload = vi.fn().mockResolvedValue({ id: 81 })
      const wrapper = mountUploader({ upload })
      await pick(wrapper, audioFile())
      await setName(wrapper, '   ')

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(upload.mock.calls[0][1].displayName).toBeNull()
    })

    it('refuses a name over 150 characters', async () => {
      const upload = vi.fn()
      const wrapper = mountUploader({ upload })
      await pick(wrapper, audioFile())
      await setName(wrapper, 'x'.repeat(151))

      await findButton(wrapper, 'Upload').trigger('click')

      expect(upload).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Names can be at most 150 characters.')
    })

    it('shows the progress', async () => {
      let report
      const upload = vi.fn((file, { onProgress }) => {
        report = onProgress
        return new Promise(() => {})
      })
      const wrapper = mountUploader({ upload })
      await pick(wrapper, audioFile())

      await findButton(wrapper, 'Upload').trigger('click')
      report(0.4)
      await flushPromises()

      expect(wrapper.findComponent({ name: 'VProgressLinear' }).props('modelValue')).toBe(40)
      expect(wrapper.text()).toContain('40%')
    })
  })

  describe('failures', () => {
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))

    it('shows the server explanation and keeps the file for another try', async () => {
      const upload = vi.fn().mockRejectedValue({ response: { status: 400, data: { message: 'Audio files must be at most 500 MB' } } })
      const wrapper = mountUploader({ upload })
      await pick(wrapper, audioFile())

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Audio files must be at most 500 MB')
      expect(nameField(wrapper).exists()).toBe(true)
    })

    it('explains a broken connection', async () => {
      const wrapper = mountUploader({ upload: vi.fn().mockRejectedValue(new Error('Network Error')) })
      await pick(wrapper, audioFile())

      await findButton(wrapper, 'Upload').trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('The upload was interrupted. Check your connection and try again.')
    })

    it('Cancel during an upload aborts it quietly and keeps the file', async () => {
      const upload = vi.fn((file, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' })))
      }))
      const wrapper = mountUploader({ upload })
      await pick(wrapper, audioFile())
      await findButton(wrapper, 'Upload').trigger('click')

      await findButton(wrapper, 'Cancel upload').trigger('click')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'VAlert' }).exists()).toBe(false)
      expect(nameField(wrapper).exists()).toBe(true)
      expect(wrapper.emitted('uploaded')).toBeUndefined()
    })
  })
})