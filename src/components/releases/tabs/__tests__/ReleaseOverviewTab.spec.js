import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseOverviewTab from '@/components/releases/tabs/ReleaseOverviewTab.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import EditableField from '@/components/common/EditableField.vue'
import { releaseService } from '@/services/release.service'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { update: vi.fn(), updateGenres: vi.fn(), updateDates: vi.fn() },
}))

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn().mockResolvedValue([]) },
}))

const mountTab = (overrides = {}) =>
  mountWithPlugins(ReleaseOverviewTab, { props: { release: makeRelease({ id: 42, ...overrides }) } })

const field = (wrapper, label) =>
  wrapper.findAllComponents(EditableField).find((f) => f.props('label') === label)

/** Calls the field's save function directly: the editing UI itself is covered by EditableField tests */
const saveField = async (wrapper, label, draft) => {
  await field(wrapper, label).props('save')(draft)
  await flushPromises()
}

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

    it('does not report anything when saving fails, so the editor can show the error', async () => {
      releaseService.update.mockRejectedValue({ response: { status: 409 } })
      const wrapper = mountTab()

      await expect(field(wrapper, 'Name').props('save')('Taken')).rejects.toBeTruthy()

      expect(wrapper.emitted('updated')).toBeUndefined()
    })
  })
})