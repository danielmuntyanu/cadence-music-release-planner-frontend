<script setup>
import { computed } from 'vue'
import { fromIsoDate, toIsoDate } from '@/utils/date'

/** v-date-input that works with "YYYY-MM-DD" strings, the LocalDate format of the API */
const model = defineModel({ type: String, default: null })

const date = computed({
  get: () => (model.value ? fromIsoDate(model.value) : null),
  set: (value) => { model.value = value ? toIsoDate(value) : null },
})
</script>

<template>
  <v-date-input v-model="date" prepend-icon="" clearable v-bind="$attrs" />
</template>