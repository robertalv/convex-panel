import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const STALE_TIME = {
  schemas: 5 * 60 * 1000,
  documents: 2 * 60 * 1000,
  tables: 5 * 60 * 1000,
  indexes: 5 * 60 * 1000,
  components: 10 * 60 * 1000,
  // Increased stale times for health metrics to reduce unnecessary refetches
  health: 2 * 60 * 1000, // 2 minutes - data is considered fresh for longer
  functionStats: 2 * 60 * 1000, // 2 minutes
  insights: 5 * 60 * 1000, // 5 minutes - insights don't change frequently
  functions: 5 * 60 * 1000,
  functionCode: 10 * 60 * 1000,
};

const REFETCH_INTERVAL = {
  // Increased intervals to reduce constant refreshing
  // These will only refetch when tab is visible (handled by useVisibilityRefetch)
  health: 30 * 1000, // 30 seconds instead of 5 seconds
  functionStats: 60 * 1000, // 1 minute instead of 30 seconds
};

const GC_TIME = 10 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.documents,
      gcTime: GC_TIME,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export { STALE_TIME, REFETCH_INTERVAL };

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
