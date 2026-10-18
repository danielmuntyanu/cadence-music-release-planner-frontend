<script setup>
import PageContainer from '@/components/PageContainer.vue'
</script>

<template>
  <PageContainer size="sm">
    <h1 class="mb-2 text-2xl font-medium text-on-surface">404</h1>
    <p class="mb-6 text-on-surface-variant">Page is not found yet.</p>
    <v-btn to="/" color="primary" text="Back to home" />
  </PageContainer>
</template>