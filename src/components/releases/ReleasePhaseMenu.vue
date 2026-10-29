<script setup>
import { computed } from 'vue'
import { RELEASE_PHASES, getReleasePhase } from '@/constants/release-phases'

const props = defineProps({
  phase: { type: String, required: true },
  loading: { type: Boolean, default: false },
  // "flat" stays readable over artwork; "tonal" suits list rows
  variant: { type: String, default: 'tonal' },
})

const emit = defineEmits(['change'])

const current = computed(() => getReleasePhase(props.phase))

function select(value) {
  if (value !== props.phase) emit('change', value)
}
</script>

<template>
  <v-menu location="bottom start">
    <template #activator="{ props: activator }">
      <v-chip
        v-bind="activator"
        :color="current.color"
        :prepend-icon="current.icon"
        :variant="variant"
        :disabled="loading"
        :aria-label="`Phase: ${current.label}. Change phase`"
        append-icon="mdi-chevron-down"
        size="small"
      >
        {{ current.label }}
      </v-chip>
    </template>

    <v-list density="compact" min-width="200">
      <v-list-item
        v-for="option in RELEASE_PHASES"
        :key="option.value"
        :title="option.label"
        :prepend-icon="option.icon"
        :active="option.value === phase"
        :color="option.color"
        @click="select(option.value)"
      />
    </v-list>
  </v-menu>
</template>