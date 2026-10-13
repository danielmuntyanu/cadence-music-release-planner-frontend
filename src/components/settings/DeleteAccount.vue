<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/user.service'
import { useSubmit } from '@/composables/useSubmit'

const auth = useAuthStore()
const router = useRouter()

const dialog = ref(false)
const confirmation = ref('')
const { loading, error, submit } = useSubmit({
  defaultError: 'Could not delete the account. Try again.',
})

const canDelete = computed(() => !!auth.user && confirmation.value === auth.user.username)

watch(dialog, (open) => {
  if (open) {
    confirmation.value = ''
    error.value = null
  }
})

async function onDelete() {
  if (!canDelete.value) return

  const ok = await submit(async () => {
    await userService.deleteAccount()
    // The account is already gone: the server-side logout may fail,
    // but the local state must be cleared either way
    try {
      await auth.logout()
    } catch {
      /* ignored on purpose */
    }
  })
  if (ok) {
    dialog.value = false
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-on-surface-variant">
      Your account and all your data will be permanently removed. This cannot be undone.
    </p>
    <v-btn
      color="error"
      variant="outlined"
      prepend-icon="mdi-delete-outline"
      class="shrink-0"
      text="Delete account"
      @click="dialog = true"
    />
  </div>

  <v-dialog v-model="dialog" max-width="480" :persistent="loading">
    <v-card>
      <v-form @submit.prevent="onDelete">
        <v-card-title class="px-4 pt-4 text-error sm:px-6">Delete account?</v-card-title>
        <v-card-text class="px-4 sm:px-6">
          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
            {{ error }}
          </v-alert>
          <p class="mb-4 text-sm text-on-surface-variant">
            This is permanent. To confirm, type your username
            <strong class="text-on-surface">{{ auth.user?.username }}</strong> below.
          </p>
          <v-text-field
            v-model="confirmation"
            label="Username"
            variant="outlined"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            hide-details
            autofocus
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4 sm:px-6">
          <v-spacer />
          <v-btn variant="text" :disabled="loading" text="Cancel" @click="dialog = false" />
          <v-btn
            type="submit"
            color="error"
            variant="flat"
            :loading="loading"
            :disabled="!canDelete"
            text="Delete forever"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>