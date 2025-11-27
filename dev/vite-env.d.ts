/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_CONVEX_TOKEN_EXCHANGE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

