<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import CopyButton from '@/components/common/CopyButton.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import SongFilesSection from '@/components/songs/SongFilesSection.vue'
import { SONG_STATUSES, getSongStatus } from '@/constants/song-statuses'
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

const isNew = computed(() => !props.song)
const status = computed(() => getSongStatus(props.song?.status))
const heading = computed(() => {
  if (mode.value === 'view') return props.song?.title
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

async function focusTitle() {
  await nextTick()
  titleField.value?.focus()
}

watch(open, (isOpen) => {
  if (!isOpen) return
  error.value = null
  form.value = createSongForm(props.song)
  mode.value = isNew.value || props.startInEdit ? 'edit' : 'view'
  if (mode.value === 'edit') focusTitle()
})

function startEdit() {
  form.value = createSongForm(props.song)
  error.value = null
  mode.value = 'edit'
  focusTitle()
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

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

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

/** Deleting is confirmed by SongDeleteDialog, owned by the tracklist: this dialog only hands over */
function requestDelete() {
  open.value = false
  emit('delete', props.song)
}
</script>

<template>
  <v-dialog v-model="open" max-width="640" scrollable :persistent="loading">
    <v-card>
      <v-card-title class="flex items-start gap-2 px-4 pt-4 sm:px-6">
        <div class="min-w-0 flex-1">
          <p
            v-if="mode === 'view' && song"
            class="text-xs font-medium uppercase tracking-widest text-on-surface-variant"
          >
            Track {{ song.trackNumber }}
          </p>
          <p class="truncate">{{ heading }}</p>
        </div>
        <v-btn :icon="ICONS.CLOSE" variant="text" size="small" aria-label="Close" :disabled="loading" @click="open = false" />
      </v-card-title>

      <!-- Read view -->
      <v-card-text v-if="mode === 'view' && song" class="px-4 pb-2 sm:px-6">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <v-chip :color="status.color" :prepend-icon="status.icon" size="small" variant="tonal">{{ status.label }}</v-chip>
          <v-chip v-if="song.explicit" size="small" variant="outlined" prepend-icon="mdi-alpha-e-box-outline">Explicit</v-chip>
        </div>

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

        <SongFilesSection
          v-if="release"
          class="mt-5"
          :release="release"
          :song="song"
          @changed="emit('files-changed')"
        />

        <div class="mb-2 mt-5 flex items-center justify-between">
          <p class="text-xs uppercase tracking-wider text-on-surface-variant">Lyrics</p>
          <CopyButton v-if="song.lyrics" :text="song.lyrics" label="Copy lyrics" />
        </div>
        <ExpandableText :text="song.lyrics" :lines="8" placeholder="No lyrics yet." class="text-on-surface" />
      </v-card-text>

      <!-- Form -->
      <v-card-text v-else class="px-4 pb-2 pt-2 sm:px-6">
        <v-form id="song-form" ref="formRef" @submit.prevent="save">
          <v-text-field
            ref="titleField"
            v-model="form.title"
            label="Title"
            :rules="rules.title"
            counter="150"
          />

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
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :prepend-icon="item.raw.icon" :base-color="item.raw.color" />
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

          <v-switch v-model="form.explicit" label="Explicit lyrics" color="primary" inset hide-details class="my-2" />

          <v-textarea
            v-model="form.lyrics"
            label="Lyrics"
            :rules="rules.lyrics"
            counter="20000"
            rows="4"
            max-rows="14"
            auto-grow
          />

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2" :text="error" />
        </v-form>
      </v-card-text>

      <v-card-actions class="gap-2 px-4 pb-4 sm:px-6">
        <template v-if="mode === 'view'">
          <!-- Destructive action on the left, away from the main button -->
          <v-btn color="error" variant="text" :prepend-icon="ICONS.DELETE" @click="requestDelete">Delete</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="open = false">Close</v-btn>
          <v-btn color="primary" variant="flat" :prepend-icon="ICONS.RENAME" @click="startEdit">Edit</v-btn>
        </template>
        <template v-else>
          <v-spacer />
          <v-btn variant="text" :disabled="loading" @click="cancel">Cancel</v-btn>
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
</style>