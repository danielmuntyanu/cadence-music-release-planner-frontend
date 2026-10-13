<script setup>
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import LandingSection from '@/components/landing/LandingSection.vue'

const theme = useTheme()

// Reflects the resolved theme, so it is also correct when the theme follows the system
const mode = computed(() => (theme.current.value.dark ? 'dark' : 'light'))

function setMode(value) {
  if (value) theme.change(value)
}

const platforms = [
  { name: 'Platform A', note: 'Pitch sent', icon: 'mdi-check-circle-outline' },
  { name: 'Platform B', note: 'Metadata ready', icon: 'mdi-check-circle-outline' },
  { name: 'Platform C', note: 'Audio validated', icon: 'mdi-check-circle-outline' },
  { name: 'Platform D', note: 'Pre-save pending', icon: 'mdi-clock-outline' },
]

const tracks = [
  { no: '01', title: 'Echoes in Neon (Single Cut)', bpm: '124 BPM · F Minor', lufs: '-13.8 LUFS', status: 'Locked' },
  { no: '02', title: 'Midnight Pulse (Lead Focus)', bpm: '128 BPM · A Minor', lufs: '-14.1 LUFS', status: 'Pitched' },
  { no: '03', title: 'Velvet Frequency (Extended)', bpm: '122 BPM · C Minor', lufs: '-14.0 LUFS', status: 'In review' },
]

const statusColor = { Locked: 'success', Pitched: 'primary', 'In review': 'warning' }
</script>

<template>
  <LandingSection
    eyebrow="Ergonomics"
    title="Made for 2 AM Studio Sessions and Daylight Commutes"
    subtitle="Switch between a high-contrast dark theme for dim rooms and a soft light theme for the daytime. Try it right here."
    size="lg"
  >
    <div class="mb-6 flex justify-center">
      <v-btn-toggle
        :model-value="mode"
        mandatory
        divided
        variant="outlined"
        density="comfortable"
        aria-label="Theme"
        @update:model-value="setMode"
      >
        <v-btn value="dark" prepend-icon="mdi-weather-night" text="Studio Dark" />
        <v-btn value="light" prepend-icon="mdi-white-balance-sunny" text="Daylight Studio" />
      </v-btn-toggle>
    </div>

    <v-card border flat>
      <v-card-text class="p-4 sm:p-6">
        <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="flex items-center gap-2 text-lg font-medium text-on-surface">
            <v-icon icon="mdi-monitor-dashboard" class="text-primary-accent" />
            Release canvas
          </h3>
          <v-chip size="small" variant="tonal" color="success" prepend-icon="mdi-waveform">
            Lossless audio · 24-bit / 48 kHz
          </v-chip>
        </div>

        <ul class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li
            v-for="platform in platforms"
            :key="platform.name"
            class="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-low p-3"
          >
            <v-icon
              :icon="platform.icon"
              :class="platform.icon === 'mdi-clock-outline' ? 'text-on-surface-muted' : 'text-success'"
            />
            <div>
              <p class="text-sm font-medium text-on-surface">{{ platform.name }}</p>
              <p class="text-xs text-on-surface-variant">{{ platform.note }}</p>
            </div>
          </li>
        </ul>

        <div class="overflow-x-auto rounded-lg border border-border-subtle">
          <table class="w-full min-w-136 text-left text-sm">
            <thead class="bg-surface-low text-xs uppercase tracking-wider text-on-surface-muted">
              <tr>
                <th class="px-4 py-2.5 font-medium">#</th>
                <th class="px-4 py-2.5 font-medium">Track</th>
                <th class="px-4 py-2.5 font-medium">Tempo / key</th>
                <th class="px-4 py-2.5 font-medium">Loudness</th>
                <th class="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="track in tracks" :key="track.no" class="border-t border-border-subtle">
                <td class="px-4 py-3 text-on-surface-muted">{{ track.no }}</td>
                <td class="px-4 py-3 text-on-surface">{{ track.title }}</td>
                <td class="px-4 py-3 text-on-surface-variant">{{ track.bpm }}</td>
                <td class="px-4 py-3 text-on-surface-variant">{{ track.lufs }}</td>
                <td class="px-4 py-3">
                  <v-chip size="x-small" label variant="tonal" :color="statusColor[track.status]">
                    {{ track.status }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-card-text>
    </v-card>
  </LandingSection>
</template>