<script setup>
import { computed } from 'vue'
import ImageInput from '@/components/media/ImageInput.vue'
import ArtistAvatar from './ArtistAvatar.vue'
import { useArtistsStore } from '@/stores/artists'
import ArtistBanner from './ArtistBanner.vue'

const props = defineProps({
  artistId: { type: Number, required: true },
})

const emit = defineEmits(['changed'])

const artistsStore = useArtistsStore()

// Read from the store, so a new image shows up here and on every card at once
const artist = computed(() => artistsStore.findById(props.artistId))

const ERROR_MESSAGES = {
  403: 'You can only change images of your own artists.',
  404: 'This artist no longer exists.',
}

// Defined once: ImageInput reads its actions at setup
const avatarActions = {
  upload: (file, onProgress) => artistsStore.uploadImage(props.artistId, 'avatar', file, onProgress),
  remove: () => artistsStore.removeImage(props.artistId, 'avatar'),
  saveLink: (url) => artistsStore.update(props.artistId, { avatarUrl: url }),
}

const bannerActions = {
  upload: (file, onProgress) => artistsStore.uploadImage(props.artistId, 'banner', file, onProgress),
  remove: () => artistsStore.removeImage(props.artistId, 'banner'),
  saveLink: (url) => artistsStore.update(props.artistId, { bannerUrl: url }),
}
</script>

<template>
  <section v-if="artist" class="flex flex-col gap-6">
    <div>
      <h3 class="mb-3 text-sm font-medium text-on-surface">Avatar</h3>
      <ImageInput
        shape="circle"
        :src="artist.avatarUrl"
        :alt="`${artist.name} avatar`"
        :error-messages="ERROR_MESSAGES"
        v-bind="avatarActions"
        @uploaded="emit('changed')"
        @removed="emit('changed')"
        @linked="emit('changed')"
      >
        <template #placeholder>
          <ArtistAvatar :name="artist.name" :size="96" />
        </template>
      </ImageInput>
    </div>

    <div>
      <h3 class="mb-3 text-sm font-medium text-on-surface">Banner</h3>
      <ImageInput
        shape="wide"
        :src="artist.bannerUrl"
        :alt="`${artist.name} banner`"
        :error-messages="ERROR_MESSAGES"
        v-bind="bannerActions"
        @uploaded="emit('changed')"
        @removed="emit('changed')"
        @linked="emit('changed')"
      >
        <template #placeholder>
            <ArtistBanner>
                <v-icon icon="mdi-panorama-variant-outline" size="32" class="text-on-surface-variant" />
            </ArtistBanner>
        </template>
      </ImageInput>
    </div>

    <p class="text-xs text-on-surface-variant">Images are saved as soon as you upload or link them.</p>
  </section>
</template>