<script setup>
import LandingSection from '@/components/landing/LandingSection.vue'

// Placeholder copy: replace with real feedback once beta users have given it
const quotes = [
  {
    text: 'Having every deadline counted back from the release date removed the guesswork from our rollout.',
    role: 'Independent artist',
  },
  {
    text: 'The calendar view makes it obvious when two releases are about to compete for the same week.',
    role: 'Label manager',
  },
  {
    text: 'Stems, artwork and split sheets in one place means nobody asks "where is the final master?" anymore.',
    role: 'Producer',
  },
]
</script>

<template>
  <LandingSection
    eyebrow="Early feedback"
    title="Built with Artists and Labels in Mind"
    subtitle="Sample quotes shown as placeholder content until beta feedback is collected."
    size="lg"
  >
    <div class="grid gap-6 md:grid-cols-3">
      <v-card v-for="quote in quotes" :key="quote.role" border flat>
        <v-card-text class="flex h-full flex-col gap-4 p-5 sm:p-6">
          <v-rating
            :model-value="5"
            readonly
            density="compact"
            size="small"
            color="primary-accent"
            active-color="primary-accent"
            aria-label="5 out of 5 stars"
          />
          <blockquote class="flex-1 text-sm text-on-surface-variant">"{{ quote.text }}"</blockquote>
          <div class="flex items-center gap-3">
            <v-avatar size="36" color="primary-container">
              <v-icon icon="mdi-account" class="text-primary-accent" />
            </v-avatar>
            <span class="text-sm font-medium text-on-surface">{{ quote.role }}</span>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </LandingSection>
</template>