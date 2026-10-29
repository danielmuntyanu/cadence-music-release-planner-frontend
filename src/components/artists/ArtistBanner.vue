<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: null },
  // Empty by default: the banner is usually decorative next to the artist name
  alt: { type: String, default: '' },
})

// A broken or expired link falls back to the gradient instead of an empty box
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>

<template>
  <div class="h-full w-full overflow-hidden">
    <v-img v-if="src && !failed" :src="src" :alt="alt" cover class="h-full" @error="failed = true" />
    <div v-else class="artist-banner-fallback flex h-full w-full items-center justify-center">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Vuetify exposes theme colors as "r,g,b", so the fallback follows the active theme */
.artist-banner-fallback {
  background:
    radial-gradient(circle at 15% 30%, rgba(var(--v-theme-primary), 0.45), transparent 60%),
    radial-gradient(circle at 85% 0%, rgba(var(--v-theme-secondary), 0.35), transparent 55%),
    rgba(var(--v-theme-on-surface), 0.04);
}
</style>