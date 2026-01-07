/**
 * Core environment variable utilities
 * Provides platform-agnostic ways to read environment variables across Next.js and Vite
 */

import { isNextJSEnv } from './platform';

/**
 * Utility to safely get environment variables in Next.js and Vite
 * Checks NEXT_PUBLIC_ and VITE_ prefixes for maximum compatibility
 */
export const getEnvVar = (name: string): string | undefined => {
  // Remove any existing prefix to avoid double-prefixing
  const baseName = name.replace(/^(NEXT_PUBLIC_|VITE_)/, '');
  
  // Try process.env first (works in Next.js and Vite)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // 1. Try NEXT_PUBLIC_ prefix (Next.js)
      const nextPublicName = `NEXT_PUBLIC_${baseName}`;
      const nextPublicValue = process.env[nextPublicName];
      if (nextPublicValue && nextPublicValue.trim()) {
        return nextPublicValue.trim();
      }
      
      // 2. Try VITE_ prefix (Vite, but also works as fallback)
      const viteName = `VITE_${baseName}`;
      const viteValue = process.env[viteName];
      if (viteValue && viteValue.trim()) {
        return viteValue.trim();
      }
      
      // 3. Fallback to original name (if it already had a prefix, try that)
      if (name !== baseName) {
        const originalValue = process.env[name];
        if (originalValue && originalValue.trim()) {
          return originalValue.trim();
        }
      }
      
      // 4. Try non-prefixed version
      const nonPrefixedValue = process.env[baseName];
      if (nonPrefixedValue && nonPrefixedValue.trim()) {
        return nonPrefixedValue.trim();
      }
    }
  } catch (e) {
    // Ignore if process is not defined
  }

  // For Vite runtime, check import.meta.env (skip if Next.js to reduce webpack warnings)
  const isNext = isNextJSEnv();
  if (!isNext) {
    // Only check import.meta if we're definitely not in Next.js
    try {
      // Direct access for Vite - webpack won't analyze this if isNext is true at build time
      // @ts-ignore - import.meta.env is available in Vite
      if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
        const viteName = `VITE_${baseName}`;
        // @ts-ignore
        const value = import.meta.env[viteName] || import.meta.env[baseName];
        if (value && String(value).trim()) {
          return String(value).trim();
        }
      }
    } catch (e) {
      // Ignore if import.meta is not available
    }
  }

  return undefined;
};
