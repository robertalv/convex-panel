<!-- Svelte + React Integration Example -->
<!-- Note: This requires additional setup to mount React components in Svelte -->
<!-- Install: npm install svelte-react -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ConvexReactClient, ConvexProvider } from 'convex/react';
  import ConvexPanel from '@convex-panel';
  import { createRoot } from 'react-dom/client';
  import React from 'react';

  let container: HTMLDivElement;
  const convex = new ConvexReactClient((import.meta as any).env.VITE_CONVEX_URL);

  onMount(() => {
    if (container) {
      const root = createRoot(container);
      root.render(
        React.createElement(
          ConvexProvider,
          { client: convex },
          React.createElement(ConvexPanel)
        )
      );
    }
  });
</script>

<div bind:this={container}></div>

<style>
  div {
    width: 100%;
    height: 100%;
  }
</style>

