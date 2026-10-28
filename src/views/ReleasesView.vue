<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import PageContainer from '@/components/PageContainer.vue'
import ReleaseCard from '@/components/releases/ReleaseCard.vue'
import ReleaseList from '@/components/releases/ReleaseList.vue'
import ReleasesEmptyState from '@/components/releases/ReleasesEmptyState.vue'
import ReleaseDeleteDialog from '@/components/releases/ReleaseDeleteDialog.vue'
import ReleaseFiltersBar from '@/components/releases/ReleaseFiltersBar.vue'
import ReleaseCreateDialog from '@/components/releases/ReleaseCreateDialog.vue'
import { useReleasesStore } from '@/stores/releases'
import { getReleasePhase } from '@/constants/release-phases'
import { pluralize } from '@/utils/format'
import { RELEASE_ROUTE_KEYS, fromReleaseRouteQuery, toReleaseRouteQuery } from '@/models/release'

const route = useRoute()
const router = useRouter()

const currentQuery = () =>
  toReleaseRouteQuery({ filters: releasesStore.filters, sort: releasesStore.sort, page: releasesStore.page.number })

// Compared in normalized form: the router may hold "PROMO" where the store has ["PROMO"]
const normalizedRouteQuery = () => toReleaseRouteQuery(fromReleaseRouteQuery(route.query))
const sameQuery = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const hasRouteState = (query) => RELEASE_ROUTE_KEYS.some((key) => key in query)

const VIEW_STORAGE_KEY = 'cadence.releases.view'

// One card a row on phones, two from tablets up: the cards are horizontal.
// Used by the skeleton too, so loading looks like what arrives
const GRID_CLASSES = 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4'

const releasesStore = useReleasesStore()
const { smAndUp, mdAndUp } = useDisplay()

const view = ref(readView())
const createOpen = ref(false)
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const phaseLoadingId = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success', to: null })

const total = computed(() => releasesStore.page.totalElements)
const showSkeleton = computed(() => releasesStore.loading && !releasesStore.ready)
const showNoResults = computed(() => releasesStore.ready && total.value === 0 && releasesStore.hasFilters)
const subtitle = computed(() => {
  if (releasesStore.hasFilters) return `${pluralize(total.value, 'release')} found`
  return total.value ? `${pluralize(total.value, 'release')} in your catalog` : 'Everything you are planning and have released'
})

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

function notify(text, color = 'success', to = null) {
  snackbar.value = { show: true, text, color, to }
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

function onReleaseCreated(release) {
  releasesStore.fetchPage(0)
  notify('Release created', 'success', { name: 'release-detail', params: { id: release.id } })
}

onMounted(() => {
  if (hasRouteState(route.query)) {
    // A shared link or a reload: the URL wins
    releasesStore.hydrate(fromReleaseRouteQuery(route.query))
  } else {
    // Plain /releases (e.g. the header link): keep the last filters and show them in the URL
    releasesStore.fetchPage()
    router.replace({ query: currentQuery() })
  }
})

// URL -> store: back/forward or a link with filters while already on the page
watch(() => route.query, (query) => {
  if (!hasRouteState(query)) return router.replace({ query: currentQuery() })
  const state = fromReleaseRouteQuery(query)
  if (!sameQuery(toReleaseRouteQuery(state), currentQuery())) releasesStore.hydrate(state)
})

// Store -> URL: replace, so filter clicks do not pile up in browser history
watch(currentQuery, (query) => {
  if (!sameQuery(query, normalizedRouteQuery())) router.replace({ query })
})
</script>

<template>
  <PageContainer>
    <header class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-2xl font-medium text-on-surface">Releases</h1>
        <div class="text-sm text-on-surface-variant">{{ subtitle }}</div>
      </div>

      <template v-if="!releasesStore.isEmpty">
        <v-btn v-if="mdAndUp" color="primary" prepend-icon="mdi-plus" @click="createOpen = true">New release</v-btn>
        <v-btn v-else color="primary" icon="mdi-plus" size="small" aria-label="New release" @click="createOpen = true" />
      </template>
    </header>

    <!-- Loading -->
    <div v-if="showSkeleton" :class="GRID_CLASSES">
      <v-skeleton-loader v-for="n in 6" :key="n" type="list-item-avatar-three-line" class="rounded-lg" />
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
      <ReleaseFiltersBar v-model:view="view" />

      <!-- No results for the current filters -->
      <div v-if="showNoResults" class="py-16 text-center">
        <v-icon icon="mdi-filter-remove-outline" size="48" class="mb-3 text-on-surface-variant" />
        <p class="mb-4 text-on-surface-variant">No releases match your filters.</p>
        <v-btn variant="tonal" @click="releasesStore.clearFilters()">Clear filters</v-btn>
      </div>

      <!-- Content: previous page stays visible, dimmed, while the next one loads -->
      <div v-else class="transition-opacity" :class="releasesStore.loading && 'pointer-events-none opacity-60'">
        <div v-if="view === 'grid'" :class="GRID_CLASSES">
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
    <ReleaseCreateDialog v-model="createOpen" @created="onReleaseCreated" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn v-if="snackbar.to" :to="snackbar.to" variant="text">Open</v-btn>
      </template>
    </v-snackbar>
  </PageContainer>
</template>