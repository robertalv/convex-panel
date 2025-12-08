/**
 * Next.js-specific utility functions
 */

/**
 * Get environment variable from Next.js environment
 * Next.js uses process.env for both server and client (with NEXT_PUBLIC_ prefix)
 */
export const getNextEnvVar = (name: string): string | undefined => {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }

  // Try with NEXT_PUBLIC_ prefix first (required for client-side access)
  const nextPublicName = name.startsWith('NEXT_PUBLIC_') ? name : `NEXT_PUBLIC_${name}`;
  const value = process.env[nextPublicName];
  
  if (value) {
    return value;
  }

  // Fallback to original name (for server-side only vars)
  return process.env[name];
};

/**
 * Check if running in Next.js environment
 */
export const isNextJS = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore - __NEXT_DATA__ is available in Next.js
      return !!window.__NEXT_DATA__;
    } catch (e) {
      // Ignore if __NEXT_DATA__ is not available
    }
  }

  // Check for Next.js-specific environment indicators
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Next.js sets NEXT_RUNTIME env var
      if (process.env.NEXT_RUNTIME) {
        return true;
      }
    }
  } catch (e) {
    // Ignore if process is not defined
  }

  return false;
};

/**
 * Get Convex URL from Next.js environment
 */
export const getConvexUrlFromNext = (): string | undefined => {
  return getNextEnvVar('CONVEX_URL');
};




