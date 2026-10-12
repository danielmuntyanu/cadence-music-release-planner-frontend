<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usernameRules, passwordRules } from '@/utils/validators'
import { useRedirectTarget } from '@/composables/useRedirectTarget'
import { useSubmit } from '@/composables/useSubmit'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const redirectTo = useRedirectTarget()

const form = ref({username: '', password: ''})
const showPassword = ref(false)
const { loading, error, submit } = useSubmit({
  errorMessages: { 401: 'Wrong username or password' },
})

async function onSubmit(event) {
  const { valid } = await event // v-form validates all fields on its own
  if (!valid) return

  const ok = await submit(() =>
    auth.login({ username: form.value.username.trim(), password: form.value.password }),
  )
  if (ok) await router.push(redirectTo.value)
}
</script>

<template>
    <v-form validate-on="invalid_input" @submit.prevent="onSubmit">
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
            {{ error }}
        </v-alert>

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
        v-model="form.password"
        label="Password"
        variant="outlined"
        prepend-inner-icon="mdi-lock-outline"
        autocomplete="current-password"
        :type="showPassword ? 'text' : 'password'"
        :rules="passwordRules"
        >
            <template #append-inner>
                <v-icon-btn
                :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                variant="text"
                size="small"
                @click="showPassword = !showPassword"
                />
            </template>
        </v-text-field>

        <v-btn type="submit" color="primary" size="large" block :loading="loading" text="Sign In" />

        <p class="mt-4 text-center text-sm text-on-surface-variant">
            No account yet?
            <router-link :to="{ name: 'register', query: route.query }" class="text-primary-accent">Create one</router-link>
        </p>
    </v-form>
</template>