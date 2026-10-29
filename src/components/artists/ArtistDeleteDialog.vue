<script setup>
import { watch } from 'vue'
import { useArtistsStore } from '@/stores/artists'
import { useSubmit } from '@/composables/useSubmit'
import { pluralize } from '@/utils/format'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  artist: { type: Object, default: null },
})

const emit = defineEmits(['deleted'])

const artistsStore = useArtistsStore()
const { loading, error, submit } = useSubmit({
  errorMessages: { 404: 'This artist was already deleted.' },
})

watch(open, (isOpen) => { if (isOpen) error.value = null })

async function onConfirm() {
  const ok = await submit(() => artistsStore.remove(props.artist.id))
  if (ok) {
    open.value = false
    emit('deleted', props.artist)
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="440" :persistent="loading">
    <v-card v-if="artist" class="p-2">
      <v-card-text class="flex flex-col items-center gap-3 pt-6 text-center">
        <v-avatar color="error" variant="tonal" size="56">
          <v-icon icon="mdi-delete-alert-outline" size="28" />
        </v-avatar>
        <h2 class="text-lg font-medium text-on-surface">Delete {{ artist.name }}?</h2>
        <p v-if="artist.releaseCount" class="text-on-surface-variant">
          {{ pluralize(artist.releaseCount, 'release') }} will stay in your planner without an artist.
          You can assign another artist to them later.
        </p>
        <p v-else class="text-on-surface-variant">This can't be undone.</p>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="w-full" :text="error" />
      </v-card-text>

      <v-card-actions class="justify-center gap-2 pb-4">
        <v-btn variant="text" :disabled="loading" @click="open = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" :loading="loading" @click="onConfirm">Delete artist</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>