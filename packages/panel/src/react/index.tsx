/**
 * React/Vite entry point for Convex Panel
 * 
 * Provides simple wrapper for React and Vite applications.
 * No SSR handling needed as these are client-side only.
 * 
 * Usage:
 * ```tsx
 * import ConvexPanel from 'convex-panel/react';
 * 
 * function App() {
 *   return <ConvexPanel />;
 * }
 * ```
 */

export { ConvexPanelReact as ConvexPanel, ConvexPanelReact } from './ConvexPanelReact';
export type { ConvexPanelProps } from '../ConvexPanel';
export { default } from './ConvexPanelReact';

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

