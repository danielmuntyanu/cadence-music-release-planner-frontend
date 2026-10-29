<script setup>
import { ref } from 'vue'
import { ICONS } from '@/constants/icons'
import { startDownload } from '@/utils/download'

// Classes and other attributes go to the button, not to the tooltip wrapper
defineOptions({ inheritAttrs: false })

const props = defineProps({
  // Called on click: download links live five minutes, so one is fetched only when needed.
  // Resolves to { url, external? }
  getLink: { type: Function, required: true },
  label: { type: String, default: 'Download' },
  size: { type: String, default: 'x-small' },
  // Plain icon in lists and rows; "elevated" next to other round buttons, e.g. on the cover
  variant: { type: String, default: 'text' },
  density: { type: String, default: 'comfortable' },
})

const emit = defineEmits(['error'])

const loading = ref(false)

async function download() {
  if (loading.value) return
  loading.value = true
  try {
    const link = await props.getLink()
    startDownload(link.url, { newTab: link.external === true })
  } catch (e) {
    console.error('### download failed:\n', e)
    emit('error', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-tooltip :text="label" location="top">
    <template #activator="{ props: tooltip }">
      <v-btn
        v-bind="{ ...tooltip, ...$attrs }"
        :icon="ICONS.DOWNLOAD"
        :size="size"
        :variant="variant"
        :density="density"
        :loading="loading"
        :aria-label="label"
        @click.stop="download"
      />
    </template>
  </v-tooltip>
</template>