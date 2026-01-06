/**
 * Sets up global error handling for Convex-related errors
 * This prevents paused deployment errors and other Convex errors from crashing the app
 */
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') {
    return;
  }

  // Only set up once
  if ((window as any).__CONVEX_PANEL_ERROR_HANDLER_SETUP__) {
    return;
  }
  (window as any).__CONVEX_PANEL_ERROR_HANDLER_SETUP__ = true;

  // Handle unhandled promise rejections (common for Convex query/mutation errors)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if this is a paused deployment error
    if (error?.message?.includes('paused') || 
        error?.message?.includes('Cannot run functions while')) {
      // Prevent the error from crashing the app
      event.preventDefault();
      console.warn('[ConvexPanel] Deployment is paused:', error.message);
    }
    
    // Check for other Convex-related errors that shouldn't crash the app
    if (error?.message?.includes('[CONVEX') || 
        error?.message?.includes('Convex') ||
        error?.stack?.includes('convex')) {
      // Log but don't crash - let the error boundary handle it
      console.warn('[ConvexPanel] Caught Convex error:', error.message);
    }
  });

  // Handle general errors (fallback)
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    // Check if this is a paused deployment error
    if (error?.message?.includes('paused') || 
        error?.message?.includes('Cannot run functions while')) {
      // Prevent the error from crashing the app
      event.preventDefault();
      console.warn('[ConvexPanel] Deployment is paused:', error.message);
    }
  });
}











