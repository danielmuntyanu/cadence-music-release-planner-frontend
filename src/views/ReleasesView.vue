<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import PageContainer from '@/components/PageContainer.vue'
import ReleaseCard from '@/components/releases/ReleaseCard.vue'
import ReleaseList from '@/components/releases/ReleaseList.vue'
import ReleasesEmptyState from '@/components/releases/ReleasesEmptyState.vue'
import ReleaseDeleteDialog from '@/components/releases/ReleaseDeleteDialog.vue'
import { useReleasesStore } from '@/stores/releases'
import { getReleasePhase } from '@/constants/release-phases'
import { pluralize } from '@/utils/format'

const VIEW_STORAGE_KEY = 'cadence.releases.view'

const releasesStore = useReleasesStore()
const { smAndUp } = useDisplay()

const view = ref(readView())
const createOpen = ref(false)
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const phaseLoadingId = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const total = computed(() => releasesStore.page.totalElements)
const showSkeleton = computed(() => releasesStore.loading && !releasesStore.ready)
const showNoResults = computed(() => releasesStore.ready && total.value === 0 && releasesStore.hasFilters)

// v-pagination is 1-based, Spring pages are 0-based
const currentPage = computed({
  get: () => releasesStore.page.number + 1,
  set: (value) => releasesStore.setPage(value - 1),
})

watch(() => releasesStore.page.number, () => window.scrollTo({ top: 0, behavior: 'smooth' }))
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

function notify(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

function openDelete(release) {
  deleteTarget.value = release
  deleteOpen.value = true
}

async function onChangePhase(release, phase) {
  phaseLoadingId.value = release.id
  try {
    await releasesStore.updatePhase(release.id, phase)
    notify(`Moved to ${getReleasePhase(phase).label}`)
  } catch (e) {
    console.error('### releases/updatePhase failed:\n', e)
    notify('Could not change the phase. Try again.', 'error')
  } finally {
    phaseLoadingId.value = null
  }
}

onMounted(() => releasesStore.fetchPage())
</script>

<template>
  <PageContainer>
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="mb-1 text-2xl font-medium text-on-surface">Releases</h1>
        <p class="text-on-surface-variant">
          {{ total ? `${pluralize(total, 'release')} in your catalog` : 'Everything you are planning and have released' }}
        </p>
      </div>

      <v-btn
        v-if="!releasesStore.isEmpty"
        color="primary"
        prepend-icon="mdi-plus"
        class="self-start sm:self-auto"
        @click="createOpen = true"
      >
        New release
      </v-btn>
    </header>

    <!-- Loading -->
    <div v-if="showSkeleton" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      <v-skeleton-loader v-for="n in 8" :key="n" type="image, list-item-two-line" class="rounded-lg" />
    </div>

    <!-- Error -->
    <v-alert
      v-else-if="releasesStore.error && !releasesStore.ready"
      type="error"
      variant="tonal"
      title="Could not load releases"
      text="Check your connection and try again."
    >
      <template #append>
        <v-btn variant="text" @click="releasesStore.fetchPage()">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Empty catalog -->
    <ReleasesEmptyState v-else-if="releasesStore.isEmpty" @create="createOpen = true" />

    <template v-else-if="releasesStore.ready">
      <!-- Filters (CD-80) go on the left of this toolbar -->
      <div class="mb-4 flex items-center gap-3">
        <v-spacer />
        <v-btn-toggle v-model="view" mandatory divided density="compact" variant="outlined">
          <v-btn value="grid" icon="mdi-view-grid-outline" aria-label="Grid view" />
          <v-btn value="list" icon="mdi-view-list-outline" aria-label="List view" />
        </v-btn-toggle>
      </div>

      <!-- No results for the current filters -->
      <div v-if="showNoResults" class="py-16 text-center">
        <v-icon icon="mdi-filter-remove-outline" size="48" class="mb-3 text-on-surface-variant" />
        <p class="mb-4 text-on-surface-variant">No releases match your filters.</p>
        <v-btn variant="tonal" @click="releasesStore.clearFilters()">Clear filters</v-btn>
      </div>

      <!-- Content: previous page stays visible, dimmed, while the next one loads -->
      <div v-else class="transition-opacity" :class="releasesStore.loading && 'pointer-events-none opacity-60'">
        <div v-if="view === 'grid'" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <ReleaseCard
            v-for="release in releasesStore.releases"
            :key="release.id"
            :release="release"
            :phase-loading="release.id === phaseLoadingId"
            @change-phase="onChangePhase"
            @delete="openDelete"
          />
        </div>
        <ReleaseList
          v-else
          :releases="releasesStore.releases"
          :phase-loading-id="phaseLoadingId"
          @change-phase="onChangePhase"
          @delete="openDelete"
        />

        <v-pagination
          v-if="releasesStore.page.totalPages > 1"
          v-model="currentPage"
          :length="releasesStore.page.totalPages"
          :total-visible="smAndUp ? 7 : 3"
          rounded="circle"
          density="comfortable"
          class="mt-8"
        />
      </div>
    </template>

    <ReleaseDeleteDialog v-model="deleteOpen" :release="deleteTarget" @deleted="notify('Release deleted')" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">{{ snackbar.text }}</v-snackbar>
  </PageContainer>
</template>