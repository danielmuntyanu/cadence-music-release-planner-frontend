<script setup>
defineProps({
  size: {
    type: String,
    default: 'xl',
    validator: (v) => ['sm', 'md', 'lg', 'xl', 'full'].includes(v),
  },
})

const maxWidth = {
  sm: 'max-w-lg',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
}
</script>

<template>
  <div class="mx-auto w-full px-4 py-6 sm:px-6 md:py-10 lg:px-8" :class="maxWidth[size]">
    <slot />
  </div>
</template>