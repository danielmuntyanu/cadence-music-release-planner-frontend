<script setup>
import { ICONS } from '@/constants/icons'

defineProps({
  // Translucent background for placement over artwork
  floating: { type: Boolean, default: false },
  // Where "Edit" leads. Without it only Delete is offered, e.g. on the release page itself
  editTo: { type: [Object, String], default: null },
})

const emit = defineEmits(['delete'])
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: activator }">
      <v-btn
        v-bind="activator"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
        :class="floating && 'menu-floating'"
        aria-label="Release actions"
      />
    </template>

    <v-list density="compact" min-width="160">
      <v-list-item v-if="editTo" :to="editTo" :prepend-icon="ICONS.RENAME" title="Edit" />
      <v-list-item :prepend-icon="ICONS.DELETE" title="Delete" base-color="error" @click="emit('delete')" />
    </v-list>
  </v-menu>
</template>

<style scoped>
.menu-floating {
  background: rgba(var(--v-theme-surface), 0.72);
  backdrop-filter: blur(8px);
}
</style>