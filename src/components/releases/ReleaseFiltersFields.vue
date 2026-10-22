<script setup>
import { computed, onMounted } from 'vue'
import { GENRES } from '@/constants/genres'
import { RELEASE_TYPES } from '@/constants/release-types'
import { useReleasesStore } from '@/stores/releases'
import { useArtistsStore } from '@/stores/artists'

const releasesStore = useReleasesStore()
const artistsStore = useArtistsStore()

const artistItems = computed(() => artistsStore.artists.map((artist) => ({ title: artist.name, value: artist.id })))

onMounted(() => artistsStore.load())
</script>

<template>
  <div class="flex flex-col gap-4">
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