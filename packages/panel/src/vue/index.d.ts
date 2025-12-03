/**
 * Vue entry point type declarations for Convex Panel
 * 
 * Manual type declarations for Vue component exports.
 * This file is needed because tsup cannot generate types for Vue SFC exports.
 */

import type { DefineComponent } from 'vue';

// Define the Vue component type based on the props interface
interface ConvexPanelVueComponent extends DefineComponent<{
  convexUrl: string;
  accessToken?: string;
  [key: string]: any;
}> {}

// Export the component - these will resolve to the actual Vue component at runtime
declare const ConvexPanel: ConvexPanelVueComponent;
export { ConvexPanel };
export default ConvexPanel;

// Re-export types from the main index
export type { ConvexPanelProps } from '../index';
export type {
  UseOAuthReturn,
  Theme,
  OAuthConfig,
  OAuthToken,
  TokenScope,
} from '../index';

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