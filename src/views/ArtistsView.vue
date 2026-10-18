<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import PageContainer from '@/components/PageContainer.vue'
import ArtistCard from '@/components/artists/ArtistCard.vue'
import ArtistList from '@/components/artists/ArtistList.vue'
import ArtistsEmptyState from '@/components/artists/ArtistsEmptyState.vue'
import ArtistCreatePanel from '@/components/artists/ArtistCreatePanel.vue'
import { useArtistsStore } from '@/stores/artists'
import ArtistEditDialog from '@/components/artists/ArtistEditDialog.vue'
import ArtistDeleteDialog from '@/components/artists/ArtistDeleteDialog.vue'

const PAGE_SIZE = 12 // divisible by 2, 3 and 4 so every grid row is full
const VIEW_STORAGE_KEY = 'cadence.artists.view'
const HIGHLIGHT_MS = 2500

const artistsStore = useArtistsStore()
const { smAndUp } = useDisplay()

const view = ref(readView())
const search = ref('')
const page = ref(1)
const creating = ref(false)
const highlightedId = ref(null)
const snackbar = ref(false)

const total = computed(() => artistsStore.artists.length)
const showSkeleton = computed(() => artistsStore.loading && !artistsStore.ready)
const showEmpty = computed(() => artistsStore.isEmpty && !creating.value)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return artistsStore.artists
  return artistsStore.artists.filter(
    (artist) => artist.name.toLowerCase().includes(query) || artist.genre.toLowerCase().includes(query)
  )
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pagedArtists = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const editOpen = ref(false)
const editTarget = ref(null)
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const snackbarText = ref('')

function openEdit(artist) {
  editTarget.value = artist
  editOpen.value = true
}

function openDelete(artist) {
  deleteTarget.value = artist
  deleteOpen.value = true
}

function notify(text) {
  snackbarText.value = text
  snackbar.value = true
}

watch(search, () => { page.value = 1 })
watch(pageCount, (count) => { if (page.value > count) page.value = count })
watch(page, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
watch(view, (value) => {
  try { localStorage.setItem(VIEW_STORAGE_KEY, value) } catch { /* storage unavailable */ }
})

function readView() {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

async function onCreated(artist) {
  creating.value = false
  search.value = ''
  notify('Artist created')

  // Wait for the search watcher to reset the page, then jump to the new artist
  await nextTick()
  const index = artistsStore.artists.findIndex((a) => a.id === artist.id)
  page.value = Math.floor(index / PAGE_SIZE) + 1

  highlightedId.value = artist.id
  setTimeout(() => { highlightedId.value = null }, HIGHLIGHT_MS)
}

onMounted(() => artistsStore.load())
</script>

<template>
  <PageContainer>
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="mb-1 text-2xl font-medium text-on-surface">Artists</h1>
        <p class="text-on-surface-variant">
          {{ total ? `${total} ${total === 1 ? 'artist' : 'artists'} in your roster` : 'The artists you work with' }}
        </p>
      </div>

      <v-btn
        v-if="!showEmpty"
        color="primary"
        prepend-icon="mdi-plus"
        :disabled="creating"
        class="self-start sm:self-auto"
        @click="creating = true"
      >
        New artist
      </v-btn>
    </header>

    <v-expand-transition>
      <div v-if="creating" class="mb-6">
        <ArtistCreatePanel @created="onCreated" @cancel="creating = false" />
      </div>
    </v-expand-transition>

    <!-- Loading -->
    <div v-if="showSkeleton" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <v-skeleton-loader v-for="n in 8" :key="n" type="image, list-item-avatar-two-line" class="rounded-lg" />
    </div>

    <!-- Error -->
    <v-alert
      v-else-if="artistsStore.error && !artistsStore.ready"
      type="error"
      variant="tonal"
      title="Could not load artists"
      text="Check your connection and try again."
    >
      <template #append>
        <v-btn variant="text" @click="artistsStore.load()">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Empty roster -->
    <ArtistsEmptyState v-else-if="showEmpty" @create="creating = true" />

    <!-- Content -->
    <template v-else-if="artistsStore.ready && total">
      <div class="mb-4 flex items-center gap-3">
        <v-text-field
          v-model="search"
          placeholder="Search by name or genre"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          class="max-w-sm"
        />
        <v-spacer />
        <v-btn-toggle v-model="view" mandatory divided density="compact" variant="outlined">
          <v-btn value="grid" icon="mdi-view-grid-outline" aria-label="Grid view" />
          <v-btn value="list" icon="mdi-view-list-outline" aria-label="List view" />
        </v-btn-toggle>
      </div>

      <div v-if="!filtered.length" class="py-16 text-center">
        <v-icon icon="mdi-account-search-outline" size="48" class="mb-3 text-on-surface-variant" />
        <p class="text-on-surface-variant">No artists match “{{ search }}”.</p>
      </div>

      <v-fade-transition v-else mode="out-in">
        <div
            v-if="view === 'grid'"
            :key="`grid-${page}`"
            class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
            <ArtistCard
                v-for="artist in pagedArtists"
                :key="artist.id"
                :artist="artist"
                :highlighted="artist.id === highlightedId"
                @edit="openEdit"
                @delete="openDelete"
            />
        </div>
        <ArtistList
            v-else
            :key="`list-${page}`"
            :artists="pagedArtists"
            :highlighted-id="highlightedId"
            @edit="openEdit"
            @delete="openDelete"
        />
      </v-fade-transition>

      <v-pagination
        v-if="pageCount > 1"
        v-model="page"
        :length="pageCount"
        :total-visible="smAndUp ? 7 : 3"
        rounded="circle"
        density="comfortable"
        class="mt-8"
      />
    </template>
    
    <ArtistEditDialog v-model="editOpen" :artist="editTarget" @updated="notify('Changes saved')" />
    <ArtistDeleteDialog v-model="deleteOpen" :artist="deleteTarget" @deleted="notify('Artist deleted')" />
    <v-snackbar v-model="snackbar" color="success" timeout="2500">{{ snackbarText }}</v-snackbar>
  </PageContainer>
</template>