<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { VueDraggable } from 'vue-draggable-plus'
import SongStatusMenu from '@/components/songs/SongStatusMenu.vue'
import SongDeleteDialog from '@/components/songs/SongDeleteDialog.vue'
import SongDialog from '@/components/songs/SongDialog.vue'
import { songService } from '@/services/song.service'
import { SONG_STATUSES, getSongStatus } from '@/constants/song-statuses'
import { formatDuration } from '@/utils/song-format'
import { pluralize } from '@/utils/format'

const props = defineProps({
  release: { type: Object, required: true },
})

defineEmits(['updated'])

// The length column and the table header only exist from the "sm" breakpoint up
const { smAndUp } = useDisplay()

const songs = ref([])
const loading = ref(false)
const failed = ref(false)
const reordering = ref(false)
const statusSavingId = ref(null)
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const songDialogOpen = ref(false)
const dialogSong = ref(null)
const dialogStartInEdit = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

// ---------- Summary ----------

const totalSeconds = computed(() => songs.value.reduce((sum, song) => sum + (song.durationSeconds ?? 0), 0))
const summary = computed(() => {
  const count = pluralize(songs.value.length, 'song')
  return totalSeconds.value ? `${count} · ${formatDuration(totalSeconds.value)}` : count
})
const explicitCount = computed(() => songs.value.filter((song) => song.explicit).length)
const withoutLength = computed(() => songs.value.filter((song) => song.durationSeconds == null).length)
const statusCounts = computed(() =>
  SONG_STATUSES.map((status) => ({
    ...status,
    count: songs.value.filter((song) => song.status === status.value).length,
  })),
)

