import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseOverviewTab from '@/components/releases/tabs/ReleaseOverviewTab.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import EditableField from '@/components/common/EditableField.vue'
import IsoDateInput from '@/components/common/IsoDateInput.vue'
import ReleaseArtistsPicker from '@/components/releases/ReleaseArtistsPicker.vue'
import { RELEASE_TYPES } from '@/constants/release-types'
import { releaseService } from '@/services/release.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { update: vi.fn(), updateGenres: vi.fn(), updateDates: vi.fn() },
}))

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn().mockResolvedValue([]) },
}))

// ---------- Helpers ----------

const mountTab = (overrides = {}) =>
  mountWithPlugins(ReleaseOverviewTab, { props: { release: makeRelease({ id: 42, ...overrides }) } })

const field = (wrapper, label) =>
  wrapper.findAllComponents(EditableField).find((f) => f.props('label') === label)

/** Calls the field's save function directly: the editing UI itself is covered by EditableField tests */
const saveField = async (wrapper, label, draft) => {
  await field(wrapper, label).props('save')(draft)
  await flushPromises()
}

/** Opens a field's editor the way a user does: by its pencil */
async function openEditor(wrapper, label) {
  await wrapper.find(`button[aria-label="Edit ${label.toLowerCase()}"]`).trigger('click')
  await flushPromises()
  return field(wrapper, label)
}

/** Runs every validation rule of an input against a value; returns the first message, or true */
const validate = (input, value) => {
  for (const rule of input.props('rules')) {
    const result = rule(value)
    if (result !== true) return result
  }
  return true
}

// ---------- Tests ----------

