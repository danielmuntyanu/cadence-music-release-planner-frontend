<script setup>
import { computed, ref } from 'vue'
import { ICONS } from '@/constants/icons'
import { AUDIO_ACCEPT, MAX_AUDIO_BYTES, nameWithoutExtension, validateAudioFile } from '@/utils/audio-file'
import { formatBytes } from '@/utils/image-file'

const props = defineProps({
  // (file, { displayName, onProgress, signal }) => Promise<SongFile>
  upload: { type: Function, required: true },
  maxBytes: { type: Number, default: MAX_AUDIO_BYTES },
})

const emit = defineEmits(['uploaded'])

const input = ref(null)
const file = ref(null)
const name = ref('')
const progress = ref(null)
const uploading = ref(false)
const error = ref(null)
const dragging = ref(false)
let controller = null

const percent = computed(() => (progress.value == null ? null : Math.round(progress.value * 100)))
const hint = computed(() => `WAV, AIFF, FLAC, MP3, M4A, AAC or OGG, up to ${formatBytes(props.maxBytes)}`)

function openPicker() {
  if (!uploading.value) input.value?.click()
}

function onPick(event) {
  const picked = event.target.files?.[0]
  // Reset so picking the same file again still fires change
  event.target.value = ''
  pick(picked)
}

function onDrop(event) {
  dragging.value = false
  pick(event.dataTransfer?.files?.[0])
}

function pick(picked) {
  if (!picked) return
  error.value = validateAudioFile(picked, props.maxBytes)
  if (error.value) return
  file.value = picked
  // Prefilled from the file name; the user can change it before the upload starts
  name.value = nameWithoutExtension(picked.name)
}

function clear() {
  file.value = null
  name.value = ''
  progress.value = null
  error.value = null
}

function messageFor(e) {
  const status = e?.response?.status
  if (status === 400 && e.response.data?.message) return e.response.data.message
  if (status === 404) return 'This song no longer exists.'
  if (!e?.response) return 'The upload was interrupted. Check your connection and try again.'
  return 'Could not upload the file. Try again.'
}

async function start() {
  if (!file.value || uploading.value) return
  if (name.value.length > 150) {
    error.value = 'Names can be at most 150 characters.'
    return
  }

  controller = new AbortController()
  uploading.value = true
  error.value = null
  progress.value = 0
  try {
    const saved = await props.upload(file.value, {
      displayName: name.value.trim() || null,
      onProgress: (value) => { progress.value = value },
      signal: controller.signal,
    })
    clear()
    emit('uploaded', saved)
  } catch (e) {
    // Cancelled on purpose: the file stays picked, ready for another try
    if (e?.code === 'ERR_CANCELED') return
    console.error('### audio upload failed:\n', e)
    // On failure the file stays picked too, so retrying is one click
    error.value = messageFor(e)
  } finally {
    uploading.value = false
    progress.value = null
    controller = null
  }
}

function cancel() {
  if (uploading.value) controller?.abort()
  else clear()
}
</script>

<template>
  <div>
    <input ref="input" type="file" class="hidden" :accept="AUDIO_ACCEPT" @change="onPick" />

    <!-- Nothing picked: drop zone -->
    <div
      v-if="!file"
      role="button"
      tabindex="0"
      aria-label="Add an audio file"
      class="drop-zone flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition"
      :class="dragging && 'is-dragging'"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <v-icon :icon="ICONS.UPLOAD" class="text-on-surface-variant" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-on-surface">Add an audio file</p>
        <p class="text-xs text-on-surface-variant">{{ hint }}. Click or drop a file here.</p>
      </div>
    </div>

    <!-- Picked: name it, then upload -->
    <div v-else class="picked rounded-lg px-4 py-3">
      <v-text-field
        v-model="name"
        label="Name"
        counter="150"
        density="compact"
        :disabled="uploading"
        :hint="`From ${file.name} · ${formatBytes(file.size)}`"
        persistent-hint
        @keydown.enter.prevent="start"
      />

      <v-progress-linear
        v-if="uploading"
        :model-value="percent ?? 0"
        :indeterminate="percent === null"
        color="primary"
        height="6"
        rounded
        class="mt-3"
        aria-label="Upload progress"
      />

      <div class="mt-3 flex justify-end gap-2">
        <v-btn variant="text" size="small" :text="uploading ? 'Cancel upload' : 'Cancel'" @click="cancel" />
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          :prepend-icon="ICONS.UPLOAD"
          :disabled="uploading"
          :text="uploading ? `${percent ?? 0}%` : 'Upload'"
          @click="start"
        />
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2" :text="error" />
  </div>
</template>

<style scoped>
.drop-zone,
.picked {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.15);
}

.picked {
  border-style: solid;
  border-width: 1px;
}

.drop-zone:hover,
.drop-zone.is-dragging {
  border-color: rgb(var(--v-theme-primary));
}

.drop-zone:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>