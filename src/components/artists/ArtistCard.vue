<script setup>
import { computed } from 'vue'
import ArtistAvatar from './ArtistAvatar.vue'
import ArtistActionsMenu from './ArtistActionsMenu.vue'
import { getSocialPlatformLabel } from '@/constants/social-platforms'
import { pluralize } from '@/utils/format'
import ArtistBanner from './ArtistBanner.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'

const props = defineProps({
  artist: { type: Object, required: true },
  highlighted: { type: Boolean, default: false },
})

defineEmits(['edit', 'delete', 'create-release'])

const MAX_VISIBLE_SOCIALS = 3

const detailRoute = computed(() => ({ name: 'artist-detail', params: { id: props.artist.id } }))
const releasesRoute = computed(() => ({ name: 'releases', query: { artistId: String(props.artist.id) } }))
const visibleSocials = computed(() => props.artist.socials.slice(0, MAX_VISIBLE_SOCIALS))
const hiddenSocialsCount = computed(() => Math.max(0, props.artist.socials.length - MAX_VISIBLE_SOCIALS))
</script>

<template>
  <v-card
    border
    flat
    class="relative overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    :class="highlighted && 'ring-2 ring-[rgb(var(--v-theme-primary))]'"
  >
    <RouterLink :to="detailRoute" class="block h-24" tabindex="-1" :aria-label="`Open ${artist.name}`">
      <ArtistBanner :src="artist.bannerUrl" />
    </RouterLink>

    <div class="absolute right-2 top-2">
      <ArtistActionsMenu floating @edit="$emit('edit', artist)" @delete="$emit('delete', artist)" />
    </div>

    <v-card-text class="relative -mt-9 flex flex-col gap-3 p-4">
      <RouterLink :to="detailRoute" class="self-start rounded-full" tabindex="-1" :aria-label="`Open ${artist.name}`">
        <ArtistAvatar
          :name="artist.name"
          :src="artist.avatarUrl"
          :size="72"
          class="ring-4 ring-[rgb(var(--v-theme-surface))]"
        />
      </RouterLink>

      <div class="min-w-0">
        <h3 class="truncate text-lg font-medium">
          <RouterLink :to="detailRoute" class="text-on-surface hover:underline focus-visible:underline">
            {{ artist.name }}
          </RouterLink>
        </h3>
        <v-chip v-if="artist.genre" size="small" color="primary" variant="tonal" class="mt-1">
          {{ artist.genre }}
        </v-chip>
        <p v-else class="mt-1 text-sm text-on-surface-variant">No genre yet</p>
      </div>

      <ExpandableText
        :text="artist.description"
        :lines="2"
        placeholder="No bio yet."
        class="min-h-10 text-sm text-on-surface-variant"
      />

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

    <v-divider />

    <div class="flex items-center gap-2 px-4 py-3 text-sm text-on-surface-variant">
      <v-icon icon="mdi-album" size="18" />
      <RouterLink
        v-if="artist.releaseCount > 0"
        :to="releasesRoute"
        class="hover:text-on-surface hover:underline focus-visible:underline"
      >
        {{ pluralize(artist.releaseCount, 'release') }}
      </RouterLink>
      <span v-else>{{ pluralize(artist.releaseCount, 'release') }}</span>
      <v-spacer />
      <v-btn
        icon="mdi-plus"
        size="x-small"
        variant="tonal"
        :aria-label="`New release with ${artist.name}`"
        @click="$emit('create-release', artist)"
      />
    </div>
  </v-card>
</template>