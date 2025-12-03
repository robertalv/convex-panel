/**
 * Vue entry point for Convex Panel
 * 
 * Provides Vue component wrapper for React-based ConvexPanel.
 * Uses React mounting to bridge React and Vue.
 * 
 * Usage:
 * ```vue
 * <template>
 *   <ConvexPanel :convex-url="convexUrl" :access-token="accessToken" />
 * </template>
 * 
 * <script setup lang="ts">
 *   import ConvexPanel from 'convex-panel/vue';
 *   const convexUrl = import.meta.env.VITE_CONVEX_URL;
 *   const accessToken = import.meta.env.VITE_CONVEX_ACCESS_TOKEN;
 * </script>
 * ```
 */

export { default as ConvexPanel } from './ConvexPanelVue.vue';
export { default } from './ConvexPanelVue.vue';

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

