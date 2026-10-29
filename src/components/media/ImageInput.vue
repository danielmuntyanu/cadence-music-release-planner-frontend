<script setup>
import { computed, ref } from 'vue'
import { useImageUpload } from '@/composables/useImageUpload'
import { IMAGE_TYPES, MAX_IMAGE_BYTES, formatBytes } from '@/utils/image-file'

const props = defineProps({
  // Current image (signed URL or external link); null shows the placeholder
  src: { type: String, default: null },
  alt: { type: String, default: 'Image' },
  shape: {
    type: String,
    default: 'square',
    validator: (value) => ['circle', 'square', 'wide'].includes(value),
  },
  upload: { type: Function, required: true },
  remove: { type: Function, default: null },
  // When provided, a "Link" mode lets the user paste an external image URL instead
  saveLink: { type: Function, default: null },
  maxBytes: { type: Number, default: MAX_IMAGE_BYTES },
  errorMessages: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['uploaded', 'removed', 'linked'])

// Functions are taken once at setup; parents pass stable functions, not inline lambdas that change
const { file, previewUrl, progress, loading, error, pick, clear, confirmUpload, removeImage, confirmLink } =
  useImageUpload({
    upload: props.upload,
    remove: props.remove ?? undefined,
    saveLink: props.saveLink ?? undefined,
    maxBytes: props.maxBytes,
    errorMessages: props.errorMessages,
  })

const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i

const FRAME_CLASSES = {
  circle: 'h-24 w-24 rounded-full',
  square: 'aspect-square w-40 rounded-lg',
  wide: 'aspect-[3/1] w-full rounded-lg',
}

const input = ref(null)
const linkField = ref(null)
const mode = ref('upload')
const linkDraft = ref('')
const dragging = ref(false)

const shown = computed(() => previewUrl.value ?? props.src)
const accept = IMAGE_TYPES.join(',')
const hint = computed(() => `JPEG, PNG or WebP, up to ${formatBytes(props.maxBytes)}. Click the image or drop a file on it.`)
const progressPercent = computed(() => (progress.value == null ? undefined : Math.round(progress.value * 100)))

const linkRules = [
  (v) => !!v?.trim() || 'Paste an image URL',
  (v) => URL_PATTERN.test(v?.trim() ?? '') || 'Enter a valid URL (https://...)',
  (v) => (v?.length ?? 0) <= 512 || 'Max 512 characters',
]

function openPicker() {
  if (loading.value) return
  mode.value = 'upload'
  input.value?.click()
}

function onPick(event) {
  const picked = event.target.files?.[0]
  // Reset so picking the same file again still fires change
  event.target.value = ''
  pick(picked)
}

function onDrop(event) {
  dragging.value = false
  mode.value = 'upload'
  pick(event.dataTransfer?.files?.[0])
}

async function onUpload() {
  if (await confirmUpload()) emit('uploaded')
}

async function onRemove() {
  if (await removeImage()) emit('removed')
}

// Not a nested v-form: this component may sit inside a parent form (e.g. ArtistFields)
async function onSaveLink() {
  const problems = await linkField.value.validate()
  if (problems.length) return
  if (await confirmLink(linkDraft.value)) {
    linkDraft.value = ''
    emit('linked')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4" :class="shape !== 'wide' && 'sm:flex-row sm:items-center'">
    <input ref="input" type="file" class="hidden" :accept="accept" @change="onPick" />

    <!-- Preview and drop zone -->
    <div
      role="button"
      tabindex="0"
      :aria-label="`Choose ${alt}`"
      class="drop-zone relative shrink-0 cursor-pointer overflow-hidden border-2 border-dashed transition"
      :class="[FRAME_CLASSES[shape], dragging ? 'is-dragging' : 'border-transparent']"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <img v-if="shown" :src="shown" :alt="alt" class="h-full w-full object-cover" />
      <div v-else class="flex h-full w-full items-center justify-center bg-surface-variant">
        <slot name="placeholder">
          <v-icon icon="mdi-image-plus-outline" size="32" class="text-on-surface-variant" />
        </slot>
      </div>

      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/40">
        <v-progress-circular
          :model-value="progressPercent"
          :indeterminate="progressPercent === undefined"
          color="white"
          aria-label="Uploading"
        />
      </div>
    </div>

    <!-- Controls -->
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <v-btn-toggle v-if="saveLink" v-model="mode" mandatory divided density="compact" variant="outlined" class="self-start">
        <v-btn value="upload" prepend-icon="mdi-upload-outline" text="Upload" />
        <v-btn value="link" prepend-icon="mdi-link-variant" text="Link" />
      </v-btn-toggle>

      <template v-if="mode === 'upload'">
        <p class="text-sm text-on-surface-variant">{{ hint }}</p>
        <div class="flex flex-wrap gap-2">
          <template v-if="file">
            <v-btn color="primary" prepend-icon="mdi-upload-outline" :loading="loading" text="Upload" @click="onUpload" />
            <v-btn variant="text" :disabled="loading" text="Cancel" @click="clear" />
          </template>
          <template v-else>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-image-plus-outline"
              :disabled="loading"
              text="Choose image"
              @click="openPicker"
            />
            <v-btn v-if="remove && src" variant="text" color="error" :loading="loading" text="Remove" @click="onRemove" />
          </template>
        </div>
      </template>

      <div v-else class="flex flex-col gap-2 sm:flex-row sm:items-start">
        <v-text-field
          ref="linkField"
          v-model="linkDraft"
          label="Image URL"
          placeholder="https://..."
          type="url"
          :rules="linkRules"
          class="flex-1"
          @keydown.enter.prevent="onSaveLink"
        />
        <v-btn color="primary" :loading="loading" text="Save link" class="sm:mt-2" @click="onSaveLink" />
      </div>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" :text="error" />
    </div>
  </div>
</template>

<style scoped>
.drop-zone.is-dragging {
  border-color: rgb(var(--v-theme-primary));
}

.drop-zone:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>