describe('ReleaseOverviewTab', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('display', () => {
    it('shows filled values in the brand color and missing ones muted', () => {
      const wrapper = mountTab({ type: 'ALBUM', releaseDate: null })

      const type = field(wrapper, 'Type').find('.text-primary')
      expect(type.text()).toBe('Album')
      expect(field(wrapper, 'Dates').text()).toContain('Not set')
      expect(field(wrapper, 'Dates').find('.text-primary').exists()).toBe(false)
    })

    it('shows the original release under the release date for reissues', () => {
      const wrapper = mountTab({ releaseDate: '2026-12-04', originalReleaseDate: '2020-05-01' })

      expect(field(wrapper, 'Dates').text()).toContain('Original release:')
    })

    it('joins both genres in one row', () => {
      expect(field(mountTab({ primaryGenre: 'ROCK', secondaryGenre: 'POP' }), 'Genres').text()).toContain('Rock · Pop')
    })

    it('shows notes in a collapsible block', () => {
      expect(mountTab({ notes: 'Master v3' }).findComponent(ExpandableText).props('text')).toBe('Master v3')
    })

    it('lets the phase and creation date be read but not edited here', () => {
      const wrapper = mountTab()

      expect(field(wrapper, 'Phase').props('editable')).toBe(false)
      expect(field(wrapper, 'Added').props('editable')).toBe(false)
    })

    it('shows when the release was added', () => {
      const wrapper = mountTab({ createdAt: '2026-10-01T10:00:00Z' })

      const added = field(wrapper, 'Added')
      expect(added.text()).toContain('2026')
      expect(added.find('.text-primary').exists()).toBe(true)
    })

    it('shows a muted dash when the creation date is unknown', () => {
      const added = field(mountTab({ createdAt: null }), 'Added')

      expect(added.text()).toContain('—')
      expect(added.find('.text-primary').exists()).toBe(false)
    })

    it('lists artists as links, marking only the first as primary', () => {
      const wrapper = mountTab({
        artists: [{ id: 2, name: 'Ada', avatarUrl: null }, { id: 1, name: 'Nova', avatarUrl: null }],
      })

      const items = field(wrapper, 'Artists').findAllComponents({ name: 'VListItem' })
      expect(items.map((item) => item.text())).toEqual([
        expect.stringContaining('Ada'),
        expect.stringContaining('Nova'),
      ])
      expect(items[0].text()).toContain('Primary artist')
      expect(items[1].text()).not.toContain('Primary artist')
      expect(wrapper.find('a[href="/artists/2"]').exists()).toBe(true)
    })

    it('says so when the release has no artist', () => {
      expect(field(mountTab({ artists: [] }), 'Artists').text()).toContain('No artist yet.')
    })
  })

  describe('editors', () => {
    it('allows only one open editor on the tab', async () => {
      const wrapper = mountTab()

      await openEditor(wrapper, 'Name')
      await openEditor(wrapper, 'Notes')

      expect(field(wrapper, 'Name').findComponent({ name: 'VTextField' }).exists()).toBe(false)
      expect(field(wrapper, 'Notes').findComponent({ name: 'VTextarea' }).exists()).toBe(true)
    })

    it('validates the name', async () => {
      const wrapper = mountTab({ name: 'Night Drive' })
      const input = (await openEditor(wrapper, 'Name')).findComponent({ name: 'VTextField' })

      expect(input.props('modelValue')).toBe('Night Drive')
      expect(validate(input, '   ')).toBe('Name is required')
      expect(validate(input, 'x'.repeat(151))).toBe('Max 150 characters')
      expect(validate(input, 'Night Drive (Deluxe)')).toBe(true)
    })

    it('offers every release type and starts from the current one', async () => {
      const wrapper = mountTab({ type: 'EP' })
      const editor = await openEditor(wrapper, 'Type')

      expect(editor.findAllComponents({ name: 'VChip' })).toHaveLength(RELEASE_TYPES.length)
      expect(editor.findComponent({ name: 'VChipGroup' }).props('modelValue')).toBe('EP')
    })

    it('validates notes length', async () => {
      const wrapper = mountTab({ notes: 'Old' })
      const input = (await openEditor(wrapper, 'Notes')).findComponent({ name: 'VTextarea' })

      expect(validate(input, 'x'.repeat(1025))).toBe('Max 1024 characters')
      expect(validate(input, 'x'.repeat(1024))).toBe(true)
    })

    describe('dates', () => {
      async function openDates(dates) {
        const wrapper = mountTab(dates)
        const inputs = (await openEditor(wrapper, 'Dates')).findAllComponents(IsoDateInput)
        return {
          wrapper,
          releaseInput: inputs[0],
          originalInput: inputs[1],
          // IsoDateInput passes rules through $attrs: they become a prop of the inner VDateInput
          originalDateField: inputs[1].findComponent({ name: 'VDateInput' }),
        }
      }

      it('starts from the saved dates', async () => {
        const { releaseInput, originalInput } = await openDates({ releaseDate: '2026-12-04', originalReleaseDate: '2020-05-01' })

        expect(releaseInput.props('modelValue')).toBe('2026-12-04')
        expect(originalInput.props('modelValue')).toBe('2020-05-01')
      })

      it('rejects an original release on or after the release date', async () => {
        const { originalDateField } = await openDates({ releaseDate: '2026-01-01', originalReleaseDate: '2026-06-01' })

        expect(validate(originalDateField)).toBe('Must be before the release date')
      })

      it('accepts an earlier original release, or either date missing', async () => {
        const cases = [
          { releaseDate: '2026-12-04', originalReleaseDate: '2020-05-01' },
          { releaseDate: null, originalReleaseDate: '2020-05-01' },
          { releaseDate: '2026-12-04', originalReleaseDate: null },
        ]

        for (const dates of cases) {
          const { originalDateField } = await openDates(dates)
          expect(validate(originalDateField)).toBe(true)
        }
      })

      it('re-checks the rule against the dates being edited, not the saved ones', async () => {
        const { originalInput, originalDateField } = await openDates({ releaseDate: '2026-12-04', originalReleaseDate: '2020-05-01' })

        originalInput.vm.$emit('update:modelValue', '2027-01-01')
        await flushPromises()

        expect(validate(originalDateField)).toBe('Must be before the release date')
      })
    })
    describe('genres', () => {
      async function openGenres(genres) {
        const wrapper = mountTab(genres)
        const inputs = (await openEditor(wrapper, 'Genres')).findAllComponents({ name: 'VAutocomplete' })
        return { primary: inputs[0], secondary: inputs[1] }
      }

      it('requires a primary genre', async () => {
        const { primary } = await openGenres({ primaryGenre: 'ROCK' })

        expect(validate(primary, null)).toBe('Primary genre is required')
        expect(validate(primary, 'POP')).toBe(true)
      })

      it('does not offer the primary genre as the secondary one', async () => {
        const { secondary } = await openGenres({ primaryGenre: 'ROCK', secondaryGenre: null })

        expect(secondary.props('items').map((genre) => genre.value)).not.toContain('ROCK')
      })

      it('clears the secondary genre when it becomes the primary one', async () => {
        const { primary, secondary } = await openGenres({ primaryGenre: 'ROCK', secondaryGenre: 'POP' })

        primary.vm.$emit('update:modelValue', 'POP')
        await flushPromises()

        expect(primary.props('modelValue')).toBe('POP')
        expect(secondary.props('modelValue')).toBeNull()
      })

      it('keeps the secondary genre when a different primary is picked', async () => {
        const { primary, secondary } = await openGenres({ primaryGenre: 'ROCK', secondaryGenre: 'POP' })

        primary.vm.$emit('update:modelValue', 'JAZZ')
        await flushPromises()

        expect(secondary.props('modelValue')).toBe('POP')
      })
    })

    describe('artists', () => {
      it('starts from the current artist order', async () => {
        const wrapper = mountTab({ artists: [{ id: 2, name: 'Ada' }, { id: 1, name: 'Nova' }] })
        const editor = await openEditor(wrapper, 'Artists')

        expect(editor.findComponent(ReleaseArtistsPicker).props('modelValue')).toEqual([2, 1])
      })

      it('blocks saving while a new artist is being created', async () => {
        const wrapper = mountTab()
        const editor = await openEditor(wrapper, 'Artists')

        editor.findComponent(ReleaseArtistsPicker).vm.$emit('update:creatorOpen', true)
        await flushPromises()

        expect(field(wrapper, 'Artists').props('saveDisabled')).toBe(true)
        expect(field(wrapper, 'Artists').text()).toContain('Finish or cancel the new artist first')
      })

      it('explains a missing artist differently from a missing release', () => {
        const messages = field(mountTab(), 'Artists').props('errorMessages')

        expect(messages[404]).toBe('One of the selected artists no longer exists.')
        expect(messages[409]).toBe('You already have a release with this name.')
      })
    })
  })

  describe('saving', () => {
    it('saves the trimmed name through PATCH and reports the saved release', async () => {
      const saved = makeRelease({ id: 42, name: 'Night Drive (Deluxe)' })
      releaseService.update.mockResolvedValue(saved)
      const wrapper = mountTab()

      await saveField(wrapper, 'Name', '  Night Drive (Deluxe) ')

      expect(releaseService.update).toHaveBeenCalledWith(42, { name: 'Night Drive (Deluxe)' })
      expect(wrapper.emitted('updated')).toEqual([[saved]])
    })

    it('saves the type through PATCH', async () => {
      releaseService.update.mockResolvedValue(makeRelease({ id: 42 }))
      const wrapper = mountTab()

      await saveField(wrapper, 'Type', 'EP')

      expect(releaseService.update).toHaveBeenCalledWith(42, { type: 'EP' })
    })

    it('saves both dates together, null clearing one', async () => {
      releaseService.updateDates.mockResolvedValue(makeRelease({ id: 42 }))
      const wrapper = mountTab({ releaseDate: '2026-12-04', originalReleaseDate: '2020-05-01' })

      await saveField(wrapper, 'Dates', { releaseDate: '2026-12-04', originalReleaseDate: null })

      expect(releaseService.updateDates).toHaveBeenCalledWith(42, { releaseDate: '2026-12-04', originalReleaseDate: null })
    })

    it('saves both genres together', async () => {
      releaseService.updateGenres.mockResolvedValue(makeRelease({ id: 42 }))
      const wrapper = mountTab()

      await saveField(wrapper, 'Genres', { primaryGenre: 'ROCK', secondaryGenre: null })

      expect(releaseService.updateGenres).toHaveBeenCalledWith(42, { primaryGenre: 'ROCK', secondaryGenre: null })
    })

    it('sends cleared notes as an empty string, which the API treats as "clear"', async () => {
      releaseService.update.mockResolvedValue(makeRelease({ id: 42 }))
      const wrapper = mountTab({ notes: 'Old' })

      await saveField(wrapper, 'Notes', null)

      expect(releaseService.update).toHaveBeenCalledWith(42, { notes: '' })
    })

    it('saves the artist order through PATCH', async () => {
      releaseService.update.mockResolvedValue(makeRelease({ id: 42 }))
      const wrapper = mountTab({ artists: [{ id: 1, name: 'Nova' }, { id: 2, name: 'Ada' }] })

      expect(field(wrapper, 'Artists').props('value')).toEqual([1, 2])
      await saveField(wrapper, 'Artists', [2, 1])

      expect(releaseService.update).toHaveBeenCalledWith(42, { artistIds: [2, 1] })
    })

    it('saves an edited name end to end: pencil, typing, Enter', async () => {
      const saved = makeRelease({ id: 42, name: 'Night Drive (Deluxe)' })
      releaseService.update.mockResolvedValue(saved)
      const wrapper = mountTab({ name: 'Night Drive' })
      const editor = await openEditor(wrapper, 'Name')

      editor.findComponent({ name: 'VTextField' }).vm.$emit('update:modelValue', 'Night Drive (Deluxe)')
      await flushPromises()
      await editor.find('form').trigger('submit')
      await flushPromises()

      expect(releaseService.update).toHaveBeenCalledWith(42, { name: 'Night Drive (Deluxe)' })
      expect(wrapper.emitted('updated')).toEqual([[saved]])
    })

    it('does not report anything when saving fails, so the editor can show the error', async () => {
      releaseService.update.mockRejectedValue({ response: { status: 409 } })
      const wrapper = mountTab()

      await expect(field(wrapper, 'Name').props('save')('Taken')).rejects.toBeTruthy()

      expect(wrapper.emitted('updated')).toBeUndefined()
    })
  })
})