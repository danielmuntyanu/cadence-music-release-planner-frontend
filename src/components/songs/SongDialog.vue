<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import CopyButton from '@/components/common/CopyButton.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import SongFilesSection from '@/components/songs/SongFilesSection.vue'
import SongStatusMenu from '@/components/songs/SongStatusMenu.vue'
import { SONG_STATUSES } from '@/constants/song-statuses'
import { ICONS } from '@/constants/icons'
import { songService } from '@/services/song.service'
import { useSubmit } from '@/composables/useSubmit'
import { createSongForm, toSongRequest } from '@/models/song'
import { formatDuration, formatIsrc, parseDuration } from '@/utils/song-format'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  releaseId: { type: Number, required: true },
  // The release the song belongs to: the player shows its name and cover
  release: { type: Object, default: null },
  // null: a new song
  song: { type: Object, default: null },
  // Opened from "Edit" in the row menu: skip the read view
  startInEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['saved', 'delete', 'files-changed'])

const mode = ref('view')
const form = ref(createSongForm())
const formRef = ref(null)
const titleField = ref(null)
const lyricsField = ref(null)
// The lyrics field takes over a nearly full-screen dialog; the other fields stay mounted, only hidden
const lyricsExpanded = ref(false)
const statusSaving = ref(false)
const statusError = ref(null)

const isNew = computed(() => !props.song)
const heading = computed(() => {
  if (mode.value === 'view') return props.song?.title
  if (lyricsExpanded.value) return form.value.title.trim() || 'Lyrics'
  return isNew.value ? 'Add song' : 'Edit song'
})

const { loading, error, submit } = useSubmit({
  errorMessages: { 404: 'This song no longer exists. Close the dialog and reload the tracklist.' },
})

const ISRC_PATTERN = /^[A-Za-z]{2}-?[A-Za-z0-9]{3}-?\d{2}-?\d{5}$/

const rules = {
  title: [(v) => !!v?.trim() || 'Title is required', (v) => v.length <= 150 || 'Max 150 characters'],
  duration: [
    (v) => parseDuration(v) !== undefined || 'Use m:ss, like 3:35',
    (v) => (parseDuration(v) ?? 1) >= 1 || 'Must be at least 1 second',
    (v) => (parseDuration(v) ?? 0) <= 10_800 || 'Must be at most 3 hours',
  ],
  isrc: [(v) => !v?.trim() || ISRC_PATTERN.test(v.trim()) || 'ISRC looks like US-ABC-26-00001'],
  lyrics: [(v) => v.length <= 20_000 || 'Max 20000 characters'],
}

/** Moves the cursor into a field of the form and brings it into view */
async function focusField(field) {
  await nextTick()
  const target = field === 'lyrics' ? lyricsField.value : titleField.value
  target?.focus()
  target?.$el?.scrollIntoView?.({ block: 'center' })
}

watch(open, (isOpen) => {
  if (!isOpen) return
  error.value = null
  statusError.value = null
  lyricsExpanded.value = false
  form.value = createSongForm(props.song)
  mode.value = isNew.value || props.startInEdit ? 'edit' : 'view'
  if (mode.value === 'edit') focusField('title')
})

/** @param {'title' | 'lyrics'} [field] where the cursor lands: the title, or straight in the lyrics */
function startEdit(field = 'title') {
  form.value = createSongForm(props.song)
  error.value = null
  lyricsExpanded.value = false
  mode.value = 'edit'
  focusField(field)
}

/** From the read view: back to it. Opened straight into the form: close */
function cancel() {
  if (isNew.value || props.startInEdit) {
    open.value = false
  } else {
    error.value = null
    mode.value = 'view'
  }
}

function expandLyrics() {
  lyricsExpanded.value = true
  focusField('lyrics')
}

function collapseLyrics() {
  lyricsExpanded.value = false
  focusField('lyrics')
}

/** Esc first leaves the expanded editor; only the next Esc reaches the dialog and closes it */
function onKeydown(event) {
  if (event.key !== 'Escape' || !lyricsExpanded.value) return
  event.stopPropagation()
  event.preventDefault()
  collapseLyrics()
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    // A problem in a hidden field must not stay invisible
    lyricsExpanded.value = false
    return
  }

  const payload = toSongRequest(form.value)
  const created = isNew.value
  let saved = null

  const ok = await submit(async () => {
    saved = created
      ? await songService.create(props.releaseId, payload)
      : await songService.replace(props.releaseId, props.song.id, payload)
  })
  if (!ok) return

  emit('saved', saved, { created })
  open.value = false
}

