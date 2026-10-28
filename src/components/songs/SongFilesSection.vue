<script setup>
import { onMounted, ref } from 'vue'
import AudioUploader from './AudioUploader.vue'
import DownloadButton from '@/components/common/DownloadButton.vue'
import { songService } from '@/services/song.service'
import { usePlayerStore } from '@/stores/player'
import { ICONS } from '@/constants/icons'
import { formatBytes } from '@/utils/image-file'

const props = defineProps({
  release: { type: Object, required: true },
  song: { type: Object, required: true },
})

// changed: the song's file count or main file moved, so the tracklist should refresh
const emit = defineEmits(['changed'])

const player = usePlayerStore()

const files = ref([])
const loading = ref(true)
const failed = ref(false)
const busyId = ref(null)
const problem = ref(null)
const renamingId = ref(null)
const renameDraft = ref('')
const deleteOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const releaseId = () => props.release.id
const songId = () => props.song.id

const formatDate = (iso) => (iso ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso)) : '')
const typeOf = (filename) => filename.split('.').pop()?.toUpperCase() ?? ''
const isPlaying = (file) => player.isCurrentFile(file.id) && player.playing

async function load() {
  loading.value = true
  failed.value = false
  try {
    files.value = await songService.getFiles(releaseId(), songId())
  } catch (e) {
    failed.value = true
    console.error('### song files/getFiles failed:\n', e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

/** Runs a change to one file and reports a failure in place */
async function change(file, action, failure, { notify = true } = {}) {
  busyId.value = file.id
  problem.value = null
  try {
    await action()
    if (notify) emit('changed')
  } catch (e) {
    console.error('### song files failed:\n', e)
    problem.value = failure
  } finally {
    busyId.value = null
  }
}

// ---------- Upload ----------

const upload = (file, options) => songService.uploadFile(releaseId(), songId(), file, options)

function onUploaded(file) {
  // The server already made the first file of a song its main one
  files.value = [file, ...files.value]
  emit('changed')
}

// ---------- Heart ----------

function togglePrimary(file) {
  return change(
    file,
    async () => { files.value = await songService.setPrimaryFile(releaseId(), songId(), file.primary ? null : file.id) },
    'Could not change the main file. Try again.',
  )
}

// ---------- Rename ----------

function startRename(file) {
  renamingId.value = file.id
  renameDraft.value = file.displayName
}

function cancelRename() {
  renamingId.value = null
}

function saveRename(file) {
  const name = renameDraft.value.trim()
  if (!name || name === file.displayName) return cancelRename()
  if (name.length > 150) {
    problem.value = 'Names can be at most 150 characters.'
    return
  }
  return change(
    file,
    async () => {
      const saved = await songService.renameFile(releaseId(), songId(), file.id, name)
      files.value = files.value.map((existing) => (existing.id === saved.id ? saved : existing))
      renamingId.value = null
    },
    'Could not rename the file. Try again.',
    { notify: false },
  )
}

// ---------- Delete ----------

function askDelete(file) {
  deleteTarget.value = file
  deleteOpen.value = true
}

async function confirmDelete() {
  const file = deleteTarget.value
  deleting.value = true
  await change(
    file,
    async () => {
      await songService.deleteFile(releaseId(), songId(), file.id)
      if (player.isCurrentFile(file.id)) player.stop()
      files.value = files.value.filter((existing) => existing.id !== file.id)
    },
    'Could not delete the file. Try again.',
  )
  deleting.value = false
  deleteOpen.value = false
}
</script>

<template>
  <div>
    <p class="mb-2 text-xs uppercase tracking-wider text-on-surface-variant">Files</p>

    <v-skeleton-loader v-if="loading" type="list-item-two-line" />

    <v-alert v-else-if="failed" type="error" variant="tonal" density="compact" text="Could not load the files.">
      <template #append>
        <v-btn variant="text" size="small" @click="load">Retry</v-btn>
      </template>
    </v-alert>

    <template v-else>
      <p v-if="!files.length" class="mb-3 text-sm text-on-surface-variant">No audio yet. Add a demo, a mix or a master.</p>

      <div v-for="file in files" :key="file.id" class="file-row flex items-center gap-2 py-2">
        <v-btn
          :icon="isPlaying(file) ? ICONS.PAUSE : ICONS.PLAY"
          :aria-label="`${isPlaying(file) ? 'Pause' : 'Play'} ${file.displayName}`"
          color="primary"
          variant="tonal"
          size="small"
          @click="player.playFile(release, song, file)"
        />

        <div class="min-w-0 flex-1">
          <div v-if="renamingId === file.id" class="flex items-center gap-1">
            <v-text-field
              v-model="renameDraft"
              aria-label="File name"
              density="compact"
              hide-details
              autofocus
              :disabled="busyId === file.id"
              @keydown.enter.prevent="saveRename(file)"
              @keydown.esc.stop="cancelRename"
            />
            <v-btn icon="mdi-check" size="small" variant="text" aria-label="Save name" @click="saveRename(file)" />
          </div>
          <template v-else>
            <p class="truncate text-sm font-medium" :class="player.isCurrentFile(file.id) ? 'text-primary' : 'text-on-surface'">
              {{ file.displayName }}
            </p>
            <p class="truncate text-xs text-on-surface-variant">
              {{ typeOf(file.originalFilename) }} · {{ formatBytes(file.sizeBytes) }} · {{ formatDate(file.uploadedAt) }}
            </p>
          </template>
        </div>

        <v-btn
          :icon="file.primary ? ICONS.PRIMARY : ICONS.NOT_PRIMARY"
          :color="file.primary ? 'error' : undefined"
          :loading="busyId === file.id && renamingId !== file.id"
          :aria-pressed="file.primary"
          :aria-label="file.primary ? `${file.displayName} is the main file. Unmark it` : `Mark ${file.displayName} as the main file`"
          size="small"
          variant="text"
          @click="togglePrimary(file)"
        />

        <DownloadButton
          :get-link="() => songService.fileDownloadLink(release.id, song.id, file.id)"
          :label="`Download ${file.displayName}`"
          size="small"
          @error="problem = 'Could not prepare the download. Try again.'"
        />

        <v-menu location="bottom end">
          <template #activator="{ props: activator }">
            <v-btn v-bind="activator" icon="mdi-dots-vertical" size="small" variant="text" :aria-label="`Actions for ${file.displayName}`" />
          </template>
          <v-list density="compact" min-width="160">
            <v-list-item :prepend-icon="ICONS.RENAME" title="Rename" @click="startRename(file)" />
            <v-list-item :prepend-icon="ICONS.DELETE" title="Delete" base-color="error" @click="askDelete(file)" />
          </v-list>
        </v-menu>
      </div>

      <v-alert v-if="problem" type="error" variant="tonal" density="compact" class="my-2" :text="problem" closable @click:close="problem = null" />

      <AudioUploader class="mt-3" :upload="upload" @uploaded="onUploaded" />
    </template>

    <v-dialog v-model="deleteOpen" max-width="420" :persistent="deleting">
      <v-card v-if="deleteTarget">
        <v-card-text class="pt-6 text-center">
          <h3 class="mb-2 text-lg font-medium text-on-surface">Delete “{{ deleteTarget.displayName }}”?</h3>
          <p class="text-on-surface-variant">The audio is removed from storage. This can't be undone.</p>
        </v-card-text>
        <v-card-actions class="justify-center gap-2 pb-4">
          <v-btn variant="text" :disabled="deleting" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">Delete file</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.file-row + .file-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>