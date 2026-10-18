<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  placeholder: { type: String, default: 'No bio yet.' },
})

const paragraph = ref(null)
const expanded = ref(false)
const overflowing = ref(false)

let observer = null

// Only measured while clamped: once expanded, scrollHeight equals clientHeight
function measure() {
  const el = paragraph.value
  if (!el || expanded.value) return
  overflowing.value = el.scrollHeight > el.clientHeight + 1
}

onMounted(() => {
  observer = new ResizeObserver(measure)
  observer.observe(paragraph.value)
})

onBeforeUnmount(() => observer?.disconnect())

watch(() => props.text, async () => {
  expanded.value = false
  await nextTick()
  measure()
})
</script>

<template>
  <div class="relative min-h-10">
    <p
      ref="paragraph"
      class="break-words text-sm text-on-surface-variant"
      :class="expanded ? 'whitespace-pre-line' : 'line-clamp-2'"
    >
      {{ text || placeholder }}
      <!-- Reserves room on the last line so the toggle never covers text -->
      <span v-if="expanded" class="inline-block w-7" />
    </p>

    <v-btn
      v-if="overflowing"
      icon
      size="x-small"
      variant="text"
      density="comfortable"
      class="absolute bottom-0 right-0"
      :class="!expanded && 'bio-fade'"
      :aria-expanded="expanded"
      :aria-label="expanded ? 'Show less' : 'Show full bio'"
      @click="expanded = !expanded"
    >
      <v-icon
        icon="mdi-chevron-left"
        class="transition-transform duration-200"
        :class="expanded && '-rotate-90'"
      />
    </v-btn>
  </div>
</template>

<style scoped>
/* Fades the end of the last visible line under the toggle */
.bio-fade {
  padding-inline-start: 24px;
  border-radius: 0;
  background: linear-gradient(to right, transparent, rgb(var(--v-theme-surface)) 40%);
}
</style>