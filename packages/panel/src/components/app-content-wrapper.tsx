import React from 'react';
import type { ReactNode } from 'react';
import { AppErrorBoundary } from './app-error-boundary';

interface AppContentWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Wrapper component that provides error boundary for app content
 * 
 * Use this to wrap your app content so that if it crashes,
 * the ConvexPanel will remain visible.
 * 
 * @example
 * ```tsx
 * import { ConvexProvider } from 'convex/react';
 * import ConvexPanel, { AppContentWrapper } from 'convex-panel/react';
 * 
 * function App() {
 *   return (
 *     <ConvexProvider client={convex}>
 *       <AppContentWrapper>
 *         <YourAppContent />
 *       </AppContentWrapper>
 *       <ConvexPanel />
 *     </ConvexProvider>
 *   );
 * }
 * ```
 */
export const AppContentWrapper: React.FC<AppContentWrapperProps> = ({
  children,
  fallback,
  onError,
}) => {
  return (
    <AppErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </AppErrorBoundary>
  );
};

