<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/user.service'
import { bioRules, displayNameRules, emailRules, usernameRules } from '@/utils/validators'
import { useSubmit } from '@/composables/useSubmit'

const auth = useAuthStore()

const fromUser = (u) => ({
  username: u?.username ?? '',
  email: u?.email ?? '',
  displayName: u?.displayName ?? '',
  bio: u?.bio ?? '',
})

const form = ref(fromUser(auth.user))
const { loading, error, success, submit } = useSubmit({
  errorMessages: {
    409: 'This username or email is already taken',
    400: 'Please check the entered data and try again',
    422: 'Please check the entered data and try again',
  },
})

watch(() => auth.user, (u) => (form.value = fromUser(u)))

const changes = computed(() => {
  const base = fromUser(auth.user)
  return Object.fromEntries(
    Object.entries(form.value)
      .map(([key, value]) => [key, value.trim()])
      .filter(([key, value]) => value !== base[key]),
  )
})
const isDirty = computed(() => Object.keys(changes.value).length > 0)

function reset() {
  form.value = fromUser(auth.user)
  error.value = null
}
async function onSubmit(event) {
  const { valid } = await event
  if (!valid || !isDirty.value) return

  await submit(async () => {
    await userService.updateProfile(changes.value)
    await auth.fetchMe() // the server is the source of truth
  })
}
</script>

<template>
  <v-form validate-on="invalid-input" @submit.prevent="onSubmit">
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
      Profile updated
    </v-alert>

    <div class="grid sm:grid-cols-2 sm:gap-x-4">
      <v-text-field
        v-model="form.username"
        label="Username"
        variant="outlined"
        prepend-inner-icon="mdi-account-outline"
        autocomplete="username"
        autocapitalize="none"
        spellcheck="false"
        :rules="usernameRules"
      />
      <v-text-field
        v-model="form.email"
        label="Email"
        type="email"
        variant="outlined"
        prepend-inner-icon="mdi-email-outline"
        autocomplete="email"
        autocapitalize="none"
        spellcheck="false"
        :rules="emailRules"
      />
    </div>

    <v-text-field
      v-model="form.displayName"
      label="Display name"
      variant="outlined"
      prepend-inner-icon="mdi-badge-account-horizontal-outline"
      autocomplete="nickname"
      :rules="displayNameRules"
    />

    <v-textarea
      v-model="form.bio"
      label="Bio"
      variant="outlined"
      rows="3"
      auto-grow
      :counter="500"
      :rules="bioRules"
    />

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <v-btn v-if="isDirty" variant="text" size="large" :disabled="loading" text="Reset" @click="reset" />
      <v-btn
        type="submit"
        color="primary"
        size="large"
        :loading="loading"
        :disabled="!isDirty"
        text="Save changes"
      />
    </div>
  </v-form>
</template>