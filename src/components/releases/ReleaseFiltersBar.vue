<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import ReleaseFiltersFields from './ReleaseFiltersFields.vue'
import { RELEASE_PHASES } from '@/constants/release-phases'
import { RELEASE_SORTS } from '@/constants/release-sorts'
import { useReleasesStore } from '@/stores/releases'

const SEARCH_DEBOUNCE_MS = 300

const view = defineModel('view', { type: String, default: 'grid' })

const releasesStore = useReleasesStore()
// Wide screens: one toolbar row. Narrow ones: search and a filters button, the rest in a sheet
const { mdAndUp } = useDisplay()

const search = ref(releasesStore.filters.q)
const moreOpen = ref(false)

const moreCount = computed(() => {
  const f = releasesStore.filters
  return f.type.length + f.genre.length + (f.artistId != null ? 1 : 0)
})

// Debounced: one request after the user pauses typing, not one per keystroke
let searchTimer = null
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const q = value ?? ''
    if (q.trim() !== releasesStore.filters.q.trim()) releasesStore.setFilters({ q })
  }, SEARCH_DEBOUNCE_MS)
})

// "Clear" or a URL change updates the query from outside: mirror it into the field
watch(() => releasesStore.filters.q, (q) => {
  if (q !== search.value) search.value = q
})

onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="mb-4 flex flex-col gap-2">
    <!-- Toolbar -->
    <div class="flex items-center gap-2">
      <v-text-field
        v-model="search"
        placeholder="Search releases"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        clearable
        class="min-w-0 flex-1 md:max-w-sm"
      />

      <v-select
        v-if="mdAndUp"
        :model-value="releasesStore.sort"
        :items="RELEASE_SORTS"
        item-title="label"
        item-value="value"
        prepend-inner-icon="mdi-sort"
        density="compact"
        hide-details
        aria-label="Sort releases"
        class="w-56 shrink-0 grow-0"
        @update:model-value="releasesStore.setSort"
      />

      <!-- Height 40: the same as the compact fields next to it -->
      <v-badge :content="moreCount" :model-value="moreCount > 0" color="primary">
        <v-btn v-if="mdAndUp" variant="tonal" prepend-icon="mdi-tune-variant" height="40" @click="moreOpen = true">
          Filters
          <v-menu v-model="moreOpen" activator="parent" location="bottom end" :close-on-content-click="false">
            <v-card min-width="340" class="p-4">
              <ReleaseFiltersFields />
            </v-card>
          </v-menu>
        </v-btn>
        <v-btn
          v-else
          icon="mdi-tune-variant"
          variant="tonal"
          rounded="lg"
          size="40"
          aria-label="Filters and sorting"
          @click="moreOpen = true"
        />
      </v-badge>

      <v-spacer v-if="mdAndUp" />
      <v-btn-toggle v-model="view" mandatory divided density="compact" variant="outlined">
        <v-btn value="grid" icon="mdi-view-grid-outline" aria-label="Grid view" />
        <v-btn value="list" icon="mdi-view-list-outline" aria-label="List view" />
      </v-btn-toggle>
    </div>

    <!-- Phases: one row, scrolls sideways on narrow screens instead of wrapping -->
    <div class="flex items-center gap-2">
      <div class="min-w-0 flex-1 overflow-x-auto">
        <v-chip-group
          :model-value="releasesStore.filters.phase"
          multiple
          filter
          class="flex-nowrap py-0"
          aria-label="Filter by phase"
          @update:model-value="(phase) => releasesStore.setFilters({ phase })"
        >
          <v-chip
            v-for="phase in RELEASE_PHASES"
            :key="phase.value"
            :value="phase.value"
            :color="phase.color"
            size="small"
            variant="outlined"
          >
            {{ phase.label }}
          </v-chip>
        </v-chip-group>
      </div>

      <v-btn v-if="releasesStore.hasFilters" variant="text" size="small" @click="releasesStore.clearFilters()">Clear</v-btn>
    </div>

    <v-bottom-sheet v-if="!mdAndUp" v-model="moreOpen">
      <v-card class="p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-medium text-on-surface">Filters and sorting</h2>
          <v-btn variant="text" @click="moreOpen = false">Done</v-btn>
        </div>
        <ReleaseFiltersFields with-sort />
      </v-card>
    </v-bottom-sheet>
  </div>
</template>