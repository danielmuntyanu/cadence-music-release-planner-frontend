<script setup>
import LandingSection from '@/components/landing/LandingSection.vue'

const chaos = [
  {
    title: 'Spreadsheets with broken dates',
    text: 'One delayed master breaks every PR blast and submission deadline downstream.',
  },
  {
    title: 'Missed pitch windows',
    text: 'Submitting to playlist editors too late means missing editorial curation entirely.',
  },
  {
    title: 'Lost WAV stems',
    text: 'Final masters buried in expired links, chat threads and scattered drive folders.',
  },
  {
    title: 'Artwork rejected on release day',
    text: 'Wrong dimensions or color profile are discovered when aggregators already enforce specs.',
  },
]

const cadence = [
  {
    title: 'Automated milestone offsets',
    text: 'Enter your global drop date once; every delivery gate is calculated backwards from it.',
  },
  {
    title: 'Pitch-window countdown',
    text: 'Visible deadlines for the editorial pitch, locked as soon as the window closes.',
  },
  {
    title: 'One central asset vault',
    text: 'Final WAVs, instrumentals, lyrics and press files live in one place per release.',
  },
  {
    title: 'Pre-flight spec checks',
    text: 'Artwork dimensions and audio specs are checked before you submit to a distributor.',
  },
]
</script>

<template>
  <LandingSection
    band
    eyebrow="Why Cadence"
    title="Built for Musicians, Not Accountants."
    subtitle="General project tools don't understand pitch windows, ISRC codes or mastering revisions. Cadence is built around release timelines from the ground up."
    size="lg"
  >
    <div class="grid gap-6 md:grid-cols-2">
      <v-card border flat>
        <v-card-text class="p-5 sm:p-6">
          <h3 class="mb-5 flex items-center gap-2 text-lg font-medium text-on-surface">
            <v-icon icon="mdi-close-circle-outline" class="text-error" />
            The chaotic way
          </h3>
          <ul class="flex flex-col gap-4">
            <li v-for="item in chaos" :key="item.title" class="flex gap-3">
              <v-icon icon="mdi-close" size="18" class="mt-0.5 shrink-0 text-error" />
              <p class="text-sm text-on-surface-variant">
                <strong class="font-medium text-on-surface">{{ item.title }}.</strong>
                {{ item.text }}
              </p>
            </li>
          </ul>
          <p class="mt-6 rounded-lg bg-error-container/50 px-3 py-2 text-xs text-error">
            Result: postponed drops, lost momentum and exhausted creators.
          </p>
        </v-card-text>
      </v-card>

      <v-card border flat class="border-primary">
        <v-card-text class="p-5 sm:p-6">
          <h3 class="mb-5 flex items-center gap-2 text-lg font-medium text-on-surface">
            <v-icon icon="mdi-check-circle-outline" class="text-primary-accent" />
            The Cadence way
          </h3>
          <ul class="flex flex-col gap-4">
            <li v-for="item in cadence" :key="item.title" class="flex gap-3">
              <v-icon icon="mdi-check" size="18" class="mt-0.5 shrink-0 text-success" />
              <p class="text-sm text-on-surface-variant">
                <strong class="font-medium text-on-surface">{{ item.title }}.</strong>
                {{ item.text }}
              </p>
            </li>
          </ul>
          <p class="mt-6 rounded-lg bg-success-container/50 px-3 py-2 text-xs text-success">
            Result: no missed drops, maximum editorial reach and peace of mind.
          </p>
        </v-card-text>
      </v-card>
    </div>
  </LandingSection>
</template>