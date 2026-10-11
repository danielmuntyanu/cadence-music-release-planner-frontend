<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/UserAvatar.vue'
import { ROLES } from '@/constants/roles'
import { links } from '@/constants/navigation'

const theme = useTheme()
const { mdAndUp } = useDisplay()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isDark = computed(() => theme.name.value === 'dark')
const drawer = ref(false)

const visibleLinks = computed(() =>
  links.filter((l) => (l.roles ? auth.hasAnyRole(l.roles) : !l.requiresAuth || auth.isAuthenticated)),
)

async function onLogout() {
  drawer.value = false
  auth.logout()
  await router.push('/login')
}

watch(() => route.fullPath, () => (drawer.value = false))
watch(mdAndUp, (wide) => { if (wide) drawer.value = false })
</script>

<template>
  <v-app-bar>
    <div class="flex w-full items-center px-2">
      <div class="flex flex-1 items-center">
        <router-link to="/" class="text-xl font-medium text-inherit no-underline">Cadense</router-link>
      </div>

      <nav v-if="mdAndUp" class="flex items-center gap-1" aria-label="Main">
        <v-btn v-for="link in visibleLinks" :key="link.to" :to="link.to" :text="link.title" />
      </nav>

      <div class="flex flex-1 items-center justify-end gap-2">
        <template v-if="mdAndUp && auth.ready">
          <template v-if="auth.isAuthenticated">
            <v-btn to="/account" variant="text">
              <template #prepend><UserAvatar :size="24" /></template>
              Account
            </v-btn>
            <v-btn text="Logout" @click="onLogout" />
          </template>
          <template v-else>
            <v-btn to="/login" text="Sign-In" />
            <v-btn variant="tonal" color="primary" to="/register" text="Create Account" />
          </template>
        </template>

        <v-icon-btn
          :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
          aria-label="Toggle theme"
          @click="theme.toggle()"
        />
        <v-app-bar-nav-icon v-if="!mdAndUp" aria-label="Open menu" @click="drawer = !drawer" />
      </div>
    </div>
  </v-app-bar>

  <v-navigation-drawer v-if="!mdAndUp" v-model="drawer" location="end" temporary>
    <v-list nav>
      <v-list-item v-for="link in visibleLinks" :key="link.to" :to="link.to" :title="link.title" />
    </v-list>

    <template #append v-if="auth.ready">
      <div class="flex flex-col gap-2 p-4">
        <template v-if="auth.isAuthenticated">
          <div class="flex flex-col items-center gap-2 pb-2">
            <UserAvatar :size="72" />
            <span class="text-sm text-on-surface-variant">{{ auth.user.name }}</span>
          </div>
          <v-btn to="/account" text="Account" variant="tonal" color="primary" block />
          <v-btn text="Logout" block @click="onLogout" />
        </template>
        <template v-else>
          <v-btn to="/login" text="Sign-In" block />
          <v-btn variant="tonal" color="primary" to="/register" text="Create Account" block />
        </template>
      </div>
    </template>
  </v-navigation-drawer>
</template>