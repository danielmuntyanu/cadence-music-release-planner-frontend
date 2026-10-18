<script setup>
import { ref } from 'vue'
import ArtistAvatar from './ArtistAvatar.vue'
import ArtistFields from './ArtistFields.vue'
import { useArtistsStore } from '@/stores/artists'
import { useSubmit } from '@/composables/useSubmit'
import { createArtistForm, toArtistRequest } from '@/models/artist'

const emit = defineEmits(['created', 'cancel'])

const artistsStore = useArtistsStore()
const { loading, error, submit } = useSubmit({
  errorMessages: { 400: 'Some fields are invalid. Check the form and try again.' },
})

const form = ref(null)
const artist = ref(createArtistForm())

async function onSubmit() {
  const { valid } = await form.value.validate()
  if (!valid) return

  let created = null
  const ok = await submit(async () => {
    created = await artistsStore.create(toArtistRequest(artist.value))
  })

  if (ok) {
    artist.value = createArtistForm()
    form.value.resetValidation()
    emit('created', created)
  }
}
</script>

<template>
  <v-card border flat class="overflow-hidden" @keydown.esc="emit('cancel')">
    <v-form ref="form" @submit.prevent="onSubmit">
      <div class="flex items-center gap-4 px-4 py-4 sm:px-6">
        <ArtistAvatar :name="artist.name" :src="artist.avatarUrl" :size="56" />
        <div class="min-w-0 flex-1">
          <p class="text-xs uppercase tracking-wider text-on-surface-variant">New artist</p>
          <h2 class="truncate text-lg font-medium text-on-surface">{{ artist.name.trim() || 'Untitled artist' }}</h2>
        </div>
        <v-btn icon="mdi-close" variant="text" aria-label="Close" @click="emit('cancel')" />
      </div>

      <v-divider />

      <v-card-text class="p-4 sm:p-6">
        <ArtistFields v-model="artist" />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4" :text="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end gap-2 px-4 py-3 sm:px-6">
        <v-btn variant="text" @click="emit('cancel')">Cancel</v-btn>
        <v-btn type="submit" color="primary" variant="flat" prepend-icon="mdi-check" :loading="loading">
          Create artist
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>