<script setup>
import PageContainer from '@/components/PageContainer.vue'
import { useLandingCta } from '@/composables/useLandingCta'

const cta = useLandingCta()
</script>

<template>
  <section>
    <PageContainer size="lg" :texture="false" :padded="false">
      <div class="py-16 md:py-24">
        <v-card border flat>
          <v-card-text class="flex flex-col items-start gap-6 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div class="max-w-xl">
              <p class="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary-accent">
                Your next release cycle
              </p>
              <h2 class="text-3xl font-medium text-on-surface">Ready to Drop Without the Dread?</h2>
              <p class="mt-3 text-on-surface-variant">
                Set your drop date and get a clear, step-by-step plan in under a minute.
              </p>
            </div>

            <div class="flex flex-col gap-2 max-md:w-full">
              <v-btn color="primary" size="x-large" :to="cta.to" :text="cta.text" />
              <p class="text-center text-xs text-on-surface-muted">No credit card required.</p>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </PageContainer>
  </section>
</template>