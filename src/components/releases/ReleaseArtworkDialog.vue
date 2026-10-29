<script setup>
import ImageInput from '@/components/media/ImageInput.vue'
import { releaseService } from '@/services/release.service'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  release: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

// Read once by ImageInput: they look up the release id when called, so it is always current
const actions = {
  upload: async (file, onProgress) => emit('updated', await releaseService.uploadArtwork(props.release.id, file, onProgress)),
  remove: async () => emit('updated', await releaseService.removeArtwork(props.release.id)),
}
</script>

<template>
  <v-dialog v-model="open" max-width="520">
    <v-card>
      <v-card-title class="flex items-center justify-between px-4 pt-4 sm:px-6">
        Cover
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Close" @click="open = false" />
      </v-card-title>
      <v-card-text class="px-4 pb-6 sm:px-6">
        <ImageInput
          shape="square"
          :src="release.artworkUrl"
          :alt="`${release.name} cover`"
          v-bind="actions"
          @uploaded="open = false"
          @removed="open = false"
        />
        <p class="mt-4 text-xs text-on-surface-variant">
          The app shows the cover cropped to a square. The original file is kept exactly as uploaded,
          ready for distributors, who usually ask for a square image of at least 3000 × 3000 px.
        </p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>