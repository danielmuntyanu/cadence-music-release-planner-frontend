<script setup>
import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>