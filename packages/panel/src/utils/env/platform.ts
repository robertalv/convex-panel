/**
 * Platform detection utilities
 * Used to determine the current runtime environment and avoid platform-specific issues
 */

/**
 * Check if running in Next.js environment (to avoid import.meta access)
 * This helps prevent webpack warnings when accessing import.meta in Next.js
 */
export const isNextJSEnv = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore - __NEXT_DATA__ is available in Next.js
      if ((window as any).__NEXT_DATA__) return true;
    } catch (e) {
      // Ignore
    }
  }
  
  try {
    if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME) {
      return true;
    }
  } catch (e) {
    // Ignore
  }
  
  return false;
};

/**
 * Utility to check if the current environment is development
 * Works across Next.js, Vite, and other frameworks
 */
export const isDevelopment = (): boolean => {
  // Check browser environment for development indicators
  if (typeof window !== 'undefined') {
    // Next.js development indicator
    try {
      // @ts-ignore - __NEXT_DATA__ is available in Next.js
      if (window.__NEXT_DATA__) {
        // @ts-ignore
        const nextData = window.__NEXT_DATA__;
        // @ts-ignore
        if (nextData.dev !== undefined) {
          // @ts-ignore
          return nextData.dev === true;
        }
      }
    } catch (e) {
      // Ignore if __NEXT_DATA__ is not available
    }

    // Check for localhost/127.0.0.1 which typically indicates development
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '0.0.0.0') {
      // Additional check: if not explicitly production, assume development
      try {
        if (typeof process !== 'undefined' && process.env) {
          const nodeEnv = process.env.NODE_ENV;
          // Only return false if explicitly production
          if (nodeEnv === 'production') return false;
        }
      } catch (e) {
        // Ignore process.env errors
      }
      // On localhost without explicit production flag, assume development
      return true;
    }

    // Check if running on a development port (common Next.js dev ports)
    const port = window.location.port;
    if (port && (port === '3000' || port === '3001' || port === '5173' || port === '5174')) {
      // Likely a development server, but double-check NODE_ENV
      try {
        if (typeof process !== 'undefined' && process.env) {
          const nodeEnv = process.env.NODE_ENV;
          if (nodeEnv === 'production') return false;
        }
      } catch (e) {
        // Ignore process.env errors
      }
      return true;
    }
  }

  // For Vite, check import.meta.env (skip if Next.js to reduce webpack warnings)
  const isNext = isNextJSEnv();
  if (!isNext) {
    try {
      // Direct access for Vite - webpack won't analyze this if isNext is true at build time
      // @ts-ignore - import.meta.env is available in Vite
      if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
        // @ts-ignore
        if (import.meta.env.DEV !== undefined) {
          // @ts-ignore
          return import.meta.env.DEV === true;
        }
        // @ts-ignore
        if (import.meta.env.MODE !== undefined) {
          // @ts-ignore
          return import.meta.env.MODE === 'development';
        }
      }
    } catch (e) {
      // Ignore if import.meta is not available
    }
  }

  // Try Node.js style (Next.js, Remix, TanStack Start, Webpack, etc.)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'development') return true;
      if (nodeEnv === 'production') return false;
    }
  } catch (e) {
    // Ignore if process is not defined
  }

  // Last resort: if we're in a browser and can't determine, default to true
  // This ensures the panel shows up for testing and development
  if (typeof window !== 'undefined') {
    // In browser environment, default to true unless explicitly production
    return true;
  }

  return false;
};
