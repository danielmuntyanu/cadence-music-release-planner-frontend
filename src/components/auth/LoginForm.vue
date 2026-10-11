<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = ref({username: '', password: ''})
const showPassword = ref(false)
const error = ref(null)
const loading = ref(false)

const usernameRules = [
    (v) => !!v?.trim() || 'Username is required',
    (v) => v.trim().length >= 3 || 'Username must be at least 3 characters',
]

const passwordRules = [
    (v) => !!v?.trim() || 'Password is required',
    (v) => v.trim().length >= 8 || 'Password must be at least 8 characters',
    (v) => /[a-z]/.test(v) || 'Add at least one lowercase letter',
    (v) => /[A-Z]/.test(v) || 'Add at least one uppercase letter',
    (v) => /\d/.test(v) || 'Add at least one digit',
    (v) => /[^A-Za-z0-9\s]/ || 'Add at least one special character',
]

// Internal site paths only: protection against open redirects (?redirect=//evil.com)
const redirectTo = computed(() => {
  const r = route.query.redirect
  const safe = typeof r === 'string' && r.startsWith('/') && !r.startsWith('//') && !r.startsWith('/\\')
  return safe ? r : '/'
})

async function onSubmit(event) {
    const { valid } = await event
    if (!valid || loading.value) return

    loading.value = true
    error.value = null

    try {
        await auth.login({
            username: form.value.username.trim(),
            password: form.value.password,
        })
        await router.push(redirectTo.value)
    } catch (e) {
        error.value = e.response?.status === 401 ? 'Wrong email or password' : 'Something went wrong. Try again.'
    } finally {
        loading.value = false
    }
}
</script>

<temppalte>

</temppalte>