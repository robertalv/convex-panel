// Vue + React Integration Example
// Note: This requires additional setup to mount React components in Vue
// Install: npm install react react-dom @types/react @types/react-dom
// For Vue 3: npm install vue@^3

import React from "react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel";
import { createRoot } from "react-dom/client";

// Vue types - uncomment when Vue is installed
// import { defineComponent, onMounted, ref, h } from "vue";

// Vue component that wraps the React ConvexPanel
// Uncomment when Vue is installed:
/*
export default defineComponent({
  name: "ConvexPanelWrapper",
  setup() {
    const containerRef = ref<HTMLElement | null>(null);
    const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

    onMounted(() => {
      if (containerRef.value) {
        const root = createRoot(containerRef.value);
        root.render(
          React.createElement(ConvexProvider, { client: convex },
            React.createElement(ConvexPanel)
          )
        );
      }
    });

    return () => h("div", { ref: containerRef });
  },
});
*/

// Alternative: Use a simpler approach with a wrapper div
// This is easier but requires React to be loaded globally
/*
<template>
  <div id="convex-panel-root"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import ConvexPanel from 'convex-panel';
import { createRoot } from 'react-dom/client';

const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://your-deployment.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

onMounted(() => {
  const root = document.getElementById('convex-panel-root');
  if (root) {
    const reactRoot = createRoot(root);
    reactRoot.render(
      React.createElement(ConvexProvider, { client: convex },
        React.createElement(ConvexPanel, {
          convex,
          deployUrl: convexUrl,
          deployKey: import.meta.env.VITE_DEPLOY_KEY,
          accessToken: import.meta.env.VITE_ACCESS_TOKEN,
        })
      )
    );
  }
});
</script>
*/

