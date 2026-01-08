/**
 * Environment utilities for Convex Panel
 * 
 * This file re-exports all utilities from the modular env/ directory structure.
 * It maintains backward compatibility with existing imports while organizing
 * the code into focused, maintainable modules.
 * 
 * The modular structure is organized as:
 *   - './env/platform' for platform detection (isDevelopment, isNextJSEnv)
 *   - './env/core' for core utilities (getEnvVar)
 *   - './env/convex-config' for Convex configuration (getConvexUrl)
 *   - './env/oauth-config' for OAuth configuration (getOAuthConfigFromEnv)
 */

// Re-export everything from the modular structure
export * from './env/index';