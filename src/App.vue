<script setup></script>

<template>
  <v-app>
    <v-app-bar title="Cadense">
      <v-btn to="/" text="Home" />
      <v-btn to="/login" text="Sign-In" />
      <v-btn color="primary" to="/register" text="Create Account" />
      <v-btn to="/dashboard" text="Dashboard" />
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <!-- <v-footer>

    </v-footer> -->
  </v-app>
</template>

<style scoped></style>