function notify(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

// ---------- Loading ----------

let latestRequest = 0

async function load() {
  const requestId = ++latestRequest
  loading.value = true
  failed.value = false
  try {
    const data = await songService.getAll(props.release.id)
    if (requestId === latestRequest) songs.value = data
  } catch (e) {
    if (requestId !== latestRequest) return
    failed.value = true
    console.error('### songs/getAll failed:\n', e)
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

watch(() => props.release.id, load, { immediate: true })

// ---------- Song dialog ----------

/** Opens the read view of a song, or its form when `edit` is true; no song means a new one */
function openSong(song = null, edit = false) {
  dialogSong.value = song
  dialogStartInEdit.value = edit
  songDialogOpen.value = true
}

function onSaved(saved, { created }) {
  if (created) {
    songs.value = [...songs.value, saved]
    notify(`“${saved.title}” added`)
  } else {
    songs.value = songs.value.map((song) => (song.id === saved.id ? saved : song))
    notify('Song saved')
  }
}

// ---------- Reordering ----------

const sameOrder = (a, b) => a.length === b.length && a.every((song, index) => song.id === b[index].id)

/** The new order is already on screen; the server confirms it or the page recovers */
async function saveOrder(previous) {
  reordering.value = true
  try {
    songs.value = await songService.reorder(props.release.id, songs.value.map((song) => song.id))
  } catch (e) {
    if (e.response?.status === 400) {
      // Another tab added or removed a song: the local list is stale
      notify('The tracklist changed elsewhere. Showing the latest version.', 'warning')
      await load()
    } else {
      songs.value = previous
      console.error('### songs/reorder failed:\n', e)
      notify('Could not save the new order. Try again.', 'error')
    }
  } finally {
    reordering.value = false
  }
}

let orderBeforeDrag = []

function onDragStart() {
  orderBeforeDrag = [...songs.value]
}

function onDragEnd() {
  if (!sameOrder(orderBeforeDrag, songs.value)) saveOrder(orderBeforeDrag)
}

/** Keyboard and small-screen alternative to dragging */
function move(index, offset) {
  const previous = [...songs.value]
  const next = [...songs.value]
  const target = index + offset
  ;[next[index], next[target]] = [next[target], next[index]]
  songs.value = next
  saveOrder(previous)
}

// ---------- Status and delete ----------

async function onChangeStatus(song, status) {
  statusSavingId.value = song.id
  try {
    const updated = await songService.updateStatus(props.release.id, song.id, status)
    songs.value = songs.value.map((s) => (s.id === updated.id ? updated : s))
    notify(`“${song.title}” moved to ${getSongStatus(status).label}`)
  } catch (e) {
    console.error('### songs/updateStatus failed:\n', e)
    notify('Could not change the status. Try again.', 'error')
  } finally {
    statusSavingId.value = null
  }
}

function openDelete(song) {
  deleteTarget.value = song
  deleteOpen.value = true
}

function onDeleted(song) {
  songs.value = songs.value.filter((s) => s.id !== song.id)
  notify('Song deleted')
}
</script>

<template>
  <!-- Loading -->
  <v-card v-if="loading && !songs.length" border flat class="p-2">
    <v-skeleton-loader v-for="n in 4" :key="n" type="list-item-two-line" />
  </v-card>

  <!-- Error -->
  <v-alert
    v-else-if="failed"
    type="error"
    variant="tonal"
    title="Could not load the tracklist"
    text="Check your connection and try again."
  >
    <template #append>
      <v-btn variant="text" @click="load">Retry</v-btn>
    </template>
  </v-alert>

  <!-- Empty -->
  <v-card v-else-if="!songs.length" border flat class="px-6 py-16 text-center">
    <v-icon icon="mdi-playlist-music" size="48" class="mb-3 text-on-surface-variant" />
    <h2 class="mb-2 text-lg font-medium text-on-surface">No tracks yet</h2>
    <p class="mb-6 text-on-surface-variant">Tracks you add to {{ release.name }} will appear here.</p>
    <v-btn color="primary" prepend-icon="mdi-plus" @click="openSong()">Add song</v-btn>
  </v-card>

  <!-- Tracklist and summary -->
  <div v-else class="grid items-start gap-6 lg:grid-cols-3">
    <v-card border flat class="lg:col-span-2">
      <div class="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <h2 class="text-base font-medium text-on-surface">Tracklist</h2>
        <!-- The summary card shows this on wide screens -->
        <span class="text-sm text-on-surface-variant lg:hidden">{{ summary }}</span>
        <v-spacer />
        <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="openSong()">Add song</v-btn>
      </div>

      <div
        v-if="smAndUp"
        class="song-grid tracklist-head mt-3 px-4 pb-2 text-xs uppercase tracking-wider text-on-surface-variant"
      >
        <span />
        <span class="text-end">#</span>
        <span>Title</span>
        <span>Status</span>
        <v-icon icon="mdi-clock-outline" size="14" class="justify-self-end" aria-label="Length" />
        <span />
      </div>

      <VueDraggable
        v-model="songs"
        :animation="180"
        :disabled="reordering"
        handle=".drag-handle"
        ghost-class="drag-ghost"
        class="pb-2"
        :class="!smAndUp && 'pt-2'"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <div
          v-for="(song, index) in songs"
          :key="song.id"
          class="song-row song-grid px-2 py-2 sm:px-4"
        >
          <v-btn
            class="drag-handle"
            icon="mdi-drag-vertical"
            variant="text"
            :size="smAndUp ? 'small' : 'x-small'"
            density="comfortable"
            :ripple="false"
            :disabled="reordering"
            :aria-label="`Drag to reorder ${song.title}`"
          />

          <!-- Position in the list, so the number is right while dragging, before the server answers -->
          <span class="text-sm tabular-nums text-on-surface-variant sm:text-end">{{ index + 1 }}</span>

          <!-- min-w-0 lets a long title shrink and truncate instead of pushing the status out -->
          <button
            type="button"
            class="plain-button song-open min-w-0 rounded text-start"
            :aria-label="`Open ${song.title}`"
            @click="openSong(song)"
          >
            <span class="song-title flex min-w-0 items-center gap-2 font-medium text-on-surface">
              <span class="truncate">{{ song.title }}</span>
              <span v-if="song.explicit" class="explicit-badge shrink-0" title="Explicit lyrics" aria-label="Explicit">E</span>
            </span>
          </button>

          <div>
            <SongStatusMenu
              :status="song.status"
              :loading="song.id === statusSavingId"
              @change="onChangeStatus(song, $event)"
            />
          </div>

          <span v-if="smAndUp" class="text-end text-sm tabular-nums text-on-surface-variant">
            {{ song.durationSeconds ? formatDuration(song.durationSeconds) : '—' }}
          </span>

          <v-menu location="bottom end">
            <template #activator="{ props: activator }">
              <v-btn
                v-bind="activator"
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                :aria-label="`Actions for ${song.title}`"
              />
            </template>
            <v-list density="compact" min-width="170">
              <v-list-item prepend-icon="mdi-pencil-outline" title="Edit" @click="openSong(song, true)" />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-arrow-up"
                title="Move up"
                :disabled="index === 0 || reordering"
                @click="move(index, -1)"
              />
              <v-list-item
                prepend-icon="mdi-arrow-down"
                title="Move down"
                :disabled="index === songs.length - 1 || reordering"
                @click="move(index, 1)"
              />
              <v-divider />
              <v-list-item prepend-icon="mdi-delete-outline" title="Delete" base-color="error" @click="openDelete(song)" />
            </v-list>
          </v-menu>
        </div>
      </VueDraggable>
    </v-card>

    <v-card border flat>
      <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Summary</v-card-title>
      <div class="px-4 pb-4 sm:px-6">
        <div class="stat-row">
          <span class="text-sm text-on-surface-variant">Songs</span>
          <span class="font-medium text-primary">{{ songs.length }}</span>
        </div>
        <div class="stat-row">
          <span class="text-sm text-on-surface-variant">Total length</span>
          <span class="text-end">
            <span class="font-medium text-primary">{{ totalSeconds ? formatDuration(totalSeconds) : '—' }}</span>
            <span v-if="withoutLength" class="block text-xs text-on-surface-variant">{{ withoutLength }} without length</span>
          </span>
        </div>
        <div class="stat-row">
          <span class="text-sm text-on-surface-variant">Explicit</span>
          <span class="font-medium" :class="explicitCount ? 'text-primary' : 'text-on-surface-variant'">
            {{ explicitCount }}
          </span>
        </div>

        <p class="mb-2 mt-5 text-xs uppercase tracking-wider text-on-surface-variant">By status</p>
        <div v-for="status in statusCounts" :key="status.value" class="flex items-center justify-between py-1">
          <span class="flex items-center gap-2 text-sm text-on-surface">
            <v-icon :icon="status.icon" :color="status.color" size="16" />
            {{ status.label }}
          </span>
          <span class="text-sm tabular-nums" :class="status.count ? 'font-medium text-on-surface' : 'text-on-surface-variant'">
            {{ status.count }}
          </span>
        </div>
      </div>
    </v-card>
  </div>

  <SongDialog
    v-model="songDialogOpen"
    :release-id="release.id"
    :song="dialogSong"
    :start-in-edit="dialogStartInEdit"
    @saved="onSaved"
    @delete="openDelete"
  />
  <SongDeleteDialog v-model="deleteOpen" :release-id="release.id" :song="deleteTarget" @deleted="onDeleted" />
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">{{ snackbar.text }}</v-snackbar>
</template>

<style scoped>
/* Phones: handle | # | title | status | menu. Tight first columns leave room for the title */
.song-grid {
  display: grid;
  grid-template-columns: 1.5rem 1.25rem minmax(0, 1fr) auto 2.25rem;
  align-items: center;
  column-gap: 0.375rem;
}

/* Wider screens (Vuetify "sm" and up): fixed status column so chips line up, plus length.
   Must stay below the base rule: equal specificity, so the later rule wins */
@media (min-width: 600px) {
  .song-grid {
    grid-template-columns: 2rem 1.5rem minmax(0, 1fr) 9.5rem 3rem 2.5rem;
    column-gap: 0.75rem;
  }
}

/* on-surface with explicit alpha: visible in both themes, unlike the theme border opacity */
.song-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: background-color 150ms ease;
}

.song-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.tracklist-head {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* The header already draws a line above the first row */
.tracklist-head + * .song-row:first-child {
  border-top: none;
}

.song-open:hover .song-title > .truncate {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.song-open:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* The placeholder left where the dragged row will land */
.drag-ghost {
  opacity: 0.4;
  background: rgba(var(--v-theme-primary), 0.08);
}

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.explicit-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: rgb(var(--v-theme-surface));
  background: rgb(var(--v-theme-on-surface-variant));
}
</style>