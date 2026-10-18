<script setup>
defineProps({
  // Translucent background for placement over images
  floating: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])
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
        aria-label="Artist actions"
      />
    </template>

    <v-list density="compact" min-width="160">
      <v-list-item prepend-icon="mdi-pencil-outline" title="Edit" @click="emit('edit')" />
      <v-list-item prepend-icon="mdi-delete-outline" title="Delete" base-color="error" @click="emit('delete')" />
    </v-list>
  </v-menu>
</template>

<style scoped>
.menu-floating {
  background: rgba(var(--v-theme-surface), 0.72);
  backdrop-filter: blur(8px);
}
</style>