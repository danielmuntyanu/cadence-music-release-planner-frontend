<script setup>
defineProps({
  icon: { type: String, required: true },
  tag: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
})
</script>

<template>
  <v-card border flat class="h-full">
    <v-card-text class="flex h-full flex-col p-5 sm:p-6">
      <div class="mb-4 flex items-start justify-between gap-3">
        <v-avatar size="40" rounded="lg" color="primary-container">
          <v-icon :icon="icon" class="text-primary-accent" />
        </v-avatar>
        <v-chip v-if="tag" size="x-small" variant="outlined" label>{{ tag }}</v-chip>
      </div>

      <h3 class="text-lg font-medium text-on-surface">{{ title }}</h3>
      <p class="mt-2 text-sm text-on-surface-variant">{{ description }}</p>

      <div class="mt-5 flex-1 content-end">
        <div class="rounded-lg border border-border-subtle bg-surface-low p-3 text-xs">
          <slot />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>