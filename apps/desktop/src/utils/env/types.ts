/**
 * Build-time injected variables from webpack DefinePlugin (Next.js) or Vite define (Vite)
 * These are replaced at build time with actual values
 * 
 * These declarations need to be in each file that uses them since they're global
 * declarations that are replaced at build time.
 */

// These are globally available build-time constants
// Note: These are declared per-app in their respective vite-env.d.ts files
// to avoid redeclaration conflicts. This file documents the types but doesn't declare them.
// 
// Each app should declare these in their own env.d.ts:
// - apps/web/src/vite-env.d.ts
// - apps/nextjs-web/... (or equivalent)

declare global {
  const __NEXT_PUBLIC_CONVEX_URL__: string | undefined;
  const __NEXT_PUBLIC_OAUTH_CLIENT_ID__: string | undefined;
  const __NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL__: string | undefined;
  // Removed __CONVEX_ACCESS_TOKEN__ to avoid redeclaration with apps/web/src/vite-env.d.ts
  // const __CONVEX_ACCESS_TOKEN__: string | undefined;
  const __VITE_OAUTH_CLIENT_ID__: string | undefined;
  const __VITE_CONVEX_TOKEN_EXCHANGE_URL__: string | undefined;
}

export {};
