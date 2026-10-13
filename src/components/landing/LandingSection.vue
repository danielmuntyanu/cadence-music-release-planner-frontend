<script setup>
import PageContainer from '@/components/PageContainer.vue'

defineProps({
  id: { type: String, default: undefined },
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  // Full-width tinted background to separate neighbouring sections
  band: Boolean,
  size: { type: String, default: 'xl' },
})
</script>

<template>
  <section
    :id="id"
    class="scroll-mt-16"
    :class="band && 'border-y border-border-subtle bg-surface-low/70'"
  >
    <PageContainer :size="size" :texture="false" :padded="false">
      <div class="py-16 md:py-24">
        <header v-if="title" class="mx-auto mb-12 max-w-2xl text-center">
          <p
            v-if="eyebrow"
            class="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-primary-accent"
          >
            {{ eyebrow }}
          </p>
          <h2 class="text-3xl font-medium text-on-surface md:text-4xl">{{ title }}</h2>
          <p v-if="subtitle" class="mt-4 text-on-surface-variant">{{ subtitle }}</p>
        </header>

        <slot />
      </div>
    </PageContainer>
  </section>
</template>