import React, { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isPausedError: boolean;
}

export class ConvexErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isPausedError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a paused deployment error
    const isPausedError = error?.message?.includes('paused') || 
                          error?.message?.includes('Cannot run functions while');
    
    return {
      hasError: true,
      error,
      isPausedError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ConvexErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isPausedError && this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.isPausedError) {
        return (
          <div className="flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
              <div className="text-yellow-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Deployment Paused
              </h2>
              <p className="text-muted-foreground mb-4">
                This deployment is currently paused. Resume the deployment in the dashboard settings to allow functions to run.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }

      // For other errors, show generic error
      return (
        <div className="flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

