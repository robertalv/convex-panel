/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_CONVEX_OAUTH_CLIENT_ID?: string;
  readonly VITE_CONVEX_TOKEN_EXCHANGE_URL?: string;
  readonly VITE_ACCESS_TOKEN?: string;
  readonly VITE_CONVEX_ACCESS_TOKEN?: string;
  readonly VITE_DEPLOY_KEY?: string;
  readonly VITE_CONVEX_DEPLOY_KEY?: string;
  readonly VITE_CONVEX_OAUTH_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

