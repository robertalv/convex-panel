<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ConvexReactClient, ConvexProvider } from 'convex/react';
  import ConvexPanel from '../ConvexPanel';
  import { createRoot, type Root } from 'react-dom/client';
  import React from 'react';
  import type { ConvexPanelProps } from '../ConvexPanel';

  export let convexUrl: string;
  export let accessToken: string | undefined = undefined;
  export let props: ConvexPanelProps = {};

  let container: HTMLDivElement;
  let reactRoot: Root | null = null;
  const convex = new ConvexReactClient(convexUrl);

  // Extract props to pass to ConvexPanel, excluding URL-related props
  // ConvexPanel will extract deployUrl from ConvexProvider context automatically
  let panelProps: ConvexPanelProps;
  $: {
    const { deployUrl, convexUrl: _, ...restProps } = props;
    panelProps = {
      ...restProps,
      accessToken,
    };
  }

  onMount(() => {
    if (container) {
      reactRoot = createRoot(container);
      reactRoot.render(
        React.createElement(
          ConvexProvider,
          { client: convex },
          React.createElement(ConvexPanel, panelProps)
        )
      );
    }
  });

  onDestroy(() => {
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
  });

  // Update React component when props change
  $: if (reactRoot && container) {
    reactRoot.render(
      React.createElement(
        ConvexProvider,
        { client: convex },
        React.createElement(ConvexPanel, panelProps)
      )
    );
  }
</script>

<div bind:this={container}></div>

<style>
  div {
    width: 100%;
    height: 100%;
  }
</style>

