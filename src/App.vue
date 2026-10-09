<script setup>
import { computed } from 'vue';
import { useTheme } from 'vuetify';

const theme = useTheme()

const isDark = computed(() => {
  return theme.name.value === 'dark'
})

</script>

<template>
  <v-app>
    <v-app-bar title="Cadense">
      <v-btn to="/" text="Home" />
      <v-btn to="/dashboard" text="Dashboard" />
      <v-btn to="/login" text="Sign-In" />
      <v-btn variant="tonal" color="primary" to="/register" text="Create Account" />
      <v-icon-btn 
        :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'" 
        @click="theme.toggle()" 
      />
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <!-- <v-footer>

    </v-footer> -->
  </v-app>
</template>

<style scoped></style>
