<script setup>
import { computed, ref } from 'vue'
import ArtistAvatar from '@/components/artists/ArtistAvatar.vue'
import EditableField from '@/components/common/EditableField.vue'
import ExpandableText from '@/components/common/ExpandableText.vue'
import IsoDateInput from '@/components/common/IsoDateInput.vue'
import ReleaseArtistsPicker from '@/components/releases/ReleaseArtistsPicker.vue'
import { provideInlineEditGroup } from '@/composables/useInlineEdit'
import { RELEASE_TYPES, getReleaseTypeLabel } from '@/constants/release-types'
import { getReleasePhase } from '@/constants/release-phases'
import { GENRES, getGenreLabel } from '@/constants/genres'
import { releaseService } from '@/services/release.service'
import { formatIsoDate } from '@/utils/date'

const props = defineProps({
  release: { type: Object, required: true },
})

const emit = defineEmits(['updated'])

// Only one field on this tab can be in edit mode at a time
provideInlineEditGroup()

const artistCreatorOpen = ref(false)

const ERROR_MESSAGES = {
  404: 'This release no longer exists.',
  409: 'You already have a release with this name.',
}

const rules = {
  name: [(v) => !!v?.trim() || 'Name is required', (v) => (v?.length ?? 0) <= 150 || 'Max 150 characters'],
  primaryGenre: [(v) => !!v || 'Primary genre is required'],
  notes: [(v) => (v?.length ?? 0) <= 1024 || 'Max 1024 characters'],
}

// ---------- Values the editors start from ----------

const dates = computed(() => ({
  releaseDate: props.release.releaseDate,
  originalReleaseDate: props.release.originalReleaseDate,
}))
const genres = computed(() => ({
  primaryGenre: props.release.primaryGenre,
  secondaryGenre: props.release.secondaryGenre,
}))
const artistIds = computed(() => props.release.artists.map((artist) => artist.id))

// ---------- Saving: every editor reports the saved release to the page ----------

async function saved(request) {
  emit('updated', await request)
}

const id = () => props.release.id
const saveName = (name) => saved(releaseService.update(id(), { name: name.trim() }))
const saveType = (type) => saved(releaseService.update(id(), { type }))
const saveDates = (value) => saved(releaseService.updateDates(id(), value))
const saveGenres = (value) => saved(releaseService.updateGenres(id(), value))
const saveNotes = (notes) => saved(releaseService.update(id(), { notes: notes ?? '' }))
const saveArtists = (ids) => saved(releaseService.update(id(), { artistIds: ids }))

// ---------- Display helpers ----------

const formatInstant = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
// Filled values use the brand color; missing ones stay muted so they are easy to spot
const valueClass = (empty) => (empty ? 'text-on-surface-variant' : 'font-medium text-primary')

function setPrimaryGenre(draft, value) {
  draft.primaryGenre = value
  if (draft.secondaryGenre === value) draft.secondaryGenre = null
}

const ISO_DATE_RULE = (draft) => () =>
  !draft.originalReleaseDate || !draft.releaseDate || draft.originalReleaseDate < draft.releaseDate
    || 'Must be before the release date'
</script>

