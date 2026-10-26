<script setup>
defineProps({
  release: { type: Object, required: true },
})

defineEmits(['updated'])
</script>

<template>
  <v-card border flat class="px-6 py-16 text-center">
    <v-icon icon="mdi-playlist-music" size="48" class="mb-3 text-on-surface-variant" />
    <h2 class="mb-2 text-lg font-medium text-on-surface">No tracks yet</h2>
    <p class="text-on-surface-variant">Tracks you add to {{ release.name }} will appear here.</p>
  </v-card>
</template>