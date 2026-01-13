/// <reference types="vite/client" />

declare const __GIT_COMMIT_HASH__: string;
declare const __GIT_REPO_URL__: string;
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    readonly VITE_CONVEX_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
