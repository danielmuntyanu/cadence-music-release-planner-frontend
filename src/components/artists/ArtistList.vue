<script setup>
import ArtistAvatar from './ArtistAvatar.vue'
import ArtistActionsMenu from './ArtistActionsMenu.vue'
import { pluralize } from '@/utils/format'

defineProps({
  artists: { type: Array, required: true },
  highlightedId: { type: Number, default: null },
})

defineEmits(['edit', 'delete'])

const detailRoute = (artist) => ({ name: 'artist-detail', params: { id: artist.id } })
</script>

<template>
  <v-card border flat>
    <v-list lines="two" class="py-0">
      <template v-for="(artist, index) in artists" :key="artist.id">
        <v-divider v-if="index > 0" />
        <v-list-item class="py-3" color="primary" :active="artist.id === highlightedId">
          <template #prepend>
            <RouterLink :to="detailRoute(artist)" class="me-4 rounded-full" tabindex="-1" :aria-label="`Open ${artist.name}`">
              <ArtistAvatar :name="artist.name" :src="artist.avatarUrl" :size="44" />
            </RouterLink>
          </template>

          <v-list-item-title class="font-medium">
            <RouterLink :to="detailRoute(artist)" class="hover:underline focus-visible:underline">
              {{ artist.name }}
            </RouterLink>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ artist.genre || 'No genre' }} · {{ pluralize(artist.releaseCount, 'release') }}
          </v-list-item-subtitle>

          <template #append>
            <span class="me-2 hidden max-w-xs truncate text-sm text-on-surface-variant md:block">
              {{ artist.description }}
            </span>
            <ArtistActionsMenu @edit="$emit('edit', artist)" @delete="$emit('delete', artist)" />
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-card>
</template>