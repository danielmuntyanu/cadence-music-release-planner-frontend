<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRedirectTarget } from '@/composables/useRedirectTarget'
import {
    bioRules,
    displayNameRules,
    emailRules,
    passwordRules,
    usernameRules,
} from '@/utils/validators'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const redirectTo = useRedirectTarget()

const form = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    bio: '',
})

const showPassword = ref(false)
const error = ref(null)
const loading = ref(false)

const confirmPasswordRules = [
    (v) => !!v || 'Confirm your password',
    (v) => v === form.value.password || 'Passwords do not match',
]

const errorMessages = {
    409: 'This username or email is already taken',
    400: 'Please check the entered data and try again',
    422: 'Please check the entered data and try again',
}

async function onSubmit(event) {
    const { valid } = await event
    if (!valid || loading.value) return

    loading.value = true
    error.value = null

    try {
        await auth.register({
            username: form.value.username.trim(),
            email: form.value.email.trim(),
            password: form.value.password,
            displayName: form.value.displayName.trim() || undefined,
            bio: form.value.bio.trim() || undefined,
        })
        await router.push(redirectTo.value)
    } catch (e) {
        error.value = errorMessages[e.response?.status] ?? 'Something went wrong. Try again.'
    } finally {
        loading.value = false
    }

}
</script>

<template>
    <v-form validate-on="invalid-input" @submit.prevent="onSubmit" class="[&_.v-input]:mb-2">
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

        <v-text-field 
            v-model="form.password" 
            label="Password" 
            variant="outlined" 
            prepend-inner-icon="mdi-lock-outline"
            autocomplete="new-password"
            hint="At least 8 characters with upper and lower case letters, a digit and a special character"
            persistent-hint
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

        <v-text-field 
            v-model="form.confirmPassword" 
            label="Confirm password" 
            variant="outlined"
            prepend-inner-icon="mdi-lock-check-outline" 
            autocomplete="new-password"
            :type="showPassword ? 'text' : 'password'" 
            :rules="confirmPasswordRules" 
        />

        <v-text-field 
            v-model="form.displayName" 
            label="Display name (optional)" 
            variant="outlined"
            prepend-inner-icon="mdi-badge-account-horizontal-outline" 
            autocomplete="nickname"
            :rules="displayNameRules" 
        />

        <v-textarea 
            v-model="form.bio" 
            label="Bio (optional)" variant="outlined" rows="3" 
            auto-grow 
            :counter="500"
            :rules="bioRules" 
        />

        <v-btn 
            type="submit" 
            color="primary" 
            size="large" 
            block 
            :loading="loading" 
            text="Create account" 
        />

        <p class="mt-4 text-center text-sm text-on-surface-variant">
            Already have an account?
            <router-link 
                :to="{ name: 'login', query: route.query }" 
                class="text-primary-accent"
            >
                Sign in
            </router-link>
        </p>
    </v-form>
</template>