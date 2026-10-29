<script setup>
import PageContainer from '@/components/PageContainer.vue'
import LandingHeroPreview from '@/components/landing/LandingHeroPreview.vue'
import { useLandingCta } from '@/composables/useLandingCta'

const cta = useLandingCta()

const highlights = [
  "Private storage for masters and artwork",
  'Progress from writing to mastering',
  'Free during beta',
]
</script>

<template>
  <section>
    <PageContainer :texture="false" :padded="false">
      <div class="pb-16 pt-14 md:pb-24 md:pt-20">
        <div class="mx-auto max-w-3xl text-center">
          <v-chip
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-rocket-launch-outline"
            class="mb-6"
          >
            MVP · The release workspace for independent musicians
          </v-chip>

          <h1 class="text-4xl font-medium leading-tight text-on-surface md:text-6xl">
            Every Release, Every Track, Every File. In One Place.
          </h1>

          <p class="mx-auto mt-6 max-w-2xl text-lg text-on-surface-variant">
            Cadence keeps your artists, releases, tracklists, audio versions 
            and artwork together, so you always know what’s ready, what’s 
            missing and which mix is the final one.
          </p>

          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <v-btn
              color="primary"
              size="x-large"
              :to="cta.to"
              :text="cta.text"
              append-icon="mdi-lightning-bolt"
            />
            <v-btn
              variant="outlined"
              size="x-large"
              :to="{ hash: '#features' }"
              :active="false"
              text="See how it works"
              prepend-icon="mdi-play-circle-outline"
            />
          </div>

          <ul
            class="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-on-surface-variant"
          >
            <li v-for="item in highlights" :key="item" class="flex items-center gap-1.5">
              <v-icon icon="mdi-check-circle-outline" size="16" class="text-success" />
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="mt-12 md:mt-16">
          <LandingHeroPreview />
        </div>
      </div>
    </PageContainer>
  </section>
</template>