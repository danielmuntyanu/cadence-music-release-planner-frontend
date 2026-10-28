<script setup>
import { computed } from 'vue'
import ReleaseArtwork from './ReleaseArtwork.vue'
import ReleasePhaseMenu from './ReleasePhaseMenu.vue'
import ReleaseActionsMenu from './ReleaseActionsMenu.vue'
import ReleaseProgress from './ReleaseProgress.vue'
import ExplicitBadge from '@/components/common/ExplicitBadge.vue'
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
  <v-card border flat class="release-card relative flex h-full overflow-hidden transition duration-200 hover:shadow-lg md:min-h-52">
    <!-- The cover runs the full height of the card; taller text crops it instead of leaving a gap -->
    <div class="w-28 shrink-0 self-stretch md:w-52">
      <ReleaseArtwork :src="release.artworkUrl" :name="release.name" :type="release.type" class="h-full" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-1 py-3 pe-2 ps-3 md:py-4 md:ps-4">
      <!-- Above the card link (z-[1]): these stay clickable on their own -->
      <div class="flex items-center justify-between gap-2">
        <div class="relative z-1">
          <ReleasePhaseMenu
            :phase="release.phase"
            :loading="phaseLoading"
            variant="flat"
            @change="$emit('change-phase', release, $event)"
          />
        </div>
        <div class="relative z-1 -my-1">
          <ReleaseActionsMenu :edit-to="detailRoute" @delete="$emit('delete', release)" />
        </div>
      </div>

      <h3 class="mt-1 flex min-w-0 items-center gap-2 text-base font-medium leading-snug">
        <!-- Its ::after covers the whole card, so the card opens the release wherever it is clicked -->
        <RouterLink :to="detailRoute" class="card-link truncate text-on-surface">{{ release.name }}</RouterLink>
        <ExplicitBadge v-if="release.explicit" />
      </h3>
      <div class="truncate text-sm text-on-surface-variant">{{ artistNames }}</div>

      <div class="flex min-w-0 items-center gap-1 text-xs" :class="date.upcoming ? 'text-primary' : 'text-on-surface-variant'">
        <v-icon :icon="date.icon" size="14" class="shrink-0" />
        <span class="truncate">{{ date.label }}</span>
      </div>
      <div class="truncate text-xs text-on-surface-variant">
        {{ getReleaseTypeLabel(release.type) }} · {{ genres }}
      </div>

      <!-- mt-auto: progress bars line up at the bottom across cards of different heights -->
      <ReleaseProgress
        class="mt-auto pe-2 pt-2"
        :percent="release.progressPercent"
        :done="release.doneSongCount"
        :total="release.songCount"
      />
    </div>
  </v-card>
</template>

<style scoped>
/* The title link stretches over the card: one link, valid HTML, buttons inside still work */
.card-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.release-card:hover .card-link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.card-link:focus-visible {
  outline: none;
}

/* The focus ring goes around the whole card, since the whole card is the link */
.card-link:focus-visible::after {
  border-radius: inherit;
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
</style>