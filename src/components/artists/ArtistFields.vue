<script setup>
import { computed, ref } from 'vue'
import { SOCIAL_PLATFORMS } from '@/constants/social-platforms'
import { createSocialForm } from '@/models/artist'

defineProps({
  // Edit mode manages images with ImageInput instead of link fields
  withImageLinks: { type: Boolean, default: true },
})

const nameField = ref(null)

const artist = defineModel({ type: Object, required: true })

const MAX_SOCIALS = 20
const URL_PATTERN = /^https?:\/\/[^\s/$.?#][^\s]*$/i

const maxLength = (limit) => (v) => (v?.length ?? 0) <= limit || `Max ${limit} characters`

const rules = {
  name: [(v) => !!v?.trim() || 'Name is required', maxLength(50)],
  genre: [maxLength(50)],
  description: [maxLength(512)],
  url: [(v) => !v?.trim() || URL_PATTERN.test(v.trim()) || 'Enter a valid URL (https://...)', maxLength(512)],
  socialUrl: [(v) => !!v?.trim() || 'URL is required', (v) => URL_PATTERN.test(v?.trim() ?? '') || 'Enter a valid URL'],
}

const canAddSocial = computed(() => artist.value.socials.length < MAX_SOCIALS)

function addSocial() {
  const used = new Set(artist.value.socials.map((s) => s.platform))
  const platform = SOCIAL_PLATFORMS.find((p) => !used.has(p.value))?.value ?? 'OTHER'
  artist.value.socials.push(createSocialForm(platform))
}

function removeSocial(key) {
  artist.value.socials = artist.value.socials.filter((s) => s.key !== key)
}

defineExpose({
  focus: () => nameField.value?.focus(),
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-x-4 gap-y-1 sm:grid-cols-2">
      <v-text-field
        ref="nameField"
        v-model="artist.name"
        label="Name"
        :rules="rules.name"
        counter="50"
        prepend-inner-icon="mdi-account-music-outline"
        autofocus
      />
      <v-text-field
        v-model="artist.genre"
        label="Genre"
        placeholder="e.g. Synthwave"
        :rules="rules.genre"
        prepend-inner-icon="mdi-music-clef-treble"
      />
      <v-textarea
        v-model="artist.description"
        label="Short bio"
        :rules="rules.description"
        counter="512"
        rows="2"
        auto-grow
        class="sm:col-span-2"
      />
      <template v-if="withImageLinks">
        <v-text-field
          v-model="artist.avatarUrl"
          label="Avatar URL"
          type="url"
          :rules="rules.url"
          prepend-inner-icon="mdi-image-outline"
        />
        <v-text-field
          v-model="artist.bannerUrl"
          label="Banner URL"
          type="url"
          :rules="rules.url"
          prepend-inner-icon="mdi-panorama-variant-outline"
        />
      </template>
    </div>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-medium text-on-surface">Links</h3>
        <span class="text-xs text-on-surface-variant">{{ artist.socials.length }} / {{ MAX_SOCIALS }}</span>
      </div>

      <div v-for="social in artist.socials" :key="social.key" class="flex items-start gap-2">
        <div class="grid flex-1 gap-x-2 sm:grid-cols-[200px_1fr]">
          <v-select
            v-model="social.platform"
            :items="SOCIAL_PLATFORMS"
            item-title="label"
            item-value="value"
            label="Platform"
          />
          <v-text-field v-model="social.url" label="URL" type="url" :rules="rules.socialUrl" />
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="mt-2"
          :aria-label="`Remove ${social.platform} link`"
          @click="removeSocial(social.key)"
        />
      </div>

      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-link-plus"
        :disabled="!canAddSocial"
        @click="addSocial"
      >
        Add link
      </v-btn>
    </section>
  </div>
</template>