<script setup>
import ReleaseArtwork from './ReleaseArtwork.vue'
import ReleasePhaseMenu from './ReleasePhaseMenu.vue'
import ReleaseActionsMenu from './ReleaseActionsMenu.vue'
import { getReleaseTypeLabel } from '@/constants/release-types'
import { describeReleaseDate } from '@/utils/release-date'

defineProps({
  releases: { type: Array, required: true },
  phaseLoadingId: { type: Number, default: null },
})

defineEmits(['change-phase', 'delete'])

const detailRoute = (release) => ({ name: 'release-detail', params: { id: release.id } })
const artistNames = (release) => release.artists.map((artist) => artist.name).join(', ') || 'No artist yet'
</script>

<template>
  <v-card border flat>
    <v-list lines="two" class="py-0">
      <template v-for="(release, index) in releases" :key="release.id">
        <v-divider v-if="index > 0" />
        <v-list-item class="py-3">
          <template #prepend>
            <RouterLink
              :to="detailRoute(release)"
              class="me-4 block w-12 shrink-0 overflow-hidden rounded-lg"
              tabindex="-1"
              :aria-label="`Open ${release.name}`"
            >
              <ReleaseArtwork :src="release.artworkUrl" :name="release.name" :type="release.type" :icon-size="22" />
            </RouterLink>
          </template>

          <v-list-item-title class="font-medium">
            <RouterLink :to="detailRoute(release)" class="hover:underline focus-visible:underline">
              {{ release.name }}
            </RouterLink>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ artistNames(release) }} · {{ getReleaseTypeLabel(release.type) }} ·
            {{ describeReleaseDate(release.releaseDate).label }}
          </v-list-item-subtitle>

          <template #append>
            <div class="flex items-center gap-1">
              <ReleasePhaseMenu
                :phase="release.phase"
                :loading="release.id === phaseLoadingId"
                @change="$emit('change-phase', release, $event)"
              />
              <ReleaseActionsMenu @delete="$emit('delete', release)" />
            </div>
          </template>
        </v-list-item>
      </template>
    </v-list>
  </v-card>
</template>