<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { usePlayerStore } from '@/stores/player'
import { ICONS } from '@/constants/icons'
import { formatDuration } from '@/utils/song-format'

const player = usePlayerStore()
const audio = ref(null)

// Phones keep the essentials next to the title; repeat and the clock need a wider screen
const { smAndUp } = useDisplay()

onMounted(() => player.attach(audio.value))
onBeforeUnmount(() => player.detach())

// While the thumb is dragged it follows the pointer, not the playback
const dragValue = ref(null)
const position = computed(() => dragValue.value ?? player.currentTime)
const clock = (seconds) => formatDuration(Math.floor(seconds || 0))

/** Keyboard changes seek right away; pointer drags seek when released */
function onSlide(value) {
  if (dragValue.value === null) player.seek(value)
  else dragValue.value = value
}

function onSlideEnd(value) {
  player.seek(value)
  dragValue.value = null
}
</script>

<template>
  <!-- Always in the DOM: playback continues across pages and while the bar is closed and reopened -->
  <audio ref="audio" preload="metadata" class="hidden" />

  <v-footer v-if="player.isActive" app elevation="8" class="player-bar flex-col items-stretch">
    <v-slider
      :model-value="position"
      :max="player.duration || 1"
      :disabled="!player.duration"
      step="0.1"
      color="primary"
      track-size="3"
      thumb-size="12"
      hide-details
      class="player-seek w-full"
      aria-label="Playback position"
      @start="dragValue = $event"
      @update:model-value="onSlide"
      @end="onSlideEnd"
    />

    <div class="player-row w-full px-3 pb-2 sm:px-4">
      <!-- Now playing -->
      <div class="flex min-w-0 items-center gap-3">
        <RouterLink
          :to="{ name: 'release-tracklist', params: { id: player.track.releaseId } }"
          class="h-11 w-11 shrink-0 overflow-hidden"
          :aria-label="`Open the tracklist of ${player.track.title}`"
        >
          <img v-if="player.track.artworkUrl" :src="player.track.artworkUrl" alt="" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-surface-variant">
            <v-icon :icon="ICONS.AUDIO" size="20" class="text-on-surface-variant" />
          </div>
        </RouterLink>

        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-on-surface">{{ player.track.title }}</p>
          <p class="truncate text-xs" :class="player.error ? 'text-error' : 'text-on-surface-variant'" role="status">
            {{ player.error || player.track.subtitle }}
          </p>
        </div>
      </div>

      <!-- Controls: centred on wide screens, next to the title on phones -->
      <div class="flex items-center gap-1">
        <v-btn
          v-if="smAndUp"
          :icon="ICONS.REPEAT_ONE"
          :color="player.repeat ? 'primary' : undefined"
          :class="!player.repeat && 'opacity-60'"
          :aria-pressed="player.repeat"
          aria-label="Repeat this track"
          variant="text"
          size="small"
          @click="player.toggleRepeat()"
        />
        <v-btn
          :icon="ICONS.PREVIOUS"
          aria-label="Previous track or restart"
          variant="text"
          size="small"
          @click="player.previous()"
        />
        <v-btn
          :icon="player.playing ? ICONS.PAUSE : ICONS.PLAY"
          :loading="player.playing && player.buffering"
          :aria-label="player.playing ? 'Pause' : 'Play'"
          color="primary"
          variant="flat"
          size="small"
          @click="player.toggle()"
        />
        <v-btn
          :icon="ICONS.NEXT"
          :disabled="!player.hasNext"
          aria-label="Next track"
          variant="text"
          size="small"
          @click="player.next()"
        />
      </div>

      <!-- Clock and close -->
      <div class="flex items-center justify-end gap-2">
        <span v-if="smAndUp" class="text-xs tabular-nums text-on-surface-variant">
          {{ clock(position) }} / {{ clock(player.duration) }}
        </span>
        <v-btn :icon="ICONS.CLOSE" variant="text" size="small" aria-label="Close player" @click="player.stop()" />
      </div>
    </div>
  </v-footer>
</template>

<style scoped>
.player-bar {
  padding: 0;
}

/* The seek bar runs along the top edge of the player, like in music apps */
.player-seek {
  margin: -6px 0 0;
}

/* Phones: title | controls | close */
.player-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  column-gap: 0.25rem;
}

/* Wider screens: equal side columns keep the controls exactly in the middle */
@media (min-width: 600px) {
  .player-row {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    column-gap: 1rem;
  }
}
</style>