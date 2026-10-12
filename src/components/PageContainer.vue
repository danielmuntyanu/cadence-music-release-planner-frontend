<script setup>
defineProps({
  size: {
    type: String,
    default: 'xl',
    validator: (v) => ['sm', 'md', 'lg', 'xl', 'full'].includes(v),
  },
  // Paints the full-width studio texture behind the page content
  texture: { type: Boolean, default: true },
  // Vertical page padding; pass false when the content manages its own spacing
  padded: { type: Boolean, default: true },
})

// Full literal strings: Tailwind only detects class names written out in full
const maxWidth = {
  sm: 'max-w-lg',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
}
</script>

<template>
  <div :class="texture && 'bg-texture min-h-[calc(100dvh-var(--v-layout-top,64px))]'">
    <div
      class="mx-auto w-full px-4 sm:px-6 lg:px-8"
      :class="[maxWidth[size], padded && 'py-6 md:py-10']"
    >
      <slot />
    </div>
  </div>
</template>
