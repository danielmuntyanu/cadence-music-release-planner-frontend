<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  danger: Boolean,
})
</script>

<template>
  <section>
    <v-card border flat :class="danger && 'border-error'">
      <v-card-text class="p-4 sm:p-6">
        <h2 class="text-lg font-medium" :class="danger ? 'text-error' : 'text-on-surface'">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-1 text-sm text-on-surface-variant">{{ description }}</p>
        <div class="mt-5"><slot /></div>
      </v-card-text>
    </v-card>
  </section>
</template>