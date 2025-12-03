<script lang="ts">
  import ConvexPanel from 'convex-panel/svelte';
  
  const convexUrl = import.meta.env.VITE_CONVEX_URL || '';
  const accessToken = import.meta.env.VITE_CONVEX_ACCESS_TOKEN || '';
  
  if (!convexUrl) {
    console.error('VITE_CONVEX_URL is required for Convex Panel to connect.');
  }
</script>

<main>
  <h1>Convex Panel - Svelte Test</h1>
  <p>This is a test application for Convex Panel with Svelte.</p>
  <p>Convex URL: {convexUrl || 'Not set'}</p>
</main>

{#if convexUrl}
  <ConvexPanel {convexUrl} accessToken={accessToken || undefined} />
{/if}

<style>
  :global(main) {
    padding: 2rem;
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  :global(h1) {
    font-size: 3.2em;
    line-height: 1.1;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.87);
  }
  
  :global(p) {
    margin: 1rem 0;
    color: rgba(255, 255, 255, 0.7);
  }
</style>

