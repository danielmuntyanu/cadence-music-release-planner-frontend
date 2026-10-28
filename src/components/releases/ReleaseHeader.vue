<script setup>
import { computed, ref } from 'vue'
import ReleaseArtwork from './ReleaseArtwork.vue'
import ReleaseArtworkDialog from './ReleaseArtworkDialog.vue'
import ReleasePhaseMenu from './ReleasePhaseMenu.vue'
import ReleaseActionsMenu from './ReleaseActionsMenu.vue'
import ReleaseProgress from './ReleaseProgress.vue'
import DownloadButton from '@/components/common/DownloadButton.vue'
import ExplicitBadge from '@/components/common/ExplicitBadge.vue'
import { releaseService } from '@/services/release.service'
import { getReleaseTypeLabel } from '@/constants/release-types'
import { getGenreLabel } from '@/constants/genres'
import { ICONS } from '@/constants/icons'
import { describeReleaseDate } from '@/utils/release-date'

const props = defineProps({
  release: { type: Object, required: true },
  phaseSaving: { type: Boolean, default: false },
})

defineEmits(['change-phase', 'delete', 'updated'])

const viewerOpen = ref(false)
const artworkOpen = ref(false)
const downloadFailed = ref(false)

const date = computed(() => describeReleaseDate(props.release.releaseDate))
const genres = computed(() =>
  [props.release.primaryGenre, props.release.secondaryGenre].filter(Boolean).map(getGenreLabel).join(' · '),
)
const backdropStyle = computed(() =>
  props.release.artworkUrl ? { backgroundImage: `url("${props.release.artworkUrl}")` } : null,
)

/**
 * The cover as uploaded, for distributors. A cover set by an external link is not in our
 * storage (the server answers 404), so it opens where it lives instead.
 */
async function coverDownloadLink() {
  try {
    return await releaseService.artworkDownloadLink(props.release.id)
  } catch (e) {
    if (e.response?.status === 404 && props.release.artworkUrl) return { url: props.release.artworkUrl, external: true }
    throw e
  }
}
</script>

<template>
  <v-card border flat class="relative overflow-hidden">
    <!-- Blurred copy of the cover: gives each release page its own color -->
    <div
      class="backdrop absolute inset-0"
      :class="!release.artworkUrl && 'backdrop-fallback'"
      :style="backdropStyle"
      aria-hidden="true"
    />
    <div class="backdrop-shade absolute inset-0" aria-hidden="true" />

    <div class="relative flex flex-col gap-6 p-4 sm:flex-row sm:items-end sm:p-6 lg:p-8">
      <!-- A button cannot contain another button, so the cover and its actions are siblings -->
      <div class="relative w-full max-w-80 shrink-0 self-center sm:w-56 sm:self-auto lg:w-72">
        <!-- Square and unframed, as stores show it; the shadow only adds depth -->
        <button
          type="button"
          class="plain-button artwork block w-full overflow-hidden shadow-2xl"
          :disabled="!release.artworkUrl"
          :aria-label="release.artworkUrl ? `View ${release.name} cover` : undefined"
          @click="viewerOpen = true"
        >
          <ReleaseArtwork :src="release.artworkUrl" :name="release.name" :type="release.type" :icon-size="96" />
        </button>

        <div class="absolute bottom-2 right-2 flex gap-1">
          <v-btn
            v-if="release.artworkUrl"
            :icon="ICONS.ZOOM"
            size="small"
            class="cover-action"
            aria-label="View cover full size"
            @click="viewerOpen = true"
          />
          <DownloadButton
            v-if="release.artworkUrl"
            :get-link="coverDownloadLink"
            label="Download cover"
            size="small"
            class="cover-action"
            @error="downloadFailed = true"
          />
          <v-btn
            :icon="ICONS.REPLACE_IMAGE"
            size="small"
            class="cover-action"
            aria-label="Change cover"
            @click="artworkOpen = true"
          />
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <p class="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
          {{ getReleaseTypeLabel(release.type) }}
          <ExplicitBadge v-if="release.explicit" />
        </p>
        <h1 class="mt-1 break-words text-3xl font-semibold leading-tight text-on-surface sm:text-4xl lg:text-5xl">
          {{ release.name }}
        </h1>

        <p class="mt-2 text-lg text-on-surface">
          <template v-if="release.artists.length">
            <template v-for="(artist, index) in release.artists" :key="artist.id">
              <RouterLink
                :to="{ name: 'artist-detail', params: { id: artist.id } }"
                class="hover:underline focus-visible:underline"
              >
                {{ artist.name }}
              </RouterLink>
              <span v-if="index < release.artists.length - 1" class="text-on-surface-variant">, </span>
            </template>
          </template>
          <span v-else class="text-on-surface-variant">No artist yet</span>
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ReleasePhaseMenu
            :phase="release.phase"
            :loading="phaseSaving"
            variant="flat"
            @change="$emit('change-phase', $event)"
          />
          <span
            class="flex items-center gap-1 text-sm"
            :class="date.upcoming ? 'text-primary' : 'text-on-surface-variant'"
          >
            <v-icon :icon="date.icon" size="16" />
            {{ date.label }}
          </span>
          <span v-if="genres" class="text-sm text-on-surface-variant">{{ genres }}</span>
        </div>

        <ReleaseProgress
          class="mt-4 max-w-sm"
          :percent="release.progressPercent"
          :done="release.doneSongCount"
          :total="release.songCount"
        />
      </div>

      <div class="absolute right-2 top-2 sm:static sm:self-start">
        <ReleaseActionsMenu floating @delete="$emit('delete')" />
      </div>
    </div>

    <!-- Full-size cover -->
    <v-dialog v-model="viewerOpen" max-width="900">
      <v-card class="overflow-hidden" color="black" rounded="0">
        <img
          :src="release.artworkUrl"
          :alt="`${release.name} cover`"
          class="block h-auto max-h-[85vh] w-full object-contain"
        />
        <v-btn
          :icon="ICONS.CLOSE"
          variant="text"
          color="white"
          class="absolute right-2 top-2"
          aria-label="Close cover"
          @click="viewerOpen = false"
        />
      </v-card>
    </v-dialog>

    <ReleaseArtworkDialog v-model="artworkOpen" :release="release" @updated="$emit('updated', $event)" />
    <v-snackbar v-model="downloadFailed" color="error" timeout="3000">Could not prepare the download. Try again.</v-snackbar>
  </v-card>
</template>

<style scoped>
.backdrop {
  background-position: center;
  background-size: cover;
  filter: blur(48px) saturate(1.4);
  opacity: 0.55;
  /* Scaled so the blurred edges do not show a hard border */
  transform: scale(1.3);
}

.backdrop-fallback {
  background:
    radial-gradient(circle at 15% 30%, rgba(var(--v-theme-primary), 0.55), transparent 60%),
    radial-gradient(circle at 85% 0%, rgba(var(--v-theme-secondary), 0.4), transparent 55%);
}

/* Keeps text readable over any cover, in both themes */
.backdrop-shade {
  background: linear-gradient(to top, rgba(var(--v-theme-surface), 0.95), rgba(var(--v-theme-surface), 0.55));
}

.artwork:not(:disabled) {
  cursor: zoom-in;
  transition: transform 200ms ease;
}

.artwork:not(:disabled):hover {
  transform: scale(1.02);
}

.artwork:disabled {
  cursor: default;
}

/* Readable over any cover: a frosted surface behind each icon */
.cover-action {
  background: rgba(var(--v-theme-surface), 0.8);
  backdrop-filter: blur(8px);
}
</style>