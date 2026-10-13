<script setup>
import PageContainer from '@/components/PageContainer.vue'
</script>

<template>
  <PageContainer size="sm">
    <h1 class="mb-2 text-2xl font-medium text-on-surface">Access denied</h1>
    <p class="mb-6 text-on-surface-variant">You don't have permission to view this page.</p>
    <v-btn to="/" color="primary" text="Back to home" />
  </PageContainer>
</template>