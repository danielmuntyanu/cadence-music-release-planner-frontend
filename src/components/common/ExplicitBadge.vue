<template>
  <span class="explicit-badge" title="Explicit lyrics" aria-label="Explicit">E</span>
</template>

<style scoped>
.explicit-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: rgb(var(--v-theme-surface));
  background: rgb(var(--v-theme-on-surface-variant));
}
</style>