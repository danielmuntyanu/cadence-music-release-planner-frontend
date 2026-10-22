<script setup>
import { computed, ref, watch } from 'vue'
import { RELEASE_TYPES } from '@/constants/release-types'

const props = defineProps({
  src: { type: String, default: null },
  name: { type: String, default: '' },
  type: { type: String, default: 'SINGLE' },
  iconSize: { type: Number, default: 48 },
})

const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const icon = computed(() => RELEASE_TYPES.find((t) => t.value === props.type)?.icon ?? 'mdi-album')

// Stable hue per name, so a release without a cover keeps the same look between visits
const hue = computed(() => [...props.name].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 360, 7))

const fallbackStyle = computed(() => ({
  background: `linear-gradient(135deg, hsl(${hue.value} 60% 45%), hsl(${(hue.value + 60) % 360} 55% 25%))`,
}))
</script>

<template>
  <div class="aspect-square w-full overflow-hidden">
    <v-img v-if="src && !failed" :src="src" :alt="name" cover class="h-full w-full" @error="failed = true" />
    <div v-else class="flex h-full w-full items-center justify-center" :style="fallbackStyle">
      <v-icon :icon="icon" :size="iconSize" class="text-white/80" />
    </div>
  </div>
</template>