/**
 * Svelte entry point for Convex Panel
 * 
 * Provides Svelte component wrapper for React-based ConvexPanel.
 * Uses React mounting to bridge React and Svelte.
 * 
 * Usage:
 * ```svelte
 * <script>
 *   import ConvexPanel from 'convex-panel/svelte';
 *   const convexUrl = import.meta.env.VITE_CONVEX_URL;
 * </script>
 * 
 * <ConvexPanel {convexUrl} />
 * ```
 * 
 * Or import the component directly:
 * ```svelte
 * <script>
 *   import ConvexPanel from 'convex-panel/svelte/ConvexPanelSvelte.svelte';
 *   const convexUrl = import.meta.env.VITE_CONVEX_URL;
 * </script>
 * 
 * <ConvexPanel {convexUrl} />
 * ```
 */

// Re-export types
export type { ConvexPanelProps } from '../ConvexPanel';

// Re-export other useful exports
export {
  useOAuth,
  ThemeProvider,
  useTheme,
  useThemeSafe,
  isDevelopment,
  BottomSheet,
  AuthPanel,
  AppErrorBoundary,
  AppContentWrapper,
  LogType,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  handleOAuthCallback,
  getStoredToken,
  storeToken,
  clearToken,
} from '../index';
export type {
  UseOAuthReturn,
  Theme,
  OAuthConfig,
  OAuthToken,
  TokenScope,
} from '../index';

