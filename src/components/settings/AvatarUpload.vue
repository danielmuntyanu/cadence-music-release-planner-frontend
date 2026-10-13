<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/user.service'
import { AVATAR_TYPES, validateAvatarFile } from '@/utils/validators'
import { useSubmit } from '@/composables/useSubmit'

const uploadEnabled = import.meta.env.VITE_AVATAR_UPLOAD_ENABLED === 'true'

const auth = useAuthStore()
const input = ref(null)
const file = ref(null)
const previewUrl = ref(null)
const { loading, error, success, submit } = useSubmit()

const accept = AVATAR_TYPES.join(',')
const initial = computed(() =>
  (auth.user?.displayName || auth.user?.username || '?').charAt(0).toUpperCase(),
)
const src = computed(() => previewUrl.value ?? auth.user?.avatar_url ?? null)

function revokePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
}

function onPick(event) {
  const picked = event.target.files?.[0]
  event.target.value = '' // чтобы можно было выбрать тот же файл ещё раз
  if (!picked) return

  success.value = false
  error.value = validateAvatarFile(picked)
  if (error.value) return

  revokePreview()
  file.value = picked
  previewUrl.value = URL.createObjectURL(picked)
}

function cancel() {
  revokePreview()
  file.value = null
  previewUrl.value = null
  error.value = null
}

async function run(action) {
  const ok = await submit(async () => {
    await action()
    await auth.fetchMe()
  })
  if (ok) cancel() // clears the preview and the selected file
}

const upload = () => file.value && run(() => userService.uploadAvatar(file.value))
const remove = () => run(() => userService.removeAvatar())

onBeforeUnmount(revokePreview)
</script>

<template>
  <div>
    <v-alert v-if="!uploadEnabled" type="info" variant="tonal" density="compact" class="mb-4">
      Avatar upload is not available yet.
    </v-alert>
    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>
    <v-alert
      v-if="success"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
      closable
      @click:close="success = false"
    >
      Avatar updated
    </v-alert>

    <div class="flex flex-col items-center gap-5 sm:flex-row">
      <v-avatar size="96" color="primary-container">
        <v-img v-if="src" :src="src" alt="Your avatar" cover />
        <span v-else class="text-3xl font-medium text-on-surface">{{ initial }}</span>
      </v-avatar>

      <div class="flex w-full flex-col items-center gap-3 sm:items-start">
        <p class="text-sm text-on-surface-variant">PNG, JPG or WebP, up to 2 MB.</p>

        <input ref="input" type="file" class="hidden" :accept="accept" @change="onPick" />

        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-image-plus-outline"
            :disabled="loading"
            text="Choose image"
            @click="input.click()"
          />
          <template v-if="file">
            <v-btn
              color="primary"
              prepend-icon="mdi-upload-outline"
              :loading="loading"
              :disabled="!uploadEnabled"
              text="Upload"
              @click="upload"
            />
            <v-btn variant="text" :disabled="loading" text="Cancel" @click="cancel" />
          </template>
          <v-btn
            v-else-if="auth.user?.avatar_url"
            variant="text"
            color="error"
            :loading="loading"
            :disabled="!uploadEnabled"
            text="Remove"
            @click="remove"
          />
        </div>
      </div>
    </div>
  </div>
</template>