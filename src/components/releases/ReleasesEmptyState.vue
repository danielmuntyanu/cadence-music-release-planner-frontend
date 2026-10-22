<script setup>
defineEmits(['create'])
</script>

<template>
  <v-card border flat class="overflow-hidden">
    <div class="flex flex-col items-center px-6 py-14 text-center sm:py-20">
      <div class="relative mb-8">
        <div class="empty-glow absolute -inset-10 rounded-full blur-2xl" />
        <div class="relative flex items-end -space-x-3">
          <v-avatar size="56" rounded="lg" color="secondary" variant="tonal" class="ring-4 ring-[rgb(var(--v-theme-surface))]">
            <v-icon icon="mdi-music-note" />
          </v-avatar>
          <v-avatar size="80" rounded="lg" color="primary" class="z-10 ring-4 ring-[rgb(var(--v-theme-surface))]">
            <v-icon icon="mdi-album" size="36" />
          </v-avatar>
          <v-avatar size="56" rounded="lg" color="secondary" variant="tonal" class="ring-4 ring-[rgb(var(--v-theme-surface))]">
            <v-icon icon="mdi-disc" />
          </v-avatar>
        </div>
      </div>

      <h2 class="mb-2 text-xl font-medium text-on-surface">No releases yet</h2>
      <p class="mb-6 max-w-md text-on-surface-variant">
        Plan your next single, EP or album: set a date, move it through each phase and keep everything in one place.
      </p>

      <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="$emit('create')">
        Plan your first release
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.empty-glow {
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.35), transparent 70%);
}
</style>