<script setup>
import { computed } from 'vue'

const props = defineProps({
  percent: { type: Number, required: true },
  done: { type: Number, required: true },
  total: { type: Number, required: true },
})

const label = computed(() => (props.total ? `${props.done} of ${props.total} songs done` : 'No songs yet'))
const complete = computed(() => props.total > 0 && props.percent === 100)
</script>

<template>
  <div>
    <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
      <span class="text-on-surface-variant">{{ label }}</span>
      <span v-if="total" class="font-medium tabular-nums" :class="complete ? 'text-success' : 'text-on-surface'">
        {{ percent }}%
      </span>
    </div>
    <v-progress-linear
      :model-value="percent"
      :color="complete ? 'success' : 'primary'"
      bg-opacity="0.15"
      height="6"
      rounded
      :aria-label="`Release progress: ${percent}%`"
    />
  </div>
</template>