import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const STALE_TIME = {
  schemas: 5 * 60 * 1000,
  documents: 2 * 60 * 1000,
  tables: 5 * 60 * 1000,
  indexes: 5 * 60 * 1000,
  components: 10 * 60 * 1000,
  health: 30 * 1000,
  functionStats: 30 * 1000,
  insights: 60 * 1000,
  functions: 5 * 60 * 1000,
  functionCode: 10 * 60 * 1000,
};

const REFETCH_INTERVAL = {
  health: 5 * 1000,
  functionStats: 30 * 1000,
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
