/**
 * Utility functions for API operations
 * Helper functions that are used across multiple modules
 */

import { CONVEX_CLOUD_DOMAIN } from '../constants';

/**
 * Extract deployment name from deployment URL
 * @param deploymentUrl - The full deployment URL (e.g., https://my-deployment.convex.cloud)
 * @returns The deployment name (e.g., "my-deployment")
 */
export function extractDeploymentName(deploymentUrl: string | undefined): string | undefined {
  if (!deploymentUrl) return undefined;
  
  try {
    const url = new URL(deploymentUrl);
    // Extract deployment name from hostname
    // Format: https://[deployment-name].convex.cloud
    const hostname = url.hostname;
    const match = hostname.match(`^([^.]+)\.${CONVEX_CLOUD_DOMAIN}$`);
    return match ? match[1] : undefined;
  } catch {
    // Fallback: try to extract from string directly
    const match = deploymentUrl.match(`https?://([^.]+)\.${CONVEX_CLOUD_DOMAIN}`);
    return match ? match[1] : undefined;
  }
}

/**
 * Extract project name from deployment URL
 * NOTE: This is NOT reliable! Deployment names like "mild-rooster-137" 
 * are randomly generated and don't contain the actual project name.
 * Use this only as a last resort fallback.
 * @param deploymentUrl - The full deployment URL
 * @returns undefined - we cannot reliably extract project names from deployment URLs
 */
export function extractProjectName(_deploymentUrl: string | undefined): string | undefined {
  // Don't try to extract project name from deployment URL
  // Deployment names are random and don't reflect project names
  return undefined;
}

/**
 * Parse team and project slugs from access token
 * Token format: "project:{teamSlug}:{projectSlug}|{token}"
 * @param authToken - The authentication token to parse
 * @returns The team and project slugs
 */
export function parseAccessToken(authToken: string | undefined): { teamSlug?: string; projectSlug?: string } {
  if (!authToken) return {};
  
  // Token format: "project:{teamSlug}:{projectSlug}|{token}"
  const match = authToken.match(/^project:([^:]+):([^|]+)\|/);
  if (match) {
    return {
      teamSlug: match[1],
      projectSlug: match[2],
    };
  }
  
  return {};
}

/**
 * Try to get team token from environment variables
 * This is useful for backup operations which require team tokens
 * Checks: process.env.CONVEX_ACCESS_TOKEN, import.meta.env.VITE_CONVEX_ACCESS_TOKEN, etc.
 * @returns The team token
 */
export function getTeamTokenFromEnv(): string | null {
  // Check in order of priority:
  // 1. Build-time injected value (from webpack DefinePlugin for Next.js or Vite define)
  // 2. process.env.CONVEX_ACCESS_TOKEN (works if exposed via next.config.js env config)
  // 3. process.env.NEXT_PUBLIC_CONVEX_ACCESS_TOKEN (Next.js client-side)
  // 4. process.env.VITE_CONVEX_ACCESS_TOKEN (Vite client-side)
  // 5. import.meta.env (Vite only, skip for Next.js)
  
  // 1. Try build-time injected value first (highest priority)
  try {
    // @ts-ignore - This is injected by webpack DefinePlugin (Next.js) or Vite define at build time
    const buildTimeToken = typeof __CONVEX_ACCESS_TOKEN__ !== 'undefined' ? __CONVEX_ACCESS_TOKEN__ : null;
    if (buildTimeToken && typeof buildTimeToken === 'string' && buildTimeToken.trim()) {
      return buildTimeToken.trim();
    }
  } catch {
    // Ignore if __CONVEX_ACCESS_TOKEN__ is not defined
  }

  // Check if we're in Next.js
  const isNext = (() => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        if ((window as any).__NEXT_DATA__) return true;
      } catch {}
    }
    try {
      if (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME) return true;
    } catch {}
    return false;
  })();

  // 2. Try process.env - ALWAYS check CONVEX_ACCESS_TOKEN first (works if exposed via next.config.js)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Check CONVEX_ACCESS_TOKEN first (works if exposed in next.config.js env config)
      const accessToken = process.env.CONVEX_ACCESS_TOKEN;
      if (accessToken && typeof accessToken === 'string' && accessToken.trim()) {
        return accessToken.trim();
      }
      
      // For Next.js, also check NEXT_PUBLIC_ prefix
      if (isNext) {
        const nextToken = process.env.NEXT_PUBLIC_CONVEX_ACCESS_TOKEN;
        if (nextToken && typeof nextToken === 'string' && nextToken.trim()) {
          return nextToken.trim();
        }
      }
      
      // Also check VITE_ prefix (works in both)
      const viteToken = process.env.VITE_CONVEX_ACCESS_TOKEN;
      if (viteToken && typeof viteToken === 'string' && viteToken.trim()) {
        return viteToken.trim();
      }
    }
  } catch {
    // Ignore
  }

  // 3. Only try import.meta if NOT in Next.js (to avoid webpack warnings)
  if (!isNext) {
    try {
      // Direct access for Vite - webpack won't analyze this if isNext is true at build time
      // @ts-ignore - import.meta.env is available in Vite
      if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
        // @ts-ignore
        const token = import.meta.env.VITE_CONVEX_ACCESS_TOKEN || import.meta.env.CONVEX_ACCESS_TOKEN;
        if (token && typeof token === 'string' && token.trim()) {
          return token.trim();
        }
      }
    } catch {
      // Ignore
    }
  }

  // Try window.env or window.__ENV__ (some bundlers expose env this way)
  try {
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.env?.CONVEX_ACCESS_TOKEN) {
        const token = win.env.CONVEX_ACCESS_TOKEN;
        if (token && typeof token === 'string' && token.trim()) {
          return token.trim();
        }
      }
      if (win.__ENV__?.CONVEX_ACCESS_TOKEN) {
        const token = win.__ENV__.CONVEX_ACCESS_TOKEN;
        if (token && typeof token === 'string' && token.trim()) {
          return token.trim();
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Cache to track deployments that return 403 for table columns endpoint
 * Persisted in sessionStorage to survive page reloads
 * @returns The set of deployment names that return 403 for table columns endpoint
 */
export function getTableColumnsForbiddenCache(): Set<string> {
  try {
    const cached = sessionStorage.getItem('tableColumnsForbiddenCache');
    return cached ? new Set(JSON.parse(cached)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

/**
 * Set the cache of deployment names that return 403 for table columns endpoint
 * @param cache - The set of deployment names that return 403 for table columns endpoint
 */
export function setTableColumnsForbiddenCache(cache: Set<string>) {
  try {
    sessionStorage.setItem('tableColumnsForbiddenCache', JSON.stringify(Array.from(cache)));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Merge existing table fields with additional columns from API
 * @param existingFields - The existing table fields
 * @param extraColumns - The additional columns to merge
 * @returns The merged table fields
 */
export function mergeFieldsWithColumns(
  existingFields: any[],
  extraColumns?: string[],
): any[] {
  const fieldMap = new Map<string, any>();
  existingFields.forEach((field) => {
    if (field?.fieldName) {
      fieldMap.set(field.fieldName, field);
    }
  });

  const addPlaceholderField = (fieldName?: string) => {
    if (!fieldName || fieldMap.has(fieldName)) {
      return;
    }
    fieldMap.set(fieldName, {
      fieldName,
      optional: true,
      shape: { type: 'string' },
    });
  };

  ['_id', '_creationTime'].forEach(addPlaceholderField);
  extraColumns?.forEach(addPlaceholderField);

  return Array.from(fieldMap.values());
}
