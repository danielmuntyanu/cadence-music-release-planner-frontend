<script setup>
import { computed, onMounted } from 'vue'
import { GENRES } from '@/constants/genres'
import { RELEASE_TYPES } from '@/constants/release-types'
import { RELEASE_SORTS } from '@/constants/release-sorts'
import { useReleasesStore } from '@/stores/releases'
import { useArtistsStore } from '@/stores/artists'

defineProps({
  // Narrow screens have no room for the sort next to the search, so it moves in here
  withSort: { type: Boolean, default: false },
})

const releasesStore = useReleasesStore()
const artistsStore = useArtistsStore()

const artistItems = computed(() => artistsStore.artists.map((artist) => ({ title: artist.name, value: artist.id })))

onMounted(() => artistsStore.load())
</script>

<template>
  <div class="flex flex-col gap-4">
    <v-select
      v-if="withSort"
      :model-value="releasesStore.sort"
      :items="RELEASE_SORTS"
      item-title="label"
      item-value="value"
      label="Sort by"
      prepend-inner-icon="mdi-sort"
      hide-details
      @update:model-value="releasesStore.setSort"
    />

    <v-select
      :model-value="releasesStore.filters.type"
      :items="RELEASE_TYPES"
      item-title="label"
      item-value="value"
      label="Type"
      multiple
      chips
      closable-chips
      clearable
      hide-details
      @update:model-value="(type) => releasesStore.setFilters({ type: type ?? [] })"
    />

    <v-autocomplete
      :model-value="releasesStore.filters.genre"
      :items="GENRES"
      item-title="label"
      item-value="value"
      label="Genre"
      multiple
      chips
      closable-chips
      clearable
      hide-details
      @update:model-value="(genre) => releasesStore.setFilters({ genre: genre ?? [] })"
    />

    <v-autocomplete
      :model-value="releasesStore.filters.artistId"
      :items="artistItems"
      :loading="artistsStore.loading"
      label="Artist"
      no-data-text="No artists yet"
      clearable
      hide-details
      @update:model-value="(artistId) => releasesStore.setFilters({ artistId: artistId ?? null })"
    />
  </div>
</template>