/** A quick change from the read view: saved at once, the dialog stays open */
async function changeStatus(status) {
  statusSaving.value = true
  statusError.value = null
  try {
    const updated = await songService.updateStatus(props.releaseId, props.song.id, status)
    emit('saved', updated, { created: false })
  } catch (e) {
    console.error('### songs/updateStatus failed:\n', e)
    statusError.value = 'Could not change the status. Try again.'
  } finally {
    statusSaving.value = false
  }
}

/** Deleting is confirmed by SongDeleteDialog, owned by the tracklist: this dialog only hands over */
function requestDelete() {
  open.value = false
  emit('delete', props.song)
}
</script>

<template>
  <v-dialog
    v-model="open"
    :max-width="lyricsExpanded ? 1100 : 640"
    :height="lyricsExpanded ? '100%' : undefined"
    scrollable
    :persistent="loading"
  >
    <v-card @keydown.capture="onKeydown">
      <v-card-title class="flex items-start gap-2 px-4 pt-4 sm:px-6">
        <div class="min-w-0 flex-1">
          <p
            v-if="(mode === 'view' && song) || lyricsExpanded"
            class="text-xs font-medium uppercase tracking-widest text-on-surface-variant"
          >
            {{ lyricsExpanded ? 'Lyrics' : `Track ${song.trackNumber}` }}
          </p>
          <div class="flex min-w-0 items-center gap-1">
            <p class="truncate">{{ heading }}</p>
            <v-btn
              v-if="mode === 'view' && song"
              :icon="ICONS.RENAME"
              variant="text"
              size="small"
              density="comfortable"
              aria-label="Edit song"
              @click="startEdit('title')"
            />
          </div>
        </div>
        <v-btn
          v-if="lyricsExpanded"
          :icon="ICONS.COLLAPSE"
          variant="text"
          size="small"
          aria-label="Back to the whole form"
          @click="collapseLyrics"
        />
        <v-btn v-else :icon="ICONS.CLOSE" variant="text" size="small" aria-label="Close" :disabled="loading" @click="open = false" />
      </v-card-title>

      <!-- Read view: what people work with first (files, lyrics), then the reference details -->
      <v-card-text v-if="mode === 'view' && song" class="px-4 pb-2 sm:px-6">
        <div class="mb-1 flex flex-wrap items-center gap-2">
          <SongStatusMenu :status="song.status" :loading="statusSaving" @change="changeStatus" />
          <v-chip v-if="song.explicit" size="small" variant="outlined" prepend-icon="mdi-alpha-e-box-outline">Explicit</v-chip>
        </div>
        <p v-if="statusError" class="text-xs text-error" role="alert">{{ statusError }}</p>

        <SongFilesSection
          v-if="release"
          class="mt-5"
          :release="release"
          :song="song"
          @changed="emit('files-changed')"
        />

        <div class="mb-2 mt-5 flex items-center justify-between">
          <p class="text-xs uppercase tracking-wider text-on-surface-variant">Lyrics</p>
          <div class="flex items-center">
            <CopyButton v-if="song.lyrics" :text="song.lyrics" label="Copy lyrics" />
            <v-btn
              :icon="ICONS.RENAME"
              :aria-label="song.lyrics ? 'Edit lyrics' : 'Add lyrics'"
              variant="text"
              size="x-small"
              density="comfortable"
              @click="startEdit('lyrics')"
            />
          </div>
        </div>
        <ExpandableText :text="song.lyrics" :lines="8" placeholder="No lyrics yet." class="text-on-surface" />

        <p class="mb-1 mt-5 text-xs uppercase tracking-wider text-on-surface-variant">Details</p>
        <div class="detail-row">
          <span class="text-sm text-on-surface-variant">Length</span>
          <span :class="song.durationSeconds ? 'font-medium text-primary' : 'text-on-surface-variant'">
            {{ song.durationSeconds ? formatDuration(song.durationSeconds) : 'Not set' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="text-sm text-on-surface-variant">ISRC</span>
          <span v-if="song.isrc" class="flex items-center gap-1">
            <span class="font-mono font-medium text-primary">{{ formatIsrc(song.isrc) }}</span>
            <CopyButton :text="song.isrc" label="Copy ISRC" />
          </span>
          <span v-else class="text-on-surface-variant">Not set</span>
        </div>
      </v-card-text>

      <!-- Form: the fields hidden while the lyrics are expanded keep what was typed -->
      <v-card-text v-else class="px-4 pb-2 pt-2 sm:px-6" :class="lyricsExpanded && 'lyrics-expanded'">
        <v-form id="song-form" ref="formRef" class="flex h-full flex-col" @submit.prevent="save">
          <v-text-field
            v-show="!lyricsExpanded"
            ref="titleField"
            v-model="form.title"
            label="Title"
            :rules="rules.title"
            counter="150"
          />

          <v-textarea
            ref="lyricsField"
            v-model="form.lyrics"
            label="Lyrics"
            :rules="rules.lyrics"
            counter="20000"
            :rows="lyricsExpanded ? 20 : 4"
            :max-rows="lyricsExpanded ? undefined : 14"
            :auto-grow="!lyricsExpanded"
            :no-resize="lyricsExpanded"
            class="lyrics-field"
          >
            <template v-if="!lyricsExpanded" #append-inner>
              <v-btn
                :icon="ICONS.EXPAND"
                variant="text"
                size="x-small"
                density="comfortable"
                aria-label="Expand the lyrics editor"
                @click.stop="expandLyrics"
              />
            </template>
          </v-textarea>

          <div v-show="!lyricsExpanded">
            <v-switch v-model="form.explicit" label="Explicit lyrics" color="primary" inset hide-details class="mb-2" />

            <div class="grid gap-x-4 sm:grid-cols-2">
              <v-text-field
                v-model="form.duration"
                label="Length"
                placeholder="3:35"
                hint="m:ss or h:mm:ss"
                persistent-hint
                prepend-inner-icon="mdi-clock-outline"
                :rules="rules.duration"
              />
              <v-select
                v-model="form.status"
                :items="SONG_STATUSES"
                item-title="label"
                item-value="value"
                label="Status"
              >
                <!-- Vuetify 4: `item` is the option itself (the wrapper is `internalItem`) -->
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps" :prepend-icon="item.icon" :base-color="item.color" />
                </template>
              </v-select>
            </div>

            <v-text-field
              :model-value="form.isrc"
              label="ISRC"
              placeholder="US-ABC-26-00001"
              hint="Optional. The code your distributor assigned to this recording"
              persistent-hint
              class="isrc-field mt-2"
              :rules="rules.isrc"
              @update:model-value="(value) => (form.isrc = value.toUpperCase())"
            />
          </div>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2" :text="error" />
        </v-form>
      </v-card-text>

      <v-card-actions class="gap-2 px-4 pb-4 sm:px-6">
        <template v-if="mode === 'view'">
          <!-- Destructive action on the left, away from the main button -->
          <v-btn color="error" variant="text" :prepend-icon="ICONS.DELETE" @click="requestDelete">Delete</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="open = false">Close</v-btn>
          <v-btn color="primary" variant="flat" :prepend-icon="ICONS.RENAME" @click="startEdit('title')">Edit</v-btn>
        </template>
        <template v-else>
          <v-spacer />
          <v-btn v-if="lyricsExpanded" variant="text" :prepend-icon="ICONS.COLLAPSE" :disabled="loading" @click="collapseLyrics">
            Back to form
          </v-btn>
          <v-btn v-else variant="text" :disabled="loading" @click="cancel">Cancel</v-btn>
          <!-- Outside the form element, linked to it by id, so Enter in a field also saves -->
          <v-btn type="submit" form="song-form" color="primary" variant="flat" :loading="loading">
            {{ isNew ? 'Add song' : 'Save' }}
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.75rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.isrc-field :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
}

/* Expanded: the lyrics field fills the dialog instead of growing line by line */
.lyrics-expanded .lyrics-field {
  flex: 1;
}

.lyrics-expanded .lyrics-field :deep(.v-input__control),
.lyrics-expanded .lyrics-field :deep(.v-field) {
  height: 100%;
}

.lyrics-expanded .lyrics-field :deep(textarea) {
  height: 100% !important;
  line-height: 1.7;
}
</style>