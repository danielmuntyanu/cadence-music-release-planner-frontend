<script setup>
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  // What is being copied, for screen readers: "Copy ISRC"
  label: { type: String, default: 'Copy' },
})

const emit = defineEmits(['copied'])

const COPIED_MS = 1500

const copied = ref(false)
let timer = null

async function copy() {
  try {
    // Requires a secure context (HTTPS or localhost)
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    emit('copied')
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = false }, COPIED_MS)
  } catch (e) {
    console.error('### clipboard write failed:\n', e)
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <v-btn
    :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
    :color="copied ? 'success' : undefined"
    :aria-label="copied ? 'Copied' : label"
    size="x-small"
    variant="text"
    density="comfortable"
    @click.stop="copy"
  >
    <v-icon :icon="copied ? 'mdi-check' : 'mdi-content-copy'" size="16" />
    <v-tooltip activator="parent" location="top">{{ copied ? 'Copied' : label }}</v-tooltip>
  </v-btn>
</template>