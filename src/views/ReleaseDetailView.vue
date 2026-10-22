<script setup>
import { ref, watch } from 'vue'
import PageContainer from '@/components/PageContainer.vue'
import { releaseService } from '@/services/release.service'

const props = defineProps({
  id: { type: String, required: true },
})

const release = ref(null)
const failed = ref(false)

watch(() => props.id, async (id) => {
  release.value = null
  failed.value = false
  try {
    release.value = await releaseService.getById(Number(id))
  } catch (e) {
    failed.value = true
    console.error('### releases/getById failed:\n', e)
  }
}, { immediate: true })
</script>

<template>
  <PageContainer>
    <v-btn :to="{ name: 'releases' }" variant="text" prepend-icon="mdi-arrow-left" class="mb-4 -ms-3">Releases</v-btn>
    <v-alert v-if="failed" type="error" variant="tonal" text="Could not load the release." />
    <v-skeleton-loader v-else-if="!release" type="heading, paragraph" />
    <h1 v-else class="text-2xl font-medium text-on-surface">{{ release.name }}</h1>
  </PageContainer>
</template>