<script setup>
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import ReleaseArtwork from './ReleaseArtwork.vue'
import ReleaseArtistsPicker from './ReleaseArtistsPicker.vue'
import { GENRES } from '@/constants/genres'
import { RELEASE_TYPES } from '@/constants/release-types'
import { RELEASE_PHASES } from '@/constants/release-phases'
import { releaseService } from '@/services/release.service'
import { useSubmit } from '@/composables/useSubmit'
import { createReleaseForm, toReleaseCreateRequest } from '@/models/release'
import { fromIsoDate, toIsoDate } from '@/utils/date'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  // Prefilled fields, e.g. { artistIds: [7] } when opened from an artist
  preset: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['created'])

const { xs } = useDisplay()
const { loading, error, submit } = useSubmit({
  errorMessages: {
    400: 'Some fields are invalid. Check the form and try again.',
    404: 'One of the selected artists no longer exists.',
    409: 'You already have a release with this name.',
  },
})

const detailsForm = ref(null)
const scheduleForm = ref(null)
const nameField = ref(null)
const release = ref(createReleaseForm())
const creatorOpen = ref(false)

// Fresh form on every open, with the preset applied
watch(open, (isOpen) => {
  if (!isOpen) return
  release.value = { ...createReleaseForm(), ...props.preset }
  creatorOpen.value = false
  error.value = null
})

// Picking the current secondary genre as primary clears the secondary one
watch(() => release.value.primaryGenre, (primary) => {
  if (primary && primary === release.value.secondaryGenre) release.value.secondaryGenre = null
})

const secondaryGenres = computed(() => GENRES.filter((genre) => genre.value !== release.value.primaryGenre))

// v-date-input works with Date objects; the form and the API keep "YYYY-MM-DD"
const dateModel = (key) => computed({
  get: () => (release.value[key] ? fromIsoDate(release.value[key]) : null),
  set: (value) => { release.value[key] = value ? toIsoDate(value) : null },
})
const releaseDate = dateModel('releaseDate')
const originalReleaseDate = dateModel('originalReleaseDate')

const rules = {
  name: [(v) => !!v?.trim() || 'Name is required', (v) => (v?.length ?? 0) <= 150 || 'Max 150 characters'],
  primaryGenre: [(v) => !!v || 'Primary genre is required'],
  notes: [(v) => (v?.length ?? 0) <= 1024 || 'Max 1024 characters'],
  // ISO dates compare correctly as strings: "2025-01-01" < "2026-11-14"
  originalReleaseDate: [
    () => {
      const { originalReleaseDate: original, releaseDate: date } = release.value
      return !original || !date || original < date || 'Must be before the release date'
    },
  ],
}

async function onSubmit() {
  const results = await Promise.all([detailsForm.value.validate(), scheduleForm.value.validate()])
  if (!results.every((result) => result.valid)) return

  let created = null
  const ok = await submit(async () => {
    created = await releaseService.create(toReleaseCreateRequest(release.value))
  })

  if (ok) {
    open.value = false
    emit('created', created)
  }
}
</script>

<template>
  <v-dialog
    v-model="open"
    :fullscreen="xs"
    max-width="760"
    scrollable
    :persistent="loading"
    @after-enter="nameField?.focus()"
  >
    <v-card>
      <!-- Header with a live artwork preview -->
      <div class="flex items-center gap-4 px-4 py-4 sm:px-6">
        <div class="w-14 shrink-0 overflow-hidden rounded-lg">
          <ReleaseArtwork :name="release.name" :type="release.type" :icon-size="24" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs uppercase tracking-wider text-on-surface-variant">New release</p>
          <h2 class="truncate text-lg font-medium text-on-surface">{{ release.name.trim() || 'Untitled release' }}</h2>
        </div>
        <v-btn icon="mdi-close" variant="text" aria-label="Close" :disabled="loading" @click="open = false" />
      </div>

      <v-divider />

      <v-card-text class="flex flex-col gap-6 p-4 sm:p-6">
        <!-- 1. Basics -->
        <v-form ref="detailsForm" @submit.prevent="onSubmit">
          <v-text-field ref="nameField" v-model="release.name" label="Name" :rules="rules.name" counter="150" />

          <p class="mb-1 mt-2 text-sm text-on-surface-variant">Type</p>
          <v-chip-group v-model="release.type" mandatory filter column selected-class="text-primary">
            <v-chip v-for="type in RELEASE_TYPES" :key="type.value" :value="type.value" :prepend-icon="type.icon" variant="outlined">
              {{ type.label }}
            </v-chip>
          </v-chip-group>

          <div class="mt-4 grid gap-x-4 sm:grid-cols-2">
            <v-autocomplete
              v-model="release.primaryGenre"
              :items="GENRES"
              item-title="label"
              item-value="value"
              label="Primary genre"
              :rules="rules.primaryGenre"
            />
            <v-autocomplete
              v-model="release.secondaryGenre"
              :items="secondaryGenres"
              item-title="label"
              item-value="value"
              label="Secondary genre"
              clearable
            />
          </div>
        </v-form>

        <!-- 2. Artists: outside the release forms, the inline creator has its own form -->
        <section>
          <div class="mb-2 flex items-baseline justify-between">
            <h3 class="text-sm font-medium text-on-surface">Artists</h3>
            <span class="text-xs text-on-surface-variant">The first artist is the primary one</span>
          </div>
          <ReleaseArtistsPicker v-model="release.artistIds" v-model:creator-open="creatorOpen" />
        </section>

        <!-- 3. Plan -->
        <v-form ref="scheduleForm" @submit.prevent="onSubmit">
          <div class="grid gap-x-4 sm:grid-cols-2">
            <v-date-input v-model="releaseDate" label="Release date" prepend-icon="" prepend-inner-icon="mdi-calendar" clearable />
            <v-select
              v-model="release.phase"
              :items="RELEASE_PHASES"
              item-title="label"
              item-value="value"
              label="Phase"
              prepend-inner-icon="mdi-flag-outline"
            />
            <v-date-input
              v-model="originalReleaseDate"
              :rules="rules.originalReleaseDate"
              label="Original release date"
              hint="Only for reissues and remasters"
              persistent-hint
              prepend-icon=""
              prepend-inner-icon="mdi-history"
              clearable
              class="sm:col-span-2"
            />
          </div>
          <v-textarea v-model="release.notes" label="Notes" :rules="rules.notes" counter="1024" rows="2" auto-grow class="mt-2" />
        </v-form>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" :text="error" />
      </v-card-text>

      <v-divider />

      <v-card-actions class="flex-wrap justify-end gap-2 px-4 py-3 sm:px-6">
        <span v-if="creatorOpen" class="me-auto text-xs text-on-surface-variant">Finish or cancel the new artist first</span>
        <v-btn variant="text" :disabled="loading" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-check" :loading="loading" :disabled="creatorOpen" @click="onSubmit">
          Create release
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>