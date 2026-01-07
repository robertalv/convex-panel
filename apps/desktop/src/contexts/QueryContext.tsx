/**
 * React Query Context
 * Provides QueryClient for data caching across the application.
 * Configured for in-memory caching with optimized stale times.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Cache configuration
const STALE_TIME = {
  // Table schemas rarely change - cache for 5 minutes
  schemas: 5 * 60 * 1000,
  // Document data - cache for 2 minutes, background refetch
  documents: 2 * 60 * 1000,
  // Table list - cache for 5 minutes
  tables: 5 * 60 * 1000,
  // Indexes - cache for 5 minutes (rarely change)
  indexes: 5 * 60 * 1000,
  // Components - cache for 10 minutes (rarely change)
  components: 10 * 60 * 1000,
  // Health metrics - cache for 30 seconds (monitoring data)
  health: 30 * 1000,
  // Function stats - cache for 30 seconds
  functionStats: 30 * 1000,
  // Insights - cache for 1 minute
  insights: 60 * 1000,
};

// Refetch intervals for auto-refresh while view is active
const REFETCH_INTERVAL = {
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
      // Default stale time - 2 minutes
      staleTime: STALE_TIME.documents,
      // Keep data in cache for 10 minutes after last use
      gcTime: GC_TIME,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus by default (can be overridden per query)
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

// Export stale times for use in individual queries
export { STALE_TIME, REFETCH_INTERVAL };

// Export the queryClient for prefetching
export { queryClient };

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Query Provider component
 * Wraps the application with React Query's QueryClientProvider
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
