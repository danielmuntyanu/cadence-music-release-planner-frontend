<script setup>
import { computed } from 'vue'
import ReleaseArtwork from './ReleaseArtwork.vue'
import ReleasePhaseMenu from './ReleasePhaseMenu.vue'
import ReleaseActionsMenu from './ReleaseActionsMenu.vue'
import { getReleaseTypeLabel } from '@/constants/release-types'
import { getGenreLabel } from '@/constants/genres'
import { describeReleaseDate } from '@/utils/release-date'

const props = defineProps({
  release: { type: Object, required: true },
  phaseLoading: { type: Boolean, default: false },
})

defineEmits(['change-phase', 'delete'])

const detailRoute = computed(() => ({ name: 'release-detail', params: { id: props.release.id } }))
const artistNames = computed(() => props.release.artists.map((artist) => artist.name).join(', ') || 'No artist yet')
const date = computed(() => describeReleaseDate(props.release.releaseDate))

const genres = computed(() =>
  [props.release.primaryGenre, props.release.secondaryGenre].filter(Boolean).map(getGenreLabel).join(' / '),
)
</script>

<template>
  <v-card border flat class="flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div class="relative">
      <!-- Duplicates the title link: out of the tab order, labelled for screen readers -->
      <RouterLink :to="detailRoute" class="block" tabindex="-1" :aria-label="`Open ${release.name}`">
        <ReleaseArtwork :src="release.artworkUrl" :name="release.name" :type="release.type" />
      </RouterLink>

      <div class="absolute left-2 top-2">
        <ReleasePhaseMenu
          :phase="release.phase"
          :loading="phaseLoading"
          variant="flat"
          @change="$emit('change-phase', release, $event)"
        />
      </div>
      <div class="absolute right-2 top-2">
        <ReleaseActionsMenu floating @delete="$emit('delete', release)" />
      </div>
    </div>

    <v-card-text class="flex flex-1 flex-col gap-1 p-4">
      <h3 class="truncate text-base font-medium">
        <RouterLink :to="detailRoute" class="text-on-surface hover:underline focus-visible:underline">
          {{ release.name }}
        </RouterLink>
      </h3>
      <p class="truncate text-sm text-on-surface-variant">{{ artistNames }}</p>

      <p class="mt-2 flex items-center gap-1 text-xs" :class="date.upcoming ? 'text-primary' : 'text-on-surface-variant'">
        <v-icon :icon="date.icon" size="14" />
        {{ date.label }}
      </p>
      <p class="truncate text-xs text-on-surface-variant">
        {{ getReleaseTypeLabel(release.type) }} · {{ genres }}
      </p>
    </v-card-text>

    <v-card-actions class="px-4 pb-4 pt-0">
      <v-btn :to="detailRoute" variant="tonal" color="primary" prepend-icon="mdi-pencil-outline" block>
        Overview / Edit
      </v-btn>
    </v-card-actions>
  </v-card>
</template>