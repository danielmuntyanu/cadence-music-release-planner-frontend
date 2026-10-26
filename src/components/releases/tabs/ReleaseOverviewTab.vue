<script setup>
import { computed } from 'vue'
import ArtistAvatar from '@/components/artists/ArtistAvatar.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import { getReleaseTypeLabel } from '@/constants/release-types'
import { getReleasePhase } from '@/constants/release-phases'
import { getGenreLabel } from '@/constants/genres'
import { formatIsoDate } from '@/utils/date'

const props = defineProps({
  release: { type: Object, required: true },
})

defineEmits(['updated'])

const formatInstant = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))

// `empty` rows keep the muted color: what is not filled in yet should be easy to spot
const rows = computed(() => {
  const r = props.release
  return [
    { label: 'Type', value: getReleaseTypeLabel(r.type) },
    { label: 'Phase', value: getReleasePhase(r.phase).label },
    { label: 'Release date', value: r.releaseDate ? formatIsoDate(r.releaseDate) : 'Not set', empty: !r.releaseDate },
    {
      label: 'Original release',
      value: r.originalReleaseDate ? formatIsoDate(r.originalReleaseDate) : 'Not a reissue',
      empty: !r.originalReleaseDate,
    },
    { label: 'Genres', value: [r.primaryGenre, r.secondaryGenre].filter(Boolean).map(getGenreLabel).join(' · ') },
    { label: 'Added', value: r.createdAt ? formatInstant(r.createdAt) : '—', empty: !r.createdAt },
  ]
})
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-3">
    <div class="flex flex-col gap-6 lg:col-span-2">
      <v-card border flat>
        <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Details</v-card-title>
        <div class="px-4 pb-2 sm:px-6">
          <template v-for="(row, index) in rows" :key="row.label">
            <v-divider v-if="index > 0" />
            <div class="spec-row flex items-baseline justify-between gap-4 py-3">
              <span class="text-sm text-on-surface-variant">{{ row.label }}</span>
              <span class="text-end" :class="row.empty ? 'text-on-surface-variant' : 'font-medium text-primary'">
                {{ row.value }}
              </span>
            </div>
          </template>
        </div>
      </v-card>

      <v-card border flat>
        <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Notes</v-card-title>
        <v-card-text class="px-4 pb-4 sm:px-6">
          <ExpandableText :text="release.notes" :lines="4" placeholder="No notes yet." class="text-on-surface" />
        </v-card-text>
      </v-card>
    </div>

    <v-card border flat>
      <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Artists</v-card-title>
      <v-list v-if="release.artists.length" density="comfortable" class="pb-2">
        <v-list-item
          v-for="(artist, index) in release.artists"
          :key="artist.id"
          :to="{ name: 'artist-detail', params: { id: artist.id } }"
          class="px-4 sm:px-6"
        >
          <template #prepend>
            <ArtistAvatar :name="artist.name" :src="artist.avatarUrl" :size="36" class="me-3" />
          </template>
          <v-list-item-title>{{ artist.name }}</v-list-item-title>
          <v-list-item-subtitle v-if="index === 0">Primary artist</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-card-text v-else class="px-4 pb-4 text-on-surface-variant sm:px-6">No artist yet.</v-card-text>
    </v-card>
  </div>
</template>