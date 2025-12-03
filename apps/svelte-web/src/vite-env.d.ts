/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}

declare module 'convex-panel/svelte' {
  import type { Component } from 'svelte';
  const ConvexPanel: Component<{
    convexUrl: string;
    accessToken?: string;
  }>;
  export default ConvexPanel;
  export type { ConvexPanelProps } from 'convex-panel';
}

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

