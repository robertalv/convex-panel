/**
 * Convex-specific configuration utilities
 * Handles retrieving Convex URL from various environment sources
 */

// Build-time injected variables (replaced at build time)
declare const __NEXT_PUBLIC_CONVEX_URL__: string | undefined;

import { getEnvVar } from './core';

/**
 * Get Convex URL from environment or provided value
 * For Next.js: checks NEXT_PUBLIC_CONVEX_URL
 * For Vite: checks VITE_CONVEX_URL
 */
export const getConvexUrl = (provided?: string): string | undefined => {
  if (provided) return provided;
  
  // Check in order of priority:
  // 1. Build-time injected value (from webpack DefinePlugin for Next.js)
  // 2. process.env.NEXT_PUBLIC_CONVEX_URL (Next.js) - ALWAYS check this first
  // 3. process.env.VITE_CONVEX_URL (Vite) - only if NEXT_PUBLIC_ not found
  // 4. getEnvVar() which checks all prefixes
  
  // 1. Check build-time injected value first
  try {
    // @ts-ignore - This is injected by webpack DefinePlugin at build time
    const buildTimeUrl = typeof __NEXT_PUBLIC_CONVEX_URL__ !== 'undefined' ? __NEXT_PUBLIC_CONVEX_URL__ : null;
    if (buildTimeUrl && typeof buildTimeUrl === 'string' && buildTimeUrl.trim()) {
      return buildTimeUrl.trim();
    }
  } catch {
    // Ignore if not defined
  }
  
  // 2. Check process.env - ALWAYS check NEXT_PUBLIC_ first
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Always check NEXT_PUBLIC_ prefix first (Next.js)
      const nextPublicUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (nextPublicUrl && nextPublicUrl.trim()) {
        return nextPublicUrl.trim();
      }
      
      // Check VITE_ prefix as fallback (only if NEXT_PUBLIC_ not found)
      const viteUrl = process.env.VITE_CONVEX_URL;
      if (viteUrl && viteUrl.trim()) {
        return viteUrl.trim();
      }
    }
  } catch {
    // Ignore process.env access errors
  }
  
  // 3. Use getEnvVar which checks NEXT_PUBLIC_ and VITE_ prefixes
  const envUrl = getEnvVar('CONVEX_URL');
  if (envUrl) return envUrl;
  
  return envUrl;
};
