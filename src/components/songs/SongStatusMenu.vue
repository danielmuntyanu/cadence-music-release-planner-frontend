<script setup>
import { computed } from 'vue'
import { SONG_STATUSES, getSongStatus } from '@/constants/song-statuses'

const props = defineProps({
  status: { type: String, required: true },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])

const current = computed(() => getSongStatus(props.status))

function select(value) {
  if (value !== props.status) emit('change', value)
}
</script>

<template>
  <v-menu location="bottom end">
    <template #activator="{ props: activator }">
      <v-chip
        v-bind="activator"
        :color="current.color"
        :prepend-icon="current.icon"
        :disabled="loading"
        :aria-label="`Status: ${current.label}. Change status`"
        append-icon="mdi-chevron-down"
        size="small"
        variant="tonal"
      >
        {{ current.label }}
      </v-chip>
    </template>

    <v-list density="compact" min-width="210">
      <v-list-item
        v-for="option in SONG_STATUSES"
        :key="option.value"
        :title="option.label"
        :prepend-icon="option.icon"
        :active="option.value === status"
        :color="option.color"
        @click="select(option.value)"
      />
    </v-list>
  </v-menu>
</template>