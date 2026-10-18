<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/PageContainer.vue'
import ArtistAvatar from '@/components/artists/ArtistAvatar.vue'
import ArtistEditDialog from '@/components/artists/ArtistEditDialog.vue'
import ArtistDeleteDialog from '@/components/artists/ArtistDeleteDialog.vue'
import { useArtistsStore } from '@/stores/artists'
import { getSocialPlatformLabel } from '@/constants/social-platforms'
import { pluralize } from '@/utils/format'

const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()
const artistsStore = useArtistsStore()

const artistId = computed(() => Number(props.id))
const artist = computed(() => artistsStore.findById(artistId.value))

const notFound = ref(false)
const failed = ref(false)
const editOpen = ref(false)
const deleteOpen = ref(false)
const snackbar = ref(false)

const displayUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

async function ensureArtist() {
  notFound.value = false
  failed.value = false
  if (artist.value) return

  try {
    await artistsStore.fetchById(artistId.value)
  } catch (e) {
    // The API hides other users' artists, so 403 and 404 both mean "not yours / not there"
    if ([403, 404].includes(e.response?.status)) {
      notFound.value = true
    } else {
      failed.value = true
      console.error('### artists/getById failed:\n', e)
    }
  }
}

watch(artistId, ensureArtist, { immediate: true })

function onDeleted() {
  router.replace({ name: 'artists' })
}
</script>

<template>
  <PageContainer>
    <v-btn :to="{ name: 'artists' }" variant="text" prepend-icon="mdi-arrow-left" class="mb-4 -ms-3">
      Artists
    </v-btn>

    <!-- Not found -->
    <v-card v-if="notFound" border flat class="px-6 py-16 text-center">
      <v-icon icon="mdi-account-question-outline" size="48" class="mb-3 text-on-surface-variant" />
      <h1 class="mb-2 text-xl font-medium text-on-surface">Artist not found</h1>
      <p class="mb-6 text-on-surface-variant">It may have been deleted, or the link is wrong.</p>
      <v-btn color="primary" :to="{ name: 'artists' }">Back to artists</v-btn>
    </v-card>

    <!-- Error -->
    <v-alert
      v-else-if="failed"
      type="error"
      variant="tonal"
      title="Could not load the artist"
      text="Check your connection and try again."
    >
      <template #append>
        <v-btn variant="text" @click="ensureArtist">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Loading -->
    <div v-else-if="!artist" class="flex flex-col gap-4">
      <v-skeleton-loader type="image" class="rounded-lg" />
      <v-skeleton-loader type="list-item-avatar-three-line" class="rounded-lg" />
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-6">
      <v-card border flat class="overflow-hidden">
        <div class="h-40 sm:h-56">
          <v-img v-if="artist.bannerUrl" :src="artist.bannerUrl" cover class="h-full" />
          <div v-else class="artist-banner h-full" />
        </div>

        <div class="relative -mt-14 flex flex-col gap-4 px-4 pb-6 sm:flex-row sm:items-end sm:px-6">
          <ArtistAvatar
            :name="artist.name"
            :src="artist.avatarUrl"
            :size="112"
            class="ring-4 ring-[rgb(var(--v-theme-surface))]"
          />

          <div class="min-w-0 flex-1">
            <h1 class="break-words text-2xl font-medium text-on-surface sm:text-3xl">{{ artist.name }}</h1>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <v-chip v-if="artist.genre" size="small" color="primary" variant="tonal">{{ artist.genre }}</v-chip>
              <span class="flex items-center gap-1 text-sm text-on-surface-variant">
                <v-icon icon="mdi-album" size="18" />
                {{ pluralize(artist.releaseCount, 'release') }}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <v-btn variant="tonal" prepend-icon="mdi-pencil-outline" @click="editOpen = true">Edit</v-btn>
            <v-btn variant="text" color="error" prepend-icon="mdi-delete-outline" @click="deleteOpen = true">
              Delete
            </v-btn>
          </div>
        </div>
      </v-card>

      <div class="grid items-start gap-6 lg:grid-cols-3">
        <v-card border flat class="lg:col-span-2">
          <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Releases</v-card-title>
          <v-card-text class="flex flex-col items-center px-4 py-12 text-center sm:px-6">
            <v-icon icon="mdi-album" size="40" class="mb-3 text-on-surface-variant" />
            <p class="text-on-surface-variant">Releases assigned to {{ artist.name }} will appear here.</p>
          </v-card-text>
        </v-card>

        <div class="flex flex-col gap-6">
          <v-card border flat>
            <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">About</v-card-title>
            <v-card-text class="px-4 pb-4 sm:px-6">
              <p class="whitespace-pre-line break-words text-on-surface-variant">
                {{ artist.description || 'No bio yet.' }}
              </p>
            </v-card-text>
          </v-card>

          <v-card v-if="artist.socials.length" border flat>
            <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Links</v-card-title>
            <v-list density="compact" class="pb-2">
              <v-list-item
                v-for="social in artist.socials"
                :key="social.url"
                :href="social.url"
                target="_blank"
                rel="noopener"
                append-icon="mdi-arrow-top-right"
                class="px-4 sm:px-6"
              >
                <v-list-item-title>{{ getSocialPlatformLabel(social.platform) }}</v-list-item-title>
                <v-list-item-subtitle class="truncate">{{ displayUrl(social.url) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </div>
      </div>
    </div>

    <ArtistEditDialog v-model="editOpen" :artist="artist" @updated="snackbar = true" />
    <ArtistDeleteDialog v-model="deleteOpen" :artist="artist" @deleted="onDeleted" />
    <v-snackbar v-model="snackbar" color="success" timeout="2500">Changes saved</v-snackbar>
  </PageContainer>
</template>

<style scoped>
.artist-banner {
  background:
    radial-gradient(circle at 15% 30%, rgba(var(--v-theme-primary), 0.45), transparent 60%),
    radial-gradient(circle at 85% 0%, rgba(var(--v-theme-secondary), 0.35), transparent 55%),
    rgba(var(--v-theme-on-surface), 0.04);
}
</style>