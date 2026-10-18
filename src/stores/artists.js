import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { artistService } from '@/services/artist.service'

const byName = (a, b) => a.name.localeCompare(b.name)

export const useArtistsStore = defineStore('artists', () => {
  /** @type {import('vue').Ref<import('@/models/artist').Artist[]>} */
  const artists = ref([])
  const loading = ref(false)
  const ready = ref(false)
  const error = ref(null)

  const isEmpty = computed(() => ready.value && artists.value.length === 0)

  let loadPromise = null

  function load() {
    loadPromise ??= fetchAll()
    return loadPromise
  }

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const data = await artistService.getAll()
      artists.value = data.sort(byName)
      ready.value = true
    } catch (e) {
      error.value = e
      loadPromise = null
      console.error('### artists/getAll failed:\n', e)
    } finally {
      loading.value = false
    }
  }

  function findById(id) {
    return artists.value.find((artist) => artist.id === id) ?? null
  }

  async function create(payload) {
    const created = await artistService.create(payload)
    artists.value = [...artists.value, created].sort(byName)
    return created
  }

  async function update(id, payload) {
    const updated = await artistService.update(id, payload)
    artists.value = artists.value.map((artist) => (artist.id === id ? updated : artist)).sort(byName)
    return updated
  }

  async function remove(id) {
    await artistService.delete(id)
    artists.value = artists.value.filter((artist) => artist.id !== id)
  }

  function reset() {
    artists.value = []
    ready.value = false
    error.value = null
    loadPromise = null
  }

  async function fetchById(id) {
    const artist = await artistService.getById(id)
    const exists = artists.value.some((a) => a.id === id)
    artists.value = exists
      ? artists.value.map((a) => (a.id === id ? artist : a))
      : [...artists.value, artist].sort(byName)
    return artist
  }

  return { artists, loading, ready, error, isEmpty, load, fetchAll, findById, create, update, remove, reset, fetchById }
})