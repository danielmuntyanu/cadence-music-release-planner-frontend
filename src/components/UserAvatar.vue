<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

defineProps({ size: { type: Number, default: 32 } })

const auth = useAuthStore()

const initials = computed(() =>
  (auth.user?.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
)
</script>

<template>
  <v-avatar
    :size="size"
    :image="auth.user?.avatarUrl || undefined"
    class="bg-primary-container text-primary-accent"
  >
    <template v-if="!auth.user?.avatarUrl">
      <span v-if="initials" :style="{ fontSize: size * 0.4 + 'px' }">{{ initials }}</span>
      <v-icon v-else icon="mdi-account" :size="size * 0.6" />
    </template>
  </v-avatar>
</template>