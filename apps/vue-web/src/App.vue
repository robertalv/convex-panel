<template>
  <main>
    <h1>Convex Panel - Vue Test</h1>
    <p>This is a test application for Convex Panel with Vue.</p>
    <p>Convex URL: {{ convexUrl || 'Not set' }}</p>
  </main>

  <ConvexPanel
    v-if="convexUrl"
    :convex-url="convexUrl"
    :access-token="accessToken || undefined"
  />
</template>

<script setup lang="ts">
import ConvexPanel from 'convex-panel/vue';

const convexUrl = import.meta.env.VITE_CONVEX_URL || '';
const accessToken = import.meta.env.VITE_CONVEX_ACCESS_TOKEN || '';

if (!convexUrl) {
  console.error('VITE_CONVEX_URL is required for Convex Panel to connect.');
}
</script>

<style scoped>
main {
  padding: 2rem;
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.87);
}

p {
  margin: 1rem 0;
  color: rgba(255, 255, 255, 0.7);
}
</style>

