/**
 * React Query Context
 * Provides QueryClient for data caching across the application.
 * Configured for in-memory caching with optimized stale times.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Cache configuration
export const STALE_TIME = {
  // Health metrics - cache for 30 seconds (monitoring data)
  health: 30 * 1000,
  // Function stats - cache for 30 seconds
  functionStats: 30 * 1000,
  // Insights - cache for 1 minute
  insights: 60 * 1000,
};

// Refetch intervals for auto-refresh while view is active
export const REFETCH_INTERVAL = {
  // Health metrics refresh every 30 seconds
  health: 30 * 1000,
  // Function stats refresh every 30 seconds
  functionStats: 30 * 1000,
};

// Garbage collection time - keep unused data for 10 minutes
const GC_TIME = 10 * 60 * 1000;

// Create a singleton QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time - 30 seconds
      staleTime: STALE_TIME.health,
      // Keep data in cache for 10 minutes after last use
      gcTime: GC_TIME,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Don't refetch on reconnect
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Export the queryClient for prefetching
export { queryClient };

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

