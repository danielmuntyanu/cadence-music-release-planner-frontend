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
  <div class="mb-4 flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-3">
      <v-text-field
        v-model="search"
        placeholder="Search releases"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        clearable
        class="min-w-48 flex-1 sm:max-w-sm"
      />

      <v-select
        :model-value="releasesStore.sort"
        :items="RELEASE_SORTS"
        item-title="label"
        item-value="value"
        prepend-inner-icon="mdi-sort"
        density="compact"
        hide-details
        aria-label="Sort releases"
        class="w-full shrink-0 sm:w-56"
        @update:model-value="releasesStore.setSort"
      />

      <v-spacer class="hidden sm:block" />

      <v-btn-toggle v-model="view" mandatory divided density="compact" variant="outlined">
        <v-btn value="grid" icon="mdi-view-grid-outline" aria-label="Grid view" />
        <v-btn value="list" icon="mdi-view-list-outline" aria-label="List view" />
      </v-btn-toggle>
    </div>

    <div class="flex items-center gap-2">
      <!-- Scrolls horizontally on narrow screens instead of wrapping -->
      <div class="min-w-0 flex-1 overflow-x-auto">
        <v-chip-group
          :model-value="releasesStore.filters.phase"
          multiple
          filter
          class="flex-nowrap"
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

      <v-badge :content="moreCount" :model-value="moreCount > 0" color="primary">
        <v-btn variant="tonal" prepend-icon="mdi-tune-variant" @click="moreOpen = true">
          Filters
          <v-menu
            v-if="mdAndUp"
            v-model="moreOpen"
            activator="parent"
            location="bottom end"
            :close-on-content-click="false"
          >
            <v-card min-width="340" class="p-4">
              <ReleaseFiltersFields />
            </v-card>
          </v-menu>
        </v-btn>
      </v-badge>

      <v-btn v-if="releasesStore.hasFilters" variant="text" @click="releasesStore.clearFilters()">Clear</v-btn>
    </div>

    <v-bottom-sheet v-if="!mdAndUp" v-model="moreOpen">
      <v-card class="p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-medium text-on-surface">Filters</h2>
          <v-btn variant="text" @click="moreOpen = false">Done</v-btn>
        </div>
        <ReleaseFiltersFields />
      </v-card>
    </v-bottom-sheet>
  </div>
</template>