<template>
  <div class="grid items-start gap-6 lg:grid-cols-3">
    <div class="flex flex-col gap-6 lg:col-span-2">
      <v-card border flat>
        <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Details</v-card-title>
        <div class="px-4 pb-2 sm:px-6">
          <EditableField label="Name" :value="release.name" :save="saveName" :error-messages="ERROR_MESSAGES">
            <template #display="{ value }"><span :class="valueClass(false)">{{ value }}</span></template>
            <template #editor="{ draft, set }">
              <v-text-field :model-value="draft" :rules="rules.name" counter="150" @update:model-value="set" />
            </template>
          </EditableField>
          <v-divider />

          <EditableField label="Type" :value="release.type" :save="saveType" :error-messages="ERROR_MESSAGES">
            <template #display="{ value }"><span :class="valueClass(false)">{{ getReleaseTypeLabel(value) }}</span></template>
            <template #editor="{ draft, set }">
              <v-chip-group :model-value="draft" mandatory filter column @update:model-value="set">
                <v-chip v-for="type in RELEASE_TYPES" :key="type.value" :value="type.value" :prepend-icon="type.icon" variant="outlined">
                  {{ type.label }}
                </v-chip>
              </v-chip-group>
            </template>
          </EditableField>
          <v-divider />

          <!-- Changed from the phase chip in the header -->
          <EditableField label="Phase" :value="release.phase" :save="() => {}" :editable="false">
            <template #display="{ value }"><span :class="valueClass(false)">{{ getReleasePhase(value).label }}</span></template>
          </EditableField>
          <v-divider />

          <EditableField label="Dates" :value="dates" :save="saveDates" :error-messages="ERROR_MESSAGES">
            <template #display>
              <span :class="valueClass(!release.releaseDate)">
                {{ release.releaseDate ? formatIsoDate(release.releaseDate) : 'Not set' }}
              </span>
              <span v-if="release.originalReleaseDate" class="block text-xs text-on-surface-variant">
                Original release: {{ formatIsoDate(release.originalReleaseDate) }}
              </span>
            </template>
            <template #editor="{ draft }">
              <div class="grid gap-x-4 sm:grid-cols-2">
                <IsoDateInput v-model="draft.releaseDate" label="Release date" prepend-inner-icon="mdi-calendar" />
                <IsoDateInput
                  v-model="draft.originalReleaseDate"
                  label="Original release date"
                  hint="Only for reissues and remasters"
                  persistent-hint
                  prepend-inner-icon="mdi-history"
                  :rules="[ISO_DATE_RULE(draft)]"
                />
              </div>
            </template>
          </EditableField>
          <v-divider />

          <EditableField label="Genres" :value="genres" :save="saveGenres" :error-messages="ERROR_MESSAGES">
            <template #display>
              <span :class="valueClass(false)">
                {{ [release.primaryGenre, release.secondaryGenre].filter(Boolean).map(getGenreLabel).join(' · ') }}
              </span>
            </template>
            <template #editor="{ draft }">
              <div class="grid gap-x-4 sm:grid-cols-2">
                <v-autocomplete
                  :model-value="draft.primaryGenre"
                  :items="GENRES"
                  item-title="label"
                  item-value="value"
                  label="Primary genre"
                  :rules="rules.primaryGenre"
                  @update:model-value="(value) => setPrimaryGenre(draft, value)"
                />
                <v-autocomplete
                  v-model="draft.secondaryGenre"
                  :items="GENRES.filter((genre) => genre.value !== draft.primaryGenre)"
                  item-title="label"
                  item-value="value"
                  label="Secondary genre"
                  clearable
                />
              </div>
            </template>
          </EditableField>
          <v-divider />

          <EditableField label="Added" :value="release.createdAt" :save="() => {}" :editable="false">
            <template #display="{ value }">
              <span :class="valueClass(!value)">{{ value ? formatInstant(value) : '—' }}</span>
            </template>
          </EditableField>
        </div>
      </v-card>

      <v-card border flat>
        <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Notes</v-card-title>
        <div class="px-4 pb-2 sm:px-6">
          <EditableField label="Notes" layout="block" :value="release.notes" :save="saveNotes" :error-messages="ERROR_MESSAGES">
            <template #display="{ value }">
              <ExpandableText :text="value" :lines="4" placeholder="No notes yet." class="text-on-surface" />
            </template>
            <template #editor="{ draft, set }">
              <v-textarea :model-value="draft" :rules="rules.notes" counter="1024" rows="3" auto-grow @update:model-value="set" />
            </template>
          </EditableField>
        </div>
      </v-card>
    </div>

    <v-card border flat>
      <v-card-title class="px-4 pt-4 text-base font-medium sm:px-6">Artists</v-card-title>
      <div class="px-4 pb-2 sm:px-6">
        <EditableField
          label="Artists"
          layout="block"
          :value="artistIds"
          :save="saveArtists"
          :save-disabled="artistCreatorOpen"
          :error-messages="{ ...ERROR_MESSAGES, 404: 'One of the selected artists no longer exists.' }"
        >
          <template #display>
            <v-list v-if="release.artists.length" density="comfortable" class="-mx-2 py-0">
              <v-list-item
                v-for="(artist, index) in release.artists"
                :key="artist.id"
                :to="{ name: 'artist-detail', params: { id: artist.id } }"
                class="px-2"
              >
                <template #prepend>
                  <ArtistAvatar :name="artist.name" :src="artist.avatarUrl" :size="36" class="me-3" />
                </template>
                <v-list-item-title>{{ artist.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="index === 0">Primary artist</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <span v-else class="text-on-surface-variant">No artist yet.</span>
          </template>
          <template #editor="{ draft, set }">
            <ReleaseArtistsPicker :model-value="draft" v-model:creator-open="artistCreatorOpen" @update:model-value="set" />
            <p v-if="artistCreatorOpen" class="mt-2 text-xs text-on-surface-variant">Finish or cancel the new artist first</p>
          </template>
        </EditableField>
      </div>
    </v-card>
  </div>
</template>