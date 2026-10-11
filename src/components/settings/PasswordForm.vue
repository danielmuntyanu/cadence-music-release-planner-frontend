<script setup>
import { ref } from 'vue'
import { userService } from '@/services/user.service'
import { passwordRules } from '@/utils/validators'

const formRef = ref(null)
const form = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const showPassword = ref(false)
const error = ref(null)
const success = ref(false)
const loading = ref(false)

const currentPasswordRules = [(v) => !!v || 'Enter your current password']
const newPasswordRules = [
  ...passwordRules,
  (v) => v !== form.value.currentPassword || 'New password must differ from the current one',
]
const confirmPasswordRules = [
  (v) => !!v || 'Confirm your new password',
  (v) => v === form.value.newPassword || 'Passwords do not match',
]

const errorMessages = {
  401: 'Current password is incorrect',
  403: 'Current password is incorrect',
  400: 'Please check the entered data and try again',
  422: 'Please check the entered data and try again',
}

async function onSubmit(event) {
  const { valid } = await event
  if (!valid || loading.value) return

  loading.value = true
  error.value = null
  success.value = false

  try {
    await userService.changePassword({
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    })
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    showPassword.value = false
    formRef.value?.resetValidation()
    success.value = true
  } catch (e) {
    error.value = errorMessages[e.response?.status] ?? 'Something went wrong. Try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-form ref="formRef" validate-on="invalid-input" @submit.prevent="onSubmit">
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
      Password changed
    </v-alert>

    <v-text-field
      v-model="form.currentPassword"
      label="Current password"
      variant="outlined"
      prepend-inner-icon="mdi-lock-outline"
      autocomplete="current-password"
      :type="showPassword ? 'text' : 'password'"
      :rules="currentPasswordRules"
    >
      <template #append-inner>
        <v-icon-btn
          :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          :aria-label="showPassword ? 'Hide passwords' : 'Show passwords'"
          :aria-pressed="showPassword"
          variant="text"
          size="small"
          @click="showPassword = !showPassword"
        />
      </template>
    </v-text-field>

    <v-text-field
      v-model="form.newPassword"
      label="New password"
      variant="outlined"
      prepend-inner-icon="mdi-lock-reset"
      autocomplete="new-password"
      hint="At least 8 characters with upper and lower case letters, a digit and a special character"
      persistent-hint
      :type="showPassword ? 'text' : 'password'"
      :rules="newPasswordRules"
    />

    <v-text-field
      v-model="form.confirmPassword"
      label="Confirm new password"
      variant="outlined"
      prepend-inner-icon="mdi-lock-check-outline"
      autocomplete="new-password"
      :type="showPassword ? 'text' : 'password'"
      :rules="confirmPasswordRules"
    />

    <div class="flex sm:justify-end">
      <v-btn
        type="submit"
        color="primary"
        size="large"
        class="w-full sm:w-auto"
        :loading="loading"
        text="Change password"
      />
    </div>
  </v-form>
</template>