<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  src: { type: String, default: null },
  size: { type: Number, default: 48 },
})

const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const initials = computed(() =>
  props.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('') || '?'
)

// Stable hue per name, so an artist keeps the same color across sessions
const hue = computed(() => [...props.name].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 360, 7))

const fallbackStyle = computed(() => ({
  background: `linear-gradient(135deg, hsl(${hue.value} 70% 58%), hsl(${(hue.value + 45) % 360} 65% 42%))`,
  fontSize: `${Math.round(props.size * 0.38)}px`,
}))
</script>

<template>
  <v-avatar :size="size" class="shrink-0">
    <v-img v-if="src && !failed" :src="src" :alt="name" cover @error="failed = true" />
    <span v-else class="flex h-full w-full items-center justify-center font-semibold text-white" :style="fallbackStyle">
      {{ initials }}
    </span>
  </v-avatar>
</template>