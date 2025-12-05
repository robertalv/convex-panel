/**
 * Environment utilities for Convex Panel
 * 
 * This module provides platform-agnostic utilities for reading environment variables
 * across Next.js, Vite, and other frameworks.
 * 
 * @module env
 */

// Import types (ensures build-time declarations are available)
export * from './types';

// Export platform detection utilities
export { isDevelopment, isNextJSEnv } from './platform';

// Export core environment utilities
export { getEnvVar, unwrapVueValue } from './core';

// Export Convex-specific configuration
export { getConvexUrl } from './convex-config';

// Export OAuth-specific configuration
export { getOAuthConfigFromEnv } from './oauth-config';
