<script setup>
import LandingSection from '@/components/landing/LandingSection.vue'

const plans = [
  {
    name: 'Bedroom Artist',
    audience: 'For solo creators dropping occasional singles.',
    price: '$0',
    period: 'forever',
    features: [
      '1 active release pipeline',
      'Release timeline with countdown',
      'Pitch-window reminders',
      'Basic mastering checklist',
    ],
    action: 'Start free',
  },
  {
    name: 'Independent Pro',
    audience: 'For touring artists and producers managing consistent drops.',
    price: '$12',
    period: 'per month',
    popular: true,
    features: [
      'Unlimited active release timelines',
      'Multi-release calendar',
      'Collaborator permissions',
      'Stem and asset vault',
      'Automated delivery reminders',
    ],
    action: 'Choose Pro',
  },
  {
    name: 'Boutique Label',
    audience: 'For independent labels, collectives and A&R teams.',
    price: '$39',
    period: 'per month',
    features: [
      'Multi-artist roster management',
      'Custom workflow templates',
      'Larger asset storage',
      'Priority support',
    ],
    action: 'Choose Label',
  },
]
</script>

<template>
  <LandingSection
    id="pricing"
    band
    eyebrow="Pricing"
    title="Transparent Plans for Every Stage of Release"
    subtitle="Plans are shown for the demo: everything is free while Cadence is in beta, and billing is not enabled yet."
    size="lg"
  >
    <div class="grid items-stretch gap-6 md:grid-cols-3">
      <v-card
        v-for="plan in plans"
        :key="plan.name"
        border
        flat
        :class="plan.popular && 'border-primary'"
      >
        <v-card-text class="flex h-full flex-col p-5 sm:p-6">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-lg font-medium text-on-surface">{{ plan.name }}</h3>
            <v-chip v-if="plan.popular" size="x-small" color="primary" variant="flat">
              Most popular
            </v-chip>
          </div>
          <p class="mt-1 min-h-10 text-sm text-on-surface-variant">{{ plan.audience }}</p>

          <p class="my-5">
            <span class="text-4xl font-medium text-on-surface">{{ plan.price }}</span>
            <span class="ml-1 text-sm text-on-surface-muted">/ {{ plan.period }}</span>
          </p>

          <ul class="mb-6 flex flex-1 flex-col gap-2.5">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex gap-2 text-sm text-on-surface-variant"
            >
              <v-icon icon="mdi-check" size="18" class="mt-0.5 shrink-0 text-success" />
              {{ feature }}
            </li>
          </ul>

          <v-btn
            :color="plan.popular ? 'primary' : undefined"
            :variant="plan.popular ? 'flat' : 'tonal'"
            size="large"
            block
            :to="{ name: 'register' }"
            :text="plan.action"
          />
        </v-card-text>
      </v-card>
    </div>
  </LandingSection>
</template>