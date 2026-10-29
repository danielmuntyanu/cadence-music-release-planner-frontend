<script setup>
import AppHeader from '@/components/AppHeader.vue'
import PlayerBar from '@/components/player/PlayerBar.vue'
</script>

<template>
  <v-app>
    <AppHeader />
    <v-main>
      <router-view />
    </v-main>
    <!-- Outside the router view, so playback continues when the page changes -->
    <PlayerBar />
  </v-app>
</template>