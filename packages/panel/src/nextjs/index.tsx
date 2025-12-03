"use client";

/**
 * Next.js entry point for Convex Panel
 * 
 * Provides optimized wrapper for Next.js applications with proper SSR handling.
 * 
 * Usage:
 * ```tsx
 * import ConvexPanel from 'convex-panel/nextjs';
 * 
 * export default function App() {
 *   return <ConvexPanel />;
 * }
 * ```
 */

export { ConvexPanelNext as ConvexPanel, ConvexPanelNext } from './ConvexPanelNext';
export type { ConvexPanelProps } from '../ConvexPanel';
export { default } from './ConvexPanelNext';

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

