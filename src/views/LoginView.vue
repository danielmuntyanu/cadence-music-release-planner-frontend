<script setup>
import PageContainer from '@/components/PageContainer.vue'
import LoginForm from '@/components/auth/LoginForm.vue';
</script>

<template>
    <PageContainer size="sm">
        <div class="md:pt-8">
            <h1 class="mb-1 text-2xl font-medium text-on-surface">
                Sign in
            </h1>
            <p class="mb-6 text-on-surface-variant">
                Welcome back. Enter your details to continue.
            </p>

            <v-card border flat>
                <v-card-text class="p-4 sm:p-6">
                    <LoginForm />
                </v-card-text>
            </v-card>
        </div>
    </PageContainer>
</template>