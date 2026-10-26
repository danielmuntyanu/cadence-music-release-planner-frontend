<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/PageContainer.vue'
import ReleaseHeader from '@/components/releases/ReleaseHeader.vue'
import ReleaseDeleteDialog from '@/components/releases/ReleaseDeleteDialog.vue'
import { releaseService } from '@/services/release.service'
import { getReleasePhase } from '@/constants/release-phases'

const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()

const releaseId = computed(() => Number(props.id))
const release = ref(null)
const notFound = ref(false)
const failed = ref(false)
const phaseSaving = ref(false)
const deleteOpen = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const tabs = computed(() => [
  { to: { name: 'release-detail', params: { id: props.id } }, label: 'Overview', icon: 'mdi-text-box-outline', exact: true },
  { to: { name: 'release-tracklist', params: { id: props.id } }, label: 'Tracklist', icon: 'mdi-playlist-music' },
])

// Moving between releases quickly: only the latest response may win
let latestRequest = 0

async function load() {
  const requestId = ++latestRequest
  release.value = null
  notFound.value = false
  failed.value = false
  try {
    const data = await releaseService.getById(releaseId.value)
    if (requestId === latestRequest) release.value = data
  } catch (e) {
    if (requestId !== latestRequest) return
    // The API hides other users' releases, so 403 and 404 both mean "not yours / not there"
    if ([403, 404].includes(e.response?.status)) {
      notFound.value = true
    } else {
      failed.value = true
      console.error('### releases/getById failed:\n', e)
    }
  }
}

watch(releaseId, load, { immediate: true })

function notify(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

/** Tabs report saved changes here, so the header and every tab show the same release */
function onUpdated(updated) {
  release.value = updated
}

async function onChangePhase(phase) {
  phaseSaving.value = true
  try {
    release.value = await releaseService.updatePhase(releaseId.value, phase)
    notify(`Moved to ${getReleasePhase(phase).label}`)
  } catch (e) {
    console.error('### releases/updatePhase failed:\n', e)
    notify('Could not change the phase. Try again.', 'error')
  } finally {
    phaseSaving.value = false
  }
}

function onDeleted() {
  router.replace({ name: 'releases' })
}
</script>

<template>
  <PageContainer>
    <v-btn :to="{ name: 'releases' }" variant="text" prepend-icon="mdi-arrow-left" class="mb-4 -ms-3">
      Releases
    </v-btn>

    <!-- Not found -->
    <v-card v-if="notFound" border flat class="px-6 py-16 text-center">
      <v-icon icon="mdi-album" size="48" class="mb-3 text-on-surface-variant" />
      <h1 class="mb-2 text-xl font-medium text-on-surface">Release not found</h1>
      <p class="mb-6 text-on-surface-variant">It may have been deleted, or the link is wrong.</p>
      <v-btn color="primary" :to="{ name: 'releases' }">Back to releases</v-btn>
    </v-card>

    <!-- Error -->
    <v-alert
      v-else-if="failed"
      type="error"
      variant="tonal"
      title="Could not load the release"
      text="Check your connection and try again."
    >
      <template #append>
        <v-btn variant="text" @click="load">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Loading -->
    <div v-else-if="!release" class="flex flex-col gap-4">
      <v-skeleton-loader type="list-item-avatar-three-line" class="rounded-lg" />
      <v-skeleton-loader type="paragraph" class="rounded-lg" />
    </div>

    <!-- Content -->
    <template v-else>
      <ReleaseHeader
        :release="release"
        :phase-saving="phaseSaving"
        @change-phase="onChangePhase"
        @delete="deleteOpen = true"
      />

      <v-tabs color="primary" show-arrows class="mt-6">
        <v-tab v-for="tab in tabs" :key="tab.label" :to="tab.to" :exact="tab.exact" :prepend-icon="tab.icon">
          {{ tab.label }}
        </v-tab>
      </v-tabs>
      <v-divider class="mb-6" />

      <RouterView v-slot="{ Component }">
        <component :is="Component" :release="release" @updated="onUpdated" />
      </RouterView>
    </template>

    <ReleaseDeleteDialog v-model="deleteOpen" :release="release" @deleted="onDeleted" />
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">{{ snackbar.text }}</v-snackbar>
  </PageContainer>
</template>