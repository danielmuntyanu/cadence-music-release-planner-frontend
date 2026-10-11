<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = ref({username: '', password: ''})
const error = ref(null)
const loading = ref(false)

async function onSubmit() {
    loading.value = true
    error.value = null

    try {
        await auth.login(form.value)
        await router.push(route.query.redirect || '/')
    } catch (e) {
        error.value = e.response?.status === 401 ? 'Wrong email or password' : 'Something went wrong. Try again.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <h1>Login</h1>
</template>