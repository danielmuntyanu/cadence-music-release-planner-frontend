<script setup>
const stats = [
  { label: 'Tracks', value: 8 },
  { label: 'Videos', value: 2 },
  { label: 'Pending', value: 12 },
]

const milestones = [
  { name: 'Recording', status: 'Done', detail: '8 of 8 tracks tracked', state: 'done' },
  { name: 'Mastering', status: 'Done', detail: 'Final WAVs approved', state: 'done' },
  { name: 'Artwork', status: 'Approved', detail: '3000×3000 px, sRGB', state: 'done' },
  { name: 'DSP pitching', status: 'Active', detail: '3 days left in window', state: 'active' },
  { name: 'Release day', status: 'Scheduled', detail: 'Oct 24', state: 'upcoming' },
]

const stateStyle = {
  done: { icon: 'mdi-check-circle', color: 'text-success' },
  active: { icon: 'mdi-progress-clock', color: 'text-primary-accent' },
  upcoming: { icon: 'mdi-circle-outline', color: 'text-on-surface-muted' },
}
</script>

<template>
  <figure aria-label="Release dashboard preview" class="mx-auto max-w-5xl">
    <v-card border flat class="overflow-hidden">
      <div class="flex items-center gap-3 border-b border-border-subtle bg-surface-low px-4 py-2.5">
        <div class="flex gap-1.5" aria-hidden="true">
          <span class="size-2.5 rounded-full bg-surface-bright" />
          <span class="size-2.5 rounded-full bg-surface-bright" />
          <span class="size-2.5 rounded-full bg-surface-bright" />
        </div>
        <span
          class="min-w-0 flex-1 truncate rounded-md bg-surface-lowest px-3 py-1 text-xs text-on-surface-muted"
        >
          cadence.app/releases/neon-velvet
        </span>
        <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">
          Lead time OK
        </v-chip>
      </div>

      <v-card-text class="p-4 text-left sm:p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <v-avatar size="56" rounded="lg" color="primary-container">
              <v-icon icon="mdi-album" size="30" class="text-primary-accent" />
            </v-avatar>
            <div>
              <p class="text-lg font-medium text-on-surface">Neon Velvet — 4th Studio Album</p>
              <p class="text-sm text-on-surface-variant">Target date: Oct 24 · 72% ready</p>
            </div>
          </div>

          <dl class="flex gap-6">
            <div v-for="stat in stats" :key="stat.label">
              <dt class="text-xs uppercase tracking-wider text-on-surface-muted">{{ stat.label }}</dt>
              <dd class="text-xl font-medium text-on-surface">{{ stat.value }}</dd>
            </div>
          </dl>
        </div>

        <v-progress-linear
          :model-value="72"
          color="primary"
          bg-color="surface-light"
          height="6"
          rounded
          class="my-6"
          aria-label="Release readiness"
        />

        <ol class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <li
            v-for="step in milestones"
            :key="step.name"
            class="rounded-lg border p-3"
            :class="
              step.state === 'active'
                ? 'border-primary bg-primary-container/40'
                : 'border-border-subtle bg-surface-low'
            "
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-on-surface">{{ step.name }}</span>
              <v-icon :icon="stateStyle[step.state].icon" size="18" :class="stateStyle[step.state].color" />
            </div>
            <p class="mt-1 text-xs font-medium uppercase tracking-wider" :class="stateStyle[step.state].color">
              {{ step.status }}
            </p>
            <p class="mt-1 text-xs text-on-surface-variant">{{ step.detail }}</p>
          </li>
        </ol>
      </v-card-text>
    </v-card>
  </figure>
</template>