/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'convex-panel/vue' {
  import type { DefineComponent } from 'vue';
  const ConvexPanel: DefineComponent<{
    convexUrl: string;
    accessToken?: string;
  }>;
  export default ConvexPanel;
}

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}



