import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import SongDialog from '@/components/songs/SongDialog.vue'
import SongFilesSection from '@/components/songs/SongFilesSection.vue'
import SongStatusMenu from '@/components/songs/SongStatusMenu.vue'
import CopyButton from '@/components/common/CopyButton.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import { songService } from '@/services/song.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeSong } from '@/test-utils/fixtures/songs'

vi.mock('@/services/song.service', () => ({
  songService: {
    create: vi.fn(),
    replace: vi.fn(),
    updateStatus: vi.fn(),
    // The file section loads the song's files when the dialog opens with a release
    getFiles: vi.fn().mockResolvedValue([]),
  },
}))

const RELEASE = { id: 42, name: 'Neon Siesta', artworkUrl: null }

const SONG = makeSong({
  id: 71, trackNumber: 2, durationSeconds: 215, isrc: 'USABC2600001',
  status: 'RECORDING', lyrics: 'Neon on the windshield', explicit: true,
})

// ---------- Helpers ----------

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

const lyrics = (wrapper) => wrapper.findComponent({ name: 'VTextarea' })

/**
 * v-dialog teleports its content to document.body, so DOM queries on the wrapper miss it.
 * The component tree still contains it: search VBtn components by their text.
 */
const button = (wrapper, text) =>
  wrapper.findAllComponents({ name: 'VBtn' }).find((btn) => btn.text() === text)

/** Icon-only buttons have no text: find them by their accessible name */
const iconButton = (label) => document.body.querySelector(`button[aria-label="${label}"]`)

const copyButton = (wrapper, label) =>
  wrapper.findAllComponents(CopyButton).find((copy) => copy.props('label') === label)

const isInForm = (wrapper) => wrapper.findComponent({ name: 'VForm' }).exists()

/** Field labels in the order they appear; Vuetify also renders a floating copy of each, kept once */
function labelsInForm() {
  const labels = [...document.body.querySelectorAll('.v-dialog .v-label')].map((label) => label.textContent.trim())
  return labels.filter((label, index) => label && labels.indexOf(label) === index)
}

async function fill(wrapper, label, value) {
  field(wrapper, label).vm.$emit('update:modelValue', value)
  await flushPromises()
}

async function submitForm(wrapper) {
  await wrapper.findComponent({ name: 'VForm' }).trigger('submit')
  await flushPromises()
}

async function clickIcon(label) {
  iconButton(label).click()
  await flushPromises()
}

