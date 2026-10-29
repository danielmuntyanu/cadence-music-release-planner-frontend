<script setup>
import { computed, ref } from 'vue'
import ImageInput from '@/components/media/ImageInput.vue'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/user.service'

const auth = useAuthStore()
const saved = ref(false)

const initial = computed(() =>
  (auth.user?.displayName || auth.user?.username || '?').charAt(0).toUpperCase(),
)

// Each endpoint returns the updated user, so no extra /auth/me round trip is needed
const actions = {
  upload: async (file, onProgress) => auth.setUser(await userService.uploadAvatar(file, onProgress)),
  remove: async () => auth.setUser(await userService.removeAvatar()),
  saveLink: async (url) => auth.setUser(await userService.setAvatarLink(url)),
}

const onSaved = () => { saved.value = true }
</script>

<template>
  <div class="flex flex-col gap-4">
    <v-alert
      v-if="saved"
      type="success"
      variant="tonal"
      density="compact"
      closable
      text="Avatar updated"
      @click:close="saved = false"
    />

    <ImageInput
      shape="circle"
      :src="auth.user?.avatarUrl ?? null"
      alt="Your avatar"
      v-bind="actions"
      @uploaded="onSaved"
      @removed="onSaved"
      @linked="onSaved"
    >
      <template #placeholder>
        <span class="flex h-full w-full items-center justify-center bg-primary-container text-3xl font-medium text-on-surface">
          {{ initial }}
        </span>
      </template>
    </ImageInput>
  </div>
</template>