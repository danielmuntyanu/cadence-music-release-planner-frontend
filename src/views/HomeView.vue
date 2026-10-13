<script setup>
import LandingCta from '@/components/landing/LandingCta.vue'
import LandingFeatures from '@/components/landing/LandingFeatures.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import LandingHero from '@/components/landing/LandingHero.vue'
import LandingPricing from '@/components/landing/LandingPricing.vue'
import LandingProblem from '@/components/landing/LandingProblem.vue'
import LandingShowcase from '@/components/landing/LandingShowcase.vue'
import LandingTestimonials from '@/components/landing/LandingTestimonials.vue'
</script>

<template>
  <div class="bg-texture typo-reset">
    <LandingHero />
    <LandingProblem />
    <LandingFeatures />
    <LandingShowcase />
    <LandingTestimonials />
    <LandingPricing />
    <LandingCta />
    <LandingFooter />
  </div>
</template>