// ---------- Tests ----------

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
      expect(copyButton(wrapper, 'Copy ISRC').props('text')).toBe('USABC2600001')
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
      expect(isInForm(wrapper)).toBe(false)
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

      // Guard: the lookup itself works inside the dialog, so "undefined" below means "absent"
      expect(button(wrapper, 'Save')).toBeDefined()
      expect(button(wrapper, 'Delete')).toBeUndefined()
    })
  })

  describe('files and lyrics', () => {
    it('shows the files of the song when the release is known', async () => {
      const wrapper = await openDialog({ song: SONG, release: RELEASE })

      const files = wrapper.findComponent(SongFilesSection)
      expect(files.props()).toMatchObject({ release: RELEASE, song: SONG })
      expect(songService.getFiles).toHaveBeenCalledWith(42, 71)
    })

    it('has no file section without the release: the player needs it', async () => {
      const wrapper = await openDialog({ song: SONG })

      expect(wrapper.findComponent(SongFilesSection).exists()).toBe(false)
    })

    it('reports file changes so the tracklist can refresh', async () => {
      const wrapper = await openDialog({ song: SONG, release: RELEASE })

      wrapper.findComponent(SongFilesSection).vm.$emit('changed')

      expect(wrapper.emitted('files-changed')).toHaveLength(1)
    })

    it('lets the lyrics be copied', async () => {
      const wrapper = await openDialog({ song: SONG })

      expect(copyButton(wrapper, 'Copy lyrics').props('text')).toBe('Neon on the windshield')
    })

    it('offers no copy button without lyrics', async () => {
      const wrapper = await openDialog({ song: { ...SONG, lyrics: '' } })

      expect(copyButton(wrapper, 'Copy lyrics')).toBeUndefined()
    })
  })

  describe('status from the read view', () => {
    it('saves a new status at once, shows it and keeps the dialog open', async () => {
      const updated = { ...SONG, status: 'DONE' }
      songService.updateStatus.mockResolvedValue(updated)
      const wrapper = await openDialog({ song: SONG })

      wrapper.findComponent(SongStatusMenu).vm.$emit('change', 'DONE')
      await flushPromises()

      expect(songService.updateStatus).toHaveBeenCalledWith(42, 71, 'DONE')
      expect(wrapper.emitted('saved')).toEqual([[updated, { created: false }]])
      expect(wrapper.findComponent(SongStatusMenu).props('status')).toBe('DONE')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('shows the status as saving meanwhile', async () => {
      songService.updateStatus.mockReturnValue(new Promise(() => {}))
      const wrapper = await openDialog({ song: SONG })

      wrapper.findComponent(SongStatusMenu).vm.$emit('change', 'DONE')
      await flushPromises()

      expect(wrapper.findComponent(SongStatusMenu).props('loading')).toBe(true)
    })

    it('explains a failed change and reports nothing', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      songService.updateStatus.mockRejectedValue(new Error('Network'))
      const wrapper = await openDialog({ song: SONG })

      wrapper.findComponent(SongStatusMenu).vm.$emit('change', 'DONE')
      await flushPromises()

      expect(document.body.textContent).toContain('Could not change the status. Try again.')
      expect(wrapper.emitted('saved')).toBeUndefined()
    })
  })

  describe('status options in the form', () => {
    it('renders every status with its icon and color', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })
      const select = wrapper.findAllComponents({ name: 'VSelect' }).find((s) => s.props('label') === 'Status')

      await select.find('.v-field').trigger('mousedown')
      await flushPromises()

      // Opening the list used to crash on item.raw with Vuetify 4
      const items = wrapper.findAllComponents({ name: 'VListItem' })
      const recording = items.find((item) => item.props('title') === 'Recording')
      expect(recording.props()).toMatchObject({ prependIcon: 'mdi-microphone-outline', baseColor: 'warning' })
    })
  })

  describe('quick editing and the lyrics editor', () => {
    it('orders the form: title, lyrics, explicit, length and status, ISRC last', async () => {
      await openDialog({ song: SONG, startInEdit: true })

      expect(labelsInForm()).toEqual(['Title', 'Lyrics', 'Explicit lyrics', 'Length', 'Status', 'ISRC'])
    })

    it('the pencil next to the title opens the form in the title', async () => {
      const wrapper = await openDialog({ song: SONG })

      await clickIcon('Edit song')

      expect(field(wrapper, 'Title').props('modelValue')).toBe('Night Drive')
      expect(document.activeElement).toBe(field(wrapper, 'Title').find('input').element)
    })

    it('the pencil next to the lyrics opens the form in the lyrics', async () => {
      const wrapper = await openDialog({ song: SONG })

      await clickIcon('Edit lyrics')

      expect(document.activeElement).toBe(lyrics(wrapper).find('textarea').element)
    })

    it('offers to add lyrics when there are none', async () => {
      await openDialog({ song: { ...SONG, lyrics: '' } })

      expect(iconButton('Add lyrics')).not.toBeNull()
    })

    it('expands the lyrics, hiding the other fields but keeping what was typed', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })
      await fill(wrapper, 'Title', 'Night Drive (Edit)')

      await clickIcon('Expand the lyrics editor')

      expect(field(wrapper, 'Title').isVisible()).toBe(false)
      expect(lyrics(wrapper).isVisible()).toBe(true)
      expect(wrapper.findComponent({ name: 'VDialog' }).props('maxWidth')).toBe(1100)
      expect(document.body.textContent).toContain('Night Drive (Edit)')

      await button(wrapper, 'Back to form').trigger('click')
      await flushPromises()
      expect(field(wrapper, 'Title').props('modelValue')).toBe('Night Drive (Edit)')
      expect(field(wrapper, 'Title').isVisible()).toBe(true)
    })

    it('Esc leaves the expanded editor first, without closing the dialog', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })
      await clickIcon('Expand the lyrics editor')

      await lyrics(wrapper).find('textarea').trigger('keydown', { key: 'Escape' })
      await flushPromises()

      expect(field(wrapper, 'Title').isVisible()).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('saves from the expanded editor', async () => {
      songService.replace.mockResolvedValue({ ...SONG, lyrics: 'New verse' })
      const wrapper = await openDialog({ song: SONG, startInEdit: true })
      await clickIcon('Expand the lyrics editor')

      lyrics(wrapper).vm.$emit('update:modelValue', 'New verse')
      await submitForm(wrapper)

      expect(songService.replace).toHaveBeenCalledWith(42, 71, expect.objectContaining({ lyrics: 'New verse' }))
    })

    it('shows the whole form again when a hidden field is invalid', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })
      await fill(wrapper, 'ISRC', 'NOT-AN-ISRC')
      await clickIcon('Expand the lyrics editor')

      await submitForm(wrapper)

      expect(songService.replace).not.toHaveBeenCalled()
      expect(field(wrapper, 'ISRC').isVisible()).toBe(true)
    })
  })

  describe('after saving', () => {
    it('shows the saved song instead of closing', async () => {
      const saved = { ...SONG, title: 'Night Drive (Edit)', lyrics: 'New verse' }
      songService.replace.mockResolvedValue(saved)
      const wrapper = await openDialog({ song: SONG })
      await button(wrapper, 'Edit').trigger('click')
      await flushPromises()

      await fill(wrapper, 'Title', 'Night Drive (Edit)')
      await submitForm(wrapper)

      expect(wrapper.emitted('saved')).toEqual([[saved, { created: false }]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(isInForm(wrapper)).toBe(false)
      expect(document.body.textContent).toContain('Night Drive (Edit)')
      expect(wrapper.findComponent(ExpandableText).props('text')).toBe('New verse')
    })

    it('a new song opens in its read view, ready for files', async () => {
      const created = { ...SONG, id: 74, trackNumber: 6, title: 'Bonus Track' }
      songService.create.mockResolvedValue(created)
      const wrapper = await openDialog({ release: RELEASE })

      await fill(wrapper, 'Title', 'Bonus Track')
      await submitForm(wrapper)

      expect(isInForm(wrapper)).toBe(false)
      expect(document.body.textContent).toContain('Track 6')
      expect(wrapper.findComponent(SongFilesSection).props('song')).toEqual(created)
    })

    it('editing the new song again saves it, not a second new one', async () => {
      const created = { ...SONG, id: 74, title: 'Bonus Track' }
      songService.create.mockResolvedValue(created)
      songService.replace.mockResolvedValue({ ...created, title: 'Bonus Track (Live)' })
      const wrapper = await openDialog()
      await fill(wrapper, 'Title', 'Bonus Track')
      await submitForm(wrapper)

      await button(wrapper, 'Edit').trigger('click')
      await flushPromises()
      await fill(wrapper, 'Title', 'Bonus Track (Live)')
      await submitForm(wrapper)

      expect(songService.create).toHaveBeenCalledTimes(1)
      expect(songService.replace).toHaveBeenCalledWith(42, 74, expect.objectContaining({ title: 'Bonus Track (Live)' }))
    })

    it('Cancel after editing from the read view goes back to it, even when opened from the row menu', async () => {
      songService.replace.mockResolvedValue(SONG)
      const wrapper = await openDialog({ song: SONG, startInEdit: true })
      await submitForm(wrapper)

      await button(wrapper, 'Edit').trigger('click')
      await flushPromises()
      await button(wrapper, 'Cancel').trigger('click')
      await flushPromises()

      expect(isInForm(wrapper)).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
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
    })

    it('Cancel closes, as there is no read view to return to', async () => {
      const wrapper = await openDialog()

      await button(wrapper, 'Cancel').trigger('click')

      expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
    })
  })

  describe('editing', () => {
    it('opens straight into the form from the row menu', async () => {
      await openDialog({ song: SONG, startInEdit: true })

      expect(document.body.textContent).toContain('Edit song')
    })

    it('Cancel from the row menu closes, as the read view was never shown', async () => {
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      await button(wrapper, 'Cancel').trigger('click')

      expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
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

    it('stays in the form and shows the error when saving fails', async () => {
      songService.replace.mockRejectedValue({ response: { status: 404 } })
      const wrapper = await openDialog({ song: SONG, startInEdit: true })

      await submitForm(wrapper)

      expect(document.body.textContent).toContain('This song no longer exists')
      expect(isInForm(wrapper)).toBe(true)
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