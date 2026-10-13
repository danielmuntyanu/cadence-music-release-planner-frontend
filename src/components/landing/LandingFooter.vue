<script setup>
import { computed } from 'vue'
import PageContainer from '@/components/PageContainer.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const year = new Date().getFullYear()

const columns = computed(() => [
  {
    title: 'Product',
    links: [
      { text: 'Features', to: { name: 'home', hash: '#features' } },
      { text: 'Pricing', to: { name: 'home', hash: '#pricing' } },
    ],
  },
  {
    title: 'Account',
    links: auth.isAuthenticated
      ? [
          { text: 'Dashboard', to: { name: 'dashboard' } },
          { text: 'Settings', to: '/settings' },
        ]
      : [
          { text: 'Sign in', to: { name: 'login' } },
          { text: 'Create account', to: { name: 'register' } },
        ],
  },
])
</script>

<template>
  <footer class="border-t border-border-subtle bg-surface-lowest/60">
    <PageContainer size="lg" :texture="false" :padded="false">
      <div class="grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div class="max-w-sm">
          <router-link to="/" class="text-xl font-medium text-on-surface no-underline">
            Cadence
          </router-link>
          <p class="mt-3 text-sm text-on-surface-variant">
            The timeline-driven planner for music releases: deadlines, deliverables and launch day in
            one place.
          </p>
        </div>

        <nav v-for="column in columns" :key="column.title" :aria-label="column.title">
          <h2 class="mb-3 text-xs font-medium uppercase tracking-wider text-on-surface-muted">
            {{ column.title }}
          </h2>
          <ul class="flex flex-col gap-2">
            <li v-for="link in column.links" :key="link.text">
              <router-link
                :to="link.to"
                class="text-sm text-on-surface-variant no-underline hover:text-on-surface"
              >
                {{ link.text }}
              </router-link>
            </li>
          </ul>
        </nav>
      </div>

      <div
        class="flex flex-col gap-2 border-t border-border-subtle py-6 text-xs text-on-surface-muted sm:flex-row sm:justify-between"
      >
        <p>© {{ year }} Cadence. All rights reserved.</p>
        <p>Made for artists who ship on time.</p>
      </div>
    </PageContainer>
  </footer>
</template>