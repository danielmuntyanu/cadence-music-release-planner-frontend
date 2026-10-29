<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import ArtistAvatar from './ArtistAvatar.vue'
import ArtistFields from './ArtistFields.vue'
import ArtistImagesSection from './ArtistImagesSection.vue'
import { useArtistsStore } from '@/stores/artists'
import { useSubmit } from '@/composables/useSubmit'
import { createArtistForm, toArtistUpdateRequest } from '@/models/artist'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  artist: { type: Object, default: null },
})

const emit = defineEmits(['updated'])

const artistsStore = useArtistsStore()
const { xs } = useDisplay()
const { loading, error, submit } = useSubmit({
  errorMessages: {
    400: 'Some fields are invalid. Check the form and try again.',
    404: 'This artist no longer exists.',
  },
})

const form = ref(null)
const fields = ref(null)
const draft = ref(createArtistForm())
const initialSnapshot = ref('')

// Images are saved right away by ImageInput, so the header follows the store, not the draft
const current = computed(() => (props.artist ? artistsStore.findById(props.artist.id) ?? props.artist : null))

const snapshot = (value) => JSON.stringify(toArtistUpdateRequest(value))
const dirty = computed(() => snapshot(draft.value) !== initialSnapshot.value)

// Fresh draft on every open, so a cancelled edit never leaks into the next one
watch(open, (isOpen) => {
  if (!isOpen || !props.artist) return
  draft.value = createArtistForm(props.artist)
  initialSnapshot.value = snapshot(draft.value)
  error.value = null
})

async function onSubmit() {
  const { valid } = await form.value.validate()
  if (!valid) return

  let updated = null
  const ok = await submit(async () => {
    updated = await artistsStore.update(props.artist.id, toArtistUpdateRequest(draft.value))
  })

  if (ok) {
    open.value = false
    emit('updated', updated)
  }
}
</script>

<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="720"
    scrollable
    :persistent="dirty"
    @after-enter="fields?.focus()"
  >
    <v-card v-if="artist">
      <v-form ref="form" class="flex max-h-full flex-col" @submit.prevent="onSubmit">
        <div class="flex items-center gap-4 px-4 py-4 sm:px-6">
          <ArtistAvatar :name="draft.name" :src="current?.avatarUrl" :size="56" />
          <div class="min-w-0 flex-1">
            <p class="text-xs uppercase tracking-wider text-on-surface-variant">Edit artist</p>
            <h2 class="truncate text-lg font-medium text-on-surface">{{ draft.name.trim() || 'Untitled artist' }}</h2>
          </div>
          <v-btn icon="mdi-close" variant="text" aria-label="Close" @click="open = false" />
        </div>

        <v-divider />

        <v-card-text class="flex flex-col gap-6 p-4 sm:p-6">
          <ArtistImagesSection :artist-id="artist.id" />
          <v-divider />
          <ArtistFields ref="fields" v-model="draft" :with-image-links="false" />
          <v-alert v-if="error" type="error" variant="tonal" density="compact" :text="error" />
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end gap-2 px-4 py-3 sm:px-6">
          <v-btn variant="text" @click="open = false">Cancel</v-btn>
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            prepend-icon="mdi-content-save-outline"
            :disabled="!dirty"
            :loading="loading"
          >
            Save changes
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>