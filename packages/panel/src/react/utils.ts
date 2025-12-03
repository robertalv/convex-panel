/**
 * React/Vite-specific utility functions
 */

/**
 * Get environment variable from Vite environment
 * Vite uses import.meta.env with VITE_ prefix
 */
export const getViteEnvVar = (name: string): string | undefined => {
  try {
    // @ts-ignore - import.meta.env is available in Vite
    // Use direct access to avoid webpack warnings about dynamic import.meta access
    if (typeof import.meta?.env !== 'undefined') {
      // Try with VITE_ prefix first (required for client-side access)
      const viteName = name.startsWith('VITE_') ? name : `VITE_${name}`;
      
      // @ts-ignore - import.meta.env is available in Vite
      const value = import.meta.env[viteName];
      
      if (value) {
        return value;
      }

      // Fallback to original name
      // @ts-ignore - import.meta.env is available in Vite
      return import.meta.env[name];
    }
  } catch (e) {
    // Ignore if import.meta.env is not available
  }

  return undefined;
};

/**
 * Check if running in Vite environment
 */
export const isVite = (): boolean => {
  try {
    // @ts-ignore - import.meta.env is available in Vite
    // Use direct access to avoid webpack warnings about dynamic import.meta access
    if (typeof import.meta?.env !== 'undefined') {
      // @ts-ignore
      return typeof import.meta.env.MODE !== 'undefined';
    }
  } catch (e) {
    // Ignore if import.meta is not defined
  }

  return false;
};

/**
 * Get Convex URL from Vite environment
 */
export const getConvexUrlFromVite = (): string | undefined => {
  return getViteEnvVar('CONVEX_URL');
};

