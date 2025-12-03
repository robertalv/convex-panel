<template>
  <div ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import ConvexPanel from '../ConvexPanel';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import type { ConvexPanelProps } from '../ConvexPanel';

interface Props {
  convexUrl: string;
  accessToken?: string;
  [key: string]: any;
}

const props = withDefaults(defineProps<Props>(), {
  accessToken: undefined,
});

const container = ref<HTMLDivElement | null>(null);
let reactRoot: Root | null = null;
const convex = new ConvexReactClient(props.convexUrl);

onMounted(() => {
  if (container.value) {
    reactRoot = createRoot(container.value);
    reactRoot.render(
      React.createElement(
        ConvexProvider,
        { client: convex },
        React.createElement(ConvexPanel, {
          accessToken: props.accessToken,
        })
      )
    );
  }
});

onUnmounted(() => {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
});

// Update React component when props change
watch(
  () => props.accessToken,
  () => {
    if (reactRoot && container.value) {
      reactRoot.render(
        React.createElement(
          ConvexProvider,
          { client: convex },
          React.createElement(ConvexPanel, {
            accessToken: props.accessToken,
          })
        )
      );
    }
  }
);
</script>

<style scoped>
div {
  width: 100%;
  height: 100%;
}
</style>

