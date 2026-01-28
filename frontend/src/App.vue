<script setup lang="ts">
import { RouterView } from 'vue-router'
// import HelloWorld from './components/HelloWorld.vue'
import NavBar from './components/NavBar.vue' 
</script>

<template>
  <div class="app-container">
    <!-- 🚀 Use your NavBar component -->
    <NavBar />
    
    <!-- Main content (your pages render here) -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  /* 👇 FULL WIDTH - No gaps */
  max-width: 100vw !important;
  width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  left: 0 !important;
}

/* Navbar spacing */
.main-content {
  /* Content stays readable */
  padding: clamp(1.5rem, 4vw, 3rem);
  margin: 0 auto;
  max-width: 1400px;
  min-height: calc(100vh - 80px); /* Navbar height */
}
</style>
