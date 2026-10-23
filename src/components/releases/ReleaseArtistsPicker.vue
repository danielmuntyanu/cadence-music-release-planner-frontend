<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import ArtistAvatar from '@/components/artists/ArtistAvatar.vue'
import ArtistFields from '@/components/artists/ArtistFields.vue'
import { useArtistsStore } from '@/stores/artists'
import { useSubmit } from '@/composables/useSubmit'
import { createArtistForm, toArtistRequest } from '@/models/artist'

// Ordered artist ids: the first one is the primary artist
const artistIds = defineModel({ type: Array, required: true })
// Exposed so the parent can block submitting the release while a new artist is half-filled
const creatorOpen = defineModel('creatorOpen', { type: Boolean, default: false })

const artistsStore = useArtistsStore()
const { loading: creating, error: createError, submit } = useSubmit({
  errorMessages: {
    400: 'Some artist fields are invalid.',
    409: 'You already have an artist with this name.',
  },
})

const search = ref('')
const creatorForm = ref(null)
const creatorFields = ref(null)
const newArtist = ref(createArtistForm())

const selected = computed(() => artistIds.value.map((id) => artistsStore.findById(id)).filter(Boolean))
const available = computed(() => artistsStore.artists.filter((artist) => !artistIds.value.includes(artist.id)))

function add(id) {
  if (id != null && !artistIds.value.includes(id)) artistIds.value = [...artistIds.value, id]
  search.value = ''
}

function remove(id) {
  artistIds.value = artistIds.value.filter((artistId) => artistId !== id)
}

function move(index, offset) {
  const next = [...artistIds.value]
  const target = index + offset
  ;[next[index], next[target]] = [next[target], next[index]]
  artistIds.value = next
}

async function openCreator() {
  // Whatever the user typed in the search becomes the new artist's name
  newArtist.value = createArtistForm({ name: search.value.trim() })
  createError.value = null
  creatorOpen.value = true
  await nextTick()
  creatorFields.value?.focus()
}

async function createArtist() {
  const { valid } = await creatorForm.value.validate()
  if (!valid) return

  let created = null
  const ok = await submit(async () => {
    created = await artistsStore.create(toArtistRequest(newArtist.value))
  })

  if (ok) {
    add(created.id)
    creatorOpen.value = false
  }
}

onMounted(() => artistsStore.load())
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Selected artists, in order -->
    <v-list v-if="selected.length" density="compact" class="rounded-lg border py-0">
      <v-list-item v-for="(artist, index) in selected" :key="artist.id">
        <template #prepend>
          <ArtistAvatar :name="artist.name" :src="artist.avatarUrl" :size="32" class="me-3" />
        </template>

        <v-list-item-title class="flex items-center gap-2">
          {{ artist.name }}
          <v-chip v-if="index === 0" size="x-small" color="primary" variant="tonal">Primary</v-chip>
        </v-list-item-title>

        <template #append>
          <v-btn
            icon="mdi-arrow-up"
            size="x-small"
            variant="text"
            :disabled="index === 0"
            :aria-label="`Move ${artist.name} up`"
            @click="move(index, -1)"
          />
          <v-btn
            icon="mdi-arrow-down"
            size="x-small"
            variant="text"
            :disabled="index === selected.length - 1"
            :aria-label="`Move ${artist.name} down`"
            @click="move(index, 1)"
          />
          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            :aria-label="`Remove ${artist.name}`"
            @click="remove(artist.id)"
          />
        </template>
      </v-list-item>
    </v-list>

    <!-- Adder: picking an artist appends it; the field itself never holds a value -->
    <v-autocomplete
      v-model:search="search"
      :model-value="null"
      :items="available"
      item-title="name"
      item-value="id"
      :loading="artistsStore.loading"
      :disabled="creatorOpen"
      :label="selected.length ? 'Add another artist' : 'Add artist'"
      prepend-inner-icon="mdi-account-music-outline"
      hide-details
      @update:model-value="add"
    >
      <template #item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps">
          <template #prepend>
            <ArtistAvatar :name="item.raw.name" :src="item.raw.avatarUrl" :size="28" class="me-3" />
          </template>
        </v-list-item>
      </template>

      <template #no-data>
        <v-list-item
          prepend-icon="mdi-plus"
          :title="search ? `Create “${search}”` : 'Create new artist'"
          @click="openCreator"
        />
      </template>

      <template #append-item>
        <v-divider v-if="available.length" />
        <v-list-item v-if="available.length" prepend-icon="mdi-plus" title="Create new artist" @click="openCreator" />
      </template>
    </v-autocomplete>

    <!-- Inline creator: its own form, outside the release forms -->
    <v-expand-transition>
      <v-card v-if="creatorOpen" border flat class="bg-surface-variant/30">
        <v-form ref="creatorForm" @submit.prevent="createArtist">
          <v-card-text class="p-4">
            <p class="mb-3 text-sm font-medium text-on-surface">New artist</p>
            <ArtistFields ref="creatorFields" v-model="newArtist" />
            <v-alert v-if="createError" type="error" variant="tonal" density="compact" class="mt-3" :text="createError" />
          </v-card-text>
          <v-card-actions class="justify-end gap-2 px-4 pb-4 pt-0">
            <v-btn variant="text" :disabled="creating" @click="creatorOpen = false">Cancel</v-btn>
            <v-btn type="submit" color="primary" variant="tonal" prepend-icon="mdi-check" :loading="creating">
              Create artist
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-expand-transition>
  </div>
</template>