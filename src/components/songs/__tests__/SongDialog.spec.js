import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import SongDialog from '@/components/songs/SongDialog.vue'
import CopyButton from '@/components/common/CopyButton.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import { songService } from '@/services/song.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeSong } from '@/test-utils/fixtures/songs'

vi.mock('@/services/song.service', () => ({
  songService: { create: vi.fn(), replace: vi.fn() },
}))

const SONG = makeSong({
  id: 71, trackNumber: 2, durationSeconds: 215, isrc: 'USABC2600001',
  status: 'RECORDING', lyrics: 'Neon on the windshield', explicit: true,
})

async function openDialog(props = {}) {
  const wrapper = mountWithPlugins(SongDialog, {
    props: { modelValue: false, releaseId: 42, song: null, ...props },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

const field = (wrapper, label) =>
  wrapper.findAllComponents({ name: 'VTextField' }).find((f) => f.props('label') === label)

/**
 * v-dialog teleports its content to document.body, so DOM queries on the wrapper miss it.
 * The component tree still contains it: search VBtn components by their text.
 */
const button = (wrapper, text) =>
  wrapper.findAllComponents({ name: 'VBtn' }).find((btn) => btn.text() === text)


async function fill(wrapper, label, value) {
  field(wrapper, label).vm.$emit('update:modelValue', value)
  await flushPromises()
}

async function submitForm(wrapper) {
  await wrapper.findComponent({ name: 'VForm' }).trigger('submit')
  await flushPromises()
}

describe('SongDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('read view', () => {
    it('shows the details, the readable ISRC with a copy button, and collapsible lyrics', async () => {
      const wrapper = await openDialog({ song: SONG })

      const text = document.body.textContent
      expect(text).toContain('Night Drive')
      expect(text).toContain('3:35')
      expect(text).toContain('US-ABC-26-00001')
      expect(text).toContain('Explicit')
      expect(wrapper.findComponent(CopyButton).props('text')).toBe('USABC2600001')
      expect(wrapper.findComponent(ExpandableText).props()).toMatchObject({ text: 'Neon on the windshield', lines: 8 })
    })

    it('switches to the form with Edit, and back with Cancel', async () => {
      const wrapper = await openDialog({ song: SONG })

      await button(wrapper, 'Edit').trigger('click')
      await flushPromises()
      expect(field(wrapper, 'Title').props('modelValue')).toBe('Night Drive')
      expect(field(wrapper, 'Length').props('modelValue')).toBe('3:35')

      await button(wrapper, 'Cancel').trigger('click')
      await flushPromises()
      expect(wrapper.findComponent({ name: 'VForm' }).exists()).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('hands the song over for deletion and closes', async () => {
      const wrapper = await openDialog({ song: SONG })

      await button(wrapper, 'Delete').trigger('click')

      expect(wrapper.emitted('delete')).toEqual([[SONG]])
      expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    })

    it('does not offer Delete in the form', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      expect(button(wrapper, 'Delete')).toBeUndefined()
    })
  })

  describe('adding', () => {
    it('opens straight into an empty form', async () => {
      const wrapper = await openDialog()

      expect(document.body.textContent).toContain('Add song')
      expect(field(wrapper, 'Title').props('modelValue')).toBe('')
    })

    it('creates the song and reports it as new', async () => {
      const created = { ...SONG, id: 74, title: 'Bonus Track' }
      songService.create.mockResolvedValue(created)
      const wrapper = await openDialog()

      await fill(wrapper, 'Title', 'Bonus Track')
      await fill(wrapper, 'Length', '4:05')
      await submitForm(wrapper)

      expect(songService.create).toHaveBeenCalledWith(42, expect.objectContaining({
        title: 'Bonus Track', durationSeconds: 245, status: 'WRITING',
      }))
      expect(wrapper.emitted('saved')).toEqual([[created, { created: true }]])
      expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    })

    it('Cancel closes, as there is no read view to return to', async () => {
      const wrapper = await openDialog()

      await button(wrapper, 'Cancel').trigger('click')

      expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    })
  })

  describe('editing', () => {
    it('opens straight into the form from the row menu', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      expect(document.body.textContent).toContain('Edit song')
    })

    it('replaces the whole song, clearing emptied fields', async () => {
      songService.replace.mockResolvedValue({ ...SONG, isrc: null })
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      await fill(wrapper, 'ISRC', '')
      await submitForm(wrapper)

      expect(songService.replace).toHaveBeenCalledWith(42, 71, expect.objectContaining({ isrc: null, durationSeconds: 215 }))
      expect(wrapper.emitted('saved')[0][1]).toEqual({ created: false })
    })

    it('uppercases the ISRC while typing', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      await fill(wrapper, 'ISRC', 'us-abc-26-00009')

      expect(field(wrapper, 'ISRC').props('modelValue')).toBe('US-ABC-26-00009')
    })

    it('stays open and shows the error when saving fails', async () => {
      songService.replace.mockRejectedValue({ response: { status: 404 } })
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      await submitForm(wrapper)

      expect(document.body.textContent).toContain('This song no longer exists')
      expect(wrapper.emitted('saved')).toBeUndefined()
    })
  })

  describe('validation', () => {
    it.each([
      ['Title', '   '],
      ['Length', '215'],
      ['Length', '3:75'],
      ['ISRC', 'NOT-AN-ISRC'],
    ])('blocks saving with an invalid %s ("%s")', async (label, value) => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      await fill(wrapper, label, value)
      await submitForm(wrapper)

      expect(songService.replace).not.toHaveBeenCalled()
    })
  })
})