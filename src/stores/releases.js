import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { releaseService } from '@/services/release.service'
import { createReleaseFilters, toReleaseQuery } from '@/models/release'
import { DEFAULT_RELEASE_SORT } from '@/constants/release-sorts'

const PAGE_SIZE = 24

const emptyPage = () => ({ number: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 })

export const useReleasesStore = defineStore('releases', () => {
  /** @type {import('vue').Ref<import('@/models/release').Release[]>} */
  const releases = ref([])
  /** @type {import('vue').Ref<import('@/models/page').PageMeta>} */
  const page = ref(emptyPage())
  /** @type {import('vue').Ref<import('@/models/release').ReleaseFilters>} */
  const filters = ref(createReleaseFilters())
  const sort = ref(DEFAULT_RELEASE_SORT)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref(null)

  const hasFilters = computed(() => {
    const f = filters.value
    return f.phase.length > 0 || f.type.length > 0 || f.genre.length > 0 || f.artistId != null || f.q.trim() !== ''
  })

  // "No releases yet" and "nothing matches the filters" need different empty states
  const isEmpty = computed(() => ready.value && page.value.totalElements === 0 && !hasFilters.value)

  // Only the latest request may write state: a slow earlier response must not overwrite newer results
  let latestRequest = 0

  async function fetchPage(pageNumber = page.value.number) {
    const requestId = ++latestRequest
    loading.value = true
    error.value = null
    try {
      const query = toReleaseQuery(filters.value, { page: pageNumber, size: PAGE_SIZE, sort: sort.value })
      const result = await releaseService.getAll(query)
      if (requestId !== latestRequest) return
      // A page past the end (e.g. ?page=99 in the URL) falls back to the last real page
      if (!result.items.length && pageNumber > 0 && result.page.totalPages > 0) {
        return fetchPage(result.page.totalPages - 1)
      }
      releases.value = result.items
      page.value = result.page
      ready.value = true
    } catch (e) {
      if (requestId !== latestRequest) return
      error.value = e
      console.error('### releases/getAll failed:\n', e)
    } finally {
      if (requestId === latestRequest) loading.value = false
    }
  }

  function setFilters(patch) {
    filters.value = { ...filters.value, ...patch }
    return fetchPage(0)
  }

  function clearFilters() {
    filters.value = createReleaseFilters()
    return fetchPage(0)
  }

  function setSort(value) {
    sort.value = value
    return fetchPage(0)
  }

  function setPage(pageNumber) {
    return fetchPage(pageNumber)
  }

  function findById(id) {
    return releases.value.find((release) => release.id === id) ?? null
  }

  function replace(updated) {
    releases.value = releases.value.map((release) => (release.id === updated.id ? updated : release))
  }

  async function create(payload) {
    const created = await releaseService.create(payload)
    // The server decides where it lands under the current sort and filters
    await fetchPage(0)
    return created
  }

  async function update(id, payload) {
    const updated = await releaseService.update(id, payload)
    replace(updated)
    return updated
  }

  async function updatePhase(id, phase) {
    const updated = await releaseService.updatePhase(id, phase)
    replace(updated)
    return updated
  }

  async function remove(id) {
    await releaseService.delete(id)
    // Deleting the last item on a page steps back one page instead of showing an empty one
    const isLastOnPage = releases.value.length === 1 && page.value.number > 0
    await fetchPage(isLastOnPage ? page.value.number - 1 : page.value.number)
  }

  function reset() {
    latestRequest++ // ignore any response still in flight
    releases.value = []
    page.value = emptyPage()
    filters.value = createReleaseFilters()
    sort.value = DEFAULT_RELEASE_SORT
    loading.value = false
    ready.value = false
    error.value = null
  }

  /** Applies filters, sort and page in one go (e.g. from the URL) with a single request. */
  function hydrate(state) {
    filters.value = state.filters
    sort.value = state.sort
    return fetchPage(state.page)
  }

  return {
    releases,
    page,
    filters,
    sort,
    loading,
    ready,
    error,
    hasFilters,
    isEmpty,
    fetchPage,
    setFilters,
    clearFilters,
    setSort,
    setPage,
    findById,
    create,
    update,
    updatePhase,
    remove,
    reset,
    hydrate,
  }
})