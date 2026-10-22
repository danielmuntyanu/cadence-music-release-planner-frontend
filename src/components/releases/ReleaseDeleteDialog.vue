<script setup>
import { watch } from 'vue'
import { useReleasesStore } from '@/stores/releases'
import { useSubmit } from '@/composables/useSubmit'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  release: { type: Object, default: null },
})

const emit = defineEmits(['deleted'])

const releasesStore = useReleasesStore()
const { loading, error, submit } = useSubmit({
  errorMessages: { 404: 'This release was already deleted.' },
})

watch(open, (isOpen) => { if (isOpen) error.value = null })

async function onConfirm() {
  const ok = await submit(() => releasesStore.remove(props.release.id))
  if (ok) {
    open.value = false
    emit('deleted', props.release)
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="440" :persistent="loading">
    <v-card v-if="release" class="p-2">
      <v-card-text class="flex flex-col items-center gap-3 pt-6 text-center">
        <v-avatar color="error" variant="tonal" size="56">
          <v-icon icon="mdi-delete-alert-outline" size="28" />
        </v-avatar>
        <h2 class="text-lg font-medium text-on-surface">Delete {{ release.name }}?</h2>
        <p class="text-on-surface-variant">Its artists stay in your roster. This can't be undone.</p>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="w-full" :text="error" />
      </v-card-text>

      <v-card-actions class="justify-center gap-2 pb-4">
        <v-btn variant="text" :disabled="loading" @click="open = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" :loading="loading" @click="onConfirm">Delete release</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>