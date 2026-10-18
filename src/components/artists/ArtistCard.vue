<script setup>
import { computed } from 'vue'
import ArtistAvatar from './ArtistAvatar.vue'
import { getSocialPlatformLabel } from '@/constants/social-platforms'

const props = defineProps({
  artist: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
})

const MAX_VISIBLE_SOCIALS = 3

const visibleSocials = computed(() => props.artist.socials.slice(0, MAX_VISIBLE_SOCIALS))
const hiddenSocialsCount = computed(() => Math.max(0, props.artist.socials.length - MAX_VISIBLE_SOCIALS))
</script>

<template>
  <v-card
    border
    flat
    class="h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    :class="highlighted && 'ring-2 ring-[rgb(var(--v-theme-primary))]'"
  >
    <div class="h-24">
      <v-img v-if="artist.bannerUrl" :src="artist.bannerUrl" cover class="h-full" />
      <div v-else class="artist-banner h-full" />
    </div>

    <v-card-text class="relative -mt-9 flex flex-col gap-3 p-4">
      <ArtistAvatar
        :name="artist.name"
        :src="artist.avatarUrl"
        :size="72"
        class="ring-4 ring-[rgb(var(--v-theme-surface))]"
      />

      <div class="min-w-0">
        <h3 class="truncate text-lg font-medium text-on-surface">{{ artist.name }}</h3>
        <v-chip v-if="artist.genre" size="small" color="primary" variant="tonal" class="mt-1">
          {{ artist.genre }}
        </v-chip>
        <p v-else class="mt-1 text-sm text-on-surface-variant">No genre yet</p>
      </div>

      <p class="line-clamp-2 min-h-10 text-sm text-on-surface-variant">
        {{ artist.description || 'No bio yet.' }}
      </p>

      <div v-if="artist.socials.length" class="flex flex-wrap gap-1">
        <v-chip
          v-for="social in visibleSocials"
          :key="social.url"
          :href="social.url"
          target="_blank"
          rel="noopener"
          size="x-small"
          variant="outlined"
          append-icon="mdi-arrow-top-right"
        >
          {{ getSocialPlatformLabel(social.platform) }}
        </v-chip>
        <v-chip v-if="hiddenSocialsCount" size="x-small" variant="text">+{{ hiddenSocialsCount }}</v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* Vuetify exposes theme colors as "r,g,b", so the banner follows the active theme */
.artist-banner {
  background:
    radial-gradient(circle at 15% 30%, rgba(var(--v-theme-primary), 0.45), transparent 60%),
    radial-gradient(circle at 85% 0%, rgba(var(--v-theme-secondary), 0.35), transparent 55%),
    rgba(var(--v-theme-on-surface), 0.04);
}
</style>