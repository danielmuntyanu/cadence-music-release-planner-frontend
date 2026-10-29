<script setup>
defineEmits(['create'])
</script>

<template>
  <v-card border flat class="overflow-hidden">
    <div class="flex flex-col items-center px-6 py-14 text-center sm:py-20">
      <div class="relative mb-8">
        <div class="empty-glow absolute -inset-10 rounded-full blur-2xl" />
        <div class="relative flex items-end -space-x-3">
          <v-avatar size="56" color="secondary" variant="tonal" class="ring-4 ring-[rgb(var(--v-theme-surface))]">
            <v-icon icon="mdi-guitar-electric" />
          </v-avatar>
          <v-avatar size="80" color="primary" class="z-10 ring-4 ring-[rgb(var(--v-theme-surface))]">
            <v-icon icon="mdi-account-music" size="36" />
          </v-avatar>
          <v-avatar size="56" color="secondary" variant="tonal" class="ring-4 ring-[rgb(var(--v-theme-surface))]">
            <v-icon icon="mdi-microphone-variant" />
          </v-avatar>
        </div>
      </div>

      <h2 class="mb-2 text-xl font-medium text-on-surface">Your roster is empty</h2>
      <p class="mb-6 max-w-md text-on-surface-variant">
        Add the artists you work with to assign releases to them and see each artist's work in one place.
      </p>

      <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="$emit('create')">
        Add your first artist
      </v-btn>
      <p class="mt-3 text-xs text-on-surface-variant">Only a name is required. Genre, bio and links can wait.</p>
    </div>
  </v-card>
</template>

<style scoped>
.empty-glow {
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.35), transparent 70%);
}
</style>