/**
 * Svelte entry point type declarations for Convex Panel
 * 
 * Manual type declarations for Svelte component exports.
 * This file is needed because tsup cannot generate types for Svelte SFC exports.
 */

import type { Component } from 'svelte';
import type { ConvexPanelProps } from '../ConvexPanel';

// Define the Svelte component type based on the component's props
interface ConvexPanelSvelteComponentProps {
  convexUrl: string;
  accessToken?: string | undefined;
  props?: ConvexPanelProps;
}

// Export the component - this will resolve to the actual Svelte component at runtime
// via the "svelte" export field in package.json
declare const ConvexPanel: Component<ConvexPanelSvelteComponentProps>;
export { ConvexPanel };
export default ConvexPanel;

// Re-export types from the main index
export type { ConvexPanelProps } from '../ConvexPanel';
export type {
  UseOAuthReturn,
  Theme,
  OAuthConfig,
  OAuthToken,
  TokenScope,
} from '../index';

// Re-export other useful exports (these will be resolved from the JS file)
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
