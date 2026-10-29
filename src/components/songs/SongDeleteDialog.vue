<script setup>
import { watch } from 'vue'
import { songService } from '@/services/song.service'
import { useSubmit } from '@/composables/useSubmit'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  releaseId: { type: Number, required: true },
  song: { type: Object, default: null },
})

const emit = defineEmits(['deleted'])

const { loading, error, submit } = useSubmit({
  errorMessages: { 404: 'This song was already deleted.' },
})

watch(open, (isOpen) => { if (isOpen) error.value = null })

async function onConfirm() {
  const ok = await submit(() => songService.delete(props.releaseId, props.song.id))
  if (ok) {
    open.value = false
    emit('deleted', props.song)
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="440" :persistent="loading">
    <v-card v-if="song" class="p-2">
      <v-card-text class="flex flex-col items-center gap-3 pt-6 text-center">
        <v-avatar color="error" variant="tonal" size="56">
          <v-icon icon="mdi-delete-alert-outline" size="28" />
        </v-avatar>
        <h2 class="text-lg font-medium text-on-surface">Delete “{{ song.title }}”?</h2>
        <p class="text-on-surface-variant">The tracks after it move up one place. This can't be undone.</p>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="w-full" :text="error" />
      </v-card-text>

      <v-card-actions class="justify-center gap-2 pb-4">
        <v-btn variant="text" :disabled="loading" @click="open = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" :loading="loading" @click="onConfirm">Delete song</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>