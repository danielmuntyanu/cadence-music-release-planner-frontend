import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ArtistsView from '@/views/ArtistsView.vue'
import ArtistCard from '@/components/artists/ArtistCard.vue'
import ArtistList from '@/components/artists/ArtistList.vue'
import ArtistCreatePanel from '@/components/artists/ArtistCreatePanel.vue'
import ArtistEditDialog from '@/components/artists/ArtistEditDialog.vue'
import ArtistDeleteDialog from '@/components/artists/ArtistDeleteDialog.vue'
import { artistService } from '@/services/artist.service'
import { findButton, mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

// Names sort in creation order, so index 12 is the only artist on page 2
const makeArtists = (count) =>
  Array.from({ length: count }, (_, i) => makeArtist({ name: `Artist ${String(i).padStart(2, '0')}` }))

async function mountView(artists) {
  artistService.getAll.mockResolvedValue(artists)
  const wrapper = mountWithPlugins(ArtistsView, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

const pagination = (wrapper) => wrapper.findComponent({ name: 'VPagination' })

// Snackbar content is teleported to document.body, outside the wrapper's DOM
function expectSnackbar(wrapper, message) {
  expect(wrapper.findComponent({ name: 'VSnackbar' }).props('modelValue')).toBe(true)
  expect(document.body.textContent).toContain(message)
}

describe('ArtistsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => vi.useRealTimers())

  describe('loading and errors', () => {
    it('shows skeletons while artists are loading', async () => {
      artistService.getAll.mockReturnValue(new Promise(() => {})) // never settles
      const wrapper = mountWithPlugins(ArtistsView)
      await nextTick()

      expect(wrapper.findComponent({ name: 'VSkeletonLoader' }).exists()).toBe(true)
      expect(wrapper.findComponent(ArtistCard).exists()).toBe(false)
    })

    it('shows an error with a working retry', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      artistService.getAll.mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce(makeArtists(2))
      const wrapper = mountWithPlugins(ArtistsView)
      await flushPromises()

      expect(wrapper.text()).toContain('Could not load artists')

      await findButton(wrapper, 'Retry').trigger('click')
      await flushPromises()

      expect(artistService.getAll).toHaveBeenCalledTimes(2)
      expect(wrapper.findAllComponents(ArtistCard)).toHaveLength(2)
    })
  })

  describe('roster', () => {
    it('shows the empty state and opens the create panel from it', async () => {
      const wrapper = await mountView([])
      expect(wrapper.text()).toContain('Your roster is empty')

      await findButton(wrapper, 'Add your first artist').trigger('click')

      expect(wrapper.findComponent(ArtistCreatePanel).exists()).toBe(true)
    })

    it('paginates the roster by 12', async () => {
      const wrapper = await mountView(makeArtists(13))

      expect(wrapper.findAllComponents(ArtistCard)).toHaveLength(12)
      expect(pagination(wrapper).exists()).toBe(true)
    })

    it('hides pagination when everything fits on one page', async () => {
      const wrapper = await mountView(makeArtists(5))

      expect(pagination(wrapper).exists()).toBe(false)
    })

    it('filters by name or genre', async () => {
      const wrapper = await mountView([
        makeArtist({ name: 'Nova', genre: 'Synthwave' }),
        makeArtist({ name: 'Ada', genre: 'House' }),
      ])

      await wrapper.find('input[placeholder="Search by name or genre"]').setValue('synth')

      const cards = wrapper.findAllComponents(ArtistCard)
      expect(cards).toHaveLength(1)
      expect(cards[0].props('artist').name).toBe('Nova')
    })

    it('shows a no-results message when nothing matches', async () => {
      const wrapper = await mountView(makeArtists(3))

      await wrapper.find('input[placeholder="Search by name or genre"]').setValue('zzz')

      expect(wrapper.text()).toContain('No artists match')
    })

    it('goes back to page 1 when the search changes', async () => {
      const wrapper = await mountView(makeArtists(13))
      await pagination(wrapper).vm.$emit('update:modelValue', 2)
      await nextTick()

      await wrapper.find('input[placeholder="Search by name or genre"]').setValue('Artist')

      expect(pagination(wrapper).props('modelValue')).toBe(1)
    })
  })

  describe('view mode', () => {
    it('switches to the list view and remembers the choice', async () => {
      const wrapper = await mountView(makeArtists(2))

      await wrapper.find('button[aria-label="List view"]').trigger('click')

      expect(wrapper.findComponent(ArtistList).exists()).toBe(true)
      expect(localStorage.getItem('cadence.artists.view')).toBe('list')
    })

    it('restores the saved view on load', async () => {
      localStorage.setItem('cadence.artists.view', 'list')

      const wrapper = await mountView(makeArtists(2))

      expect(wrapper.findComponent(ArtistList).exists()).toBe(true)
      expect(wrapper.findComponent(ArtistCard).exists()).toBe(false)
    })
  })

  describe('creating', () => {
    it('closes the panel, jumps to the new artist and highlights it briefly', async () => {
      const artists = makeArtists(13)
      const wrapper = await mountView(artists)
      await findButton(wrapper, 'New artist').trigger('click')
      vi.useFakeTimers()

      wrapper.findComponent(ArtistCreatePanel).vm.$emit('created', artists[12])
      await flushPromises()

      expect(wrapper.findComponent(ArtistCreatePanel).exists()).toBe(false)
      expect(pagination(wrapper).props('modelValue')).toBe(2)
      expect(wrapper.findComponent(ArtistCard).props('highlighted')).toBe(true)
      expectSnackbar(wrapper, 'Artist created')

      vi.advanceTimersByTime(2500)
      await nextTick()

      expect(wrapper.findComponent(ArtistCard).props('highlighted')).toBe(false)
    })
  })

  describe('edit and delete', () => {
    it.each([
      ['grid', ArtistCard],
      ['list', ArtistList],
    ])('opens the edit dialog for the chosen artist from the %s view', async (view, ItemComponent) => {
      localStorage.setItem('cadence.artists.view', view)
      const artists = makeArtists(2)
      const wrapper = await mountView(artists)

      await wrapper.findComponent(ItemComponent).vm.$emit('edit', artists[1])

      const dialog = wrapper.findComponent(ArtistEditDialog)
      expect(dialog.props('modelValue')).toBe(true)
      expect(dialog.props('artist')).toEqual(artists[1])
    })

    it('opens the delete dialog for the chosen artist', async () => {
      const artists = makeArtists(2)
      const wrapper = await mountView(artists)

      await wrapper.findComponent(ArtistCard).vm.$emit('delete', artists[0])

      const dialog = wrapper.findComponent(ArtistDeleteDialog)
      expect(dialog.props('modelValue')).toBe(true)
      expect(dialog.props('artist')).toEqual(artists[0])
    })

    it.each([
      ['a saved edit', ArtistEditDialog, 'updated', 'Changes saved'],
      ['a deletion', ArtistDeleteDialog, 'deleted', 'Artist deleted'],
    ])('confirms %s with a snackbar', async (_label, Dialog, event, message) => {
      const artists = makeArtists(2)
      const wrapper = await mountView(artists)

      await wrapper.findComponent(Dialog).vm.$emit(event, artists[0])
      await flushPromises()

      expectSnackbar(wrapper, message)
    })
  })
})