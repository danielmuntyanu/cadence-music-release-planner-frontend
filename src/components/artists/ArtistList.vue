<script setup>
import ArtistAvatar from './ArtistAvatar.vue'

defineProps({
  artists: { type: Array, required: true },
  highlightedId: { type: Number, default: null },
})

const linksLabel = (count) => (count === 1 ? '1 link' : `${count} links`)
</script>

<template>
  <v-card border flat>
    <v-list lines="two" class="py-0">
      <template v-for="(artist, index) in artists" :key="artist.id">
        <v-divider v-if="index > 0" />
        <v-list-item class="py-3" color="primary" :active="artist.id === highlightedId">
          <template #prepend>
            <ArtistAvatar :name="artist.name" :src="artist.avatarUrl" :size="44" class="me-4" />
          </template>

          <v-list-item-title class="font-medium">{{ artist.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ artist.genre || 'No genre' }} · {{ linksLabel(artist.socials.length) }}
          </v-list-item-subtitle>

          <template #append>
            <span class="hidden max-w-xs truncate text-sm text-on-surface-variant md:block">
              {{ artist.description }}
            </span>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-card>
</template>