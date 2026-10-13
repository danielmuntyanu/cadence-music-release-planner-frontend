<script setup>
import PageContainer from '@/components/PageContainer.vue'
import LandingHeroPreview from '@/components/landing/LandingHeroPreview.vue'
import { useLandingCta } from '@/composables/useLandingCta'

const cta = useLandingCta()

const highlights = [
  "Built around Spotify's 4-week pitch window",
  'Apple Music and TIDAL delivery checklists',
  'Free while in beta',
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
            MVP preview · Release planning for independent artists
          </v-chip>

          <h1 class="text-4xl font-medium leading-tight text-on-surface md:text-6xl">
            Never Miss a Drop. The Timeline-Driven Planner for Music Releases.
          </h1>

          <p class="mx-auto mt-6 max-w-2xl text-lg text-on-surface-variant">
            Ditch fragmented spreadsheets and messy DMs. Coordinate mastering deadlines, artwork
            deliverables, distribution windows and launch day in one workspace.
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