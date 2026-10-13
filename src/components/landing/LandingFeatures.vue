<script setup>
import LandingFeatureCard from '@/components/landing/LandingFeatureCard.vue'
import LandingSection from '@/components/landing/LandingSection.vue'

const kanban = [
  { column: 'In progress', card: 'Master v3', color: 'primary' },
  { column: 'Review', card: 'Canvas loop', color: 'warning' },
  { column: 'Done', card: 'Lyric sheet', color: 'success' },
]

const releases = [
  { name: 'Single 1 — "Solitude"', when: 'in 14 days' },
  { name: 'Remix EP — "Club Edit"', when: 'in 34 days' },
  { name: 'Full LP — "Neon Velvet"', when: 'in 42 days' },
]

const assets = [
  { name: 'Artwork', spec: '3000×3000 px', ok: true },
  { name: 'Master WAV', spec: '24-bit / 48 kHz', ok: true },
  { name: 'Split sheet', spec: '100% locked', ok: true },
]
</script>

<template>
  <LandingSection
    id="features"
    eyebrow="Precision tools"
    title="Engineered for the Modern Music Release Cycle"
    subtitle="Every tool is built around studio workflows: from mastering checklists to multi-platform distribution gates."
    size="lg"
  >
    <div class="grid gap-6 md:grid-cols-2">
      <LandingFeatureCard
        icon="mdi-chart-timeline-variant"
        tag="Timeline engine"
        title="Smart release timeline and lead times"
        description="Set the target date and get a backwards schedule that respects pitch windows and delivery deadlines."
      >
        <div class="mb-2 flex justify-between text-on-surface-variant">
          <span>Editorial pitch window</span>
          <span class="text-success">28 days prior</span>
        </div>
        <v-progress-linear
          :model-value="70"
          color="success"
          bg-color="surface-light"
          height="6"
          rounded
          aria-label="Pitch window"
        />
      </LandingFeatureCard>

      <LandingFeatureCard
        icon="mdi-view-column-outline"
        tag="Workflow board"
        title="Phase-scoped Kanban board"
        description="Group release tasks by phase: mastering, visuals, pre-save, promo and delivery, with assignees and file attachments."
      >
        <div class="grid grid-cols-3 gap-2">
          <div v-for="item in kanban" :key="item.column">
            <p class="mb-1 text-[10px] uppercase tracking-wider text-on-surface-muted">
              {{ item.column }}
            </p>
            <v-chip size="x-small" label :color="item.color" variant="tonal">{{ item.card }}</v-chip>
          </div>
        </div>
      </LandingFeatureCard>

      <LandingFeatureCard
        icon="mdi-calendar-month-outline"
        tag="Calendar"
        title="Unified multi-release calendar"
        description="See overlapping releases in one view and spot cannibalization before it costs you streams."
      >
        <ul class="flex flex-col gap-2">
          <li v-for="release in releases" :key="release.name" class="flex justify-between gap-3">
            <span class="truncate text-on-surface">{{ release.name }}</span>
            <span class="shrink-0 text-primary-accent">{{ release.when }}</span>
          </li>
        </ul>
      </LandingFeatureCard>

      <LandingFeatureCard
        icon="mdi-folder-music-outline"
        tag="Asset vault"
        title="Asset and stem approval hub"
        description="Keep artwork, masters and split sheets together, with specs verified before the delivery deadline."
      >
        <ul class="flex flex-col gap-2">
          <li v-for="asset in assets" :key="asset.name" class="flex items-center justify-between gap-3">
            <span class="text-on-surface">{{ asset.name }}</span>
            <span class="flex items-center gap-1 text-success">
              {{ asset.spec }}
              <v-icon icon="mdi-check" size="14" />
            </span>
          </li>
        </ul>
      </LandingFeatureCard>
    </div>
  </LandingSection>
</template>