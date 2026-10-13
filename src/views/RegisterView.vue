<script setup>
import PageContainer from '@/components/PageContainer.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'
</script>

<template>
  <PageContainer size="sm">
    <div class="md:pt-8">
      <h1 class="mb-1 text-2xl font-medium text-on-surface">Create account</h1>
      <p class="mb-6 text-on-surface-variant">Create your account to start planning releases.</p>

      <v-card border flat>
        <v-card-text class="p-4 sm:p-6">
          <RegisterForm />
        </v-card-text>
      </v-card>
    </div>
  </PageContainer>
</template>