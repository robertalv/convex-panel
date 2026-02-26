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
  // Refetch intervals - only active when:
  // 1. User is on the relevant route (via useRouteAwareFetching)
  // 2. User is active (via useIdleAwareFetching)
  // 3. Tab is visible (via useVisibilityRefetch)
  health: 30 * 1000, // 30 seconds for health metrics
  // Top-K metrics (failure rate, cache hit rate) - match official dashboard at 2.5s
  healthTopK: 2.5 * 1000, // 2.5 seconds for real-time top-K metrics
  // Scheduler lag - match official dashboard at 60s (minute-level granularity)
  schedulerLag: 60 * 1000, // 60 seconds for scheduler lag
  functionStats: 60 * 1000, // 1 minute for function statistics
  schedules: 30 * 1000, // 30 seconds for scheduled/cron jobs
  insights: 60 * 1000, // 1 minute for insights
  deploymentStatus: 30 * 1000, // 30 seconds for deployment status
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
