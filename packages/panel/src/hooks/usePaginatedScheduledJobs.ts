import { ConvexReactClient } from "convex/react";
import { useEffect, useState, useRef, useCallback } from "react";
// import { extractDeploymentName, extractProjectName, fetchDeploymentMetadata } from "../utils/api";

export const SCHEDULED_JOBS_PAGE_SIZE = 50;
const POLLING_INTERVAL = 2000;

// Current Deployment info 
// type CurrentDeployment = {
//   deploymentName?: string;
//   projectName?: string;
//   deploymentType?: "prod" | "dev" | "preview";
//   kind?: "local" | "cloud";
// } | undefined;

// TODO: Save this in local storage
// const fetchMetadata = async (adminClient: ConvexReactClient, deploymentUrl: string,) => {
//   let metadata: CurrentDeployment = undefined
//   try {
//     const _metadata = await fetchDeploymentMetadata(adminClient, deploymentUrl, undefined);
//     metadata = _metadata
//   } catch (error) {
//     console.debug('Failed to fetch deployment metadata:', error);
//     metadata = {
//       deploymentName: extractDeploymentName(deploymentUrl),
//       projectName: extractProjectName(deploymentUrl),
//       deploymentType: 'dev',
//       kind: 'cloud',
//     }

//   }

//   return metadata;
// };

export function usePaginatedScheduledJobs(udfPath: string | undefined, adminClient: ConvexReactClient, isPausedUser: boolean = false) {
  // const { deployment, error: errorDeployment, loading: loadingDeployment } = useCurrentDeployment(adminClient, deploymentUrl)
  const isDeploymentPaused = useIsDeploymentPaused(adminClient)
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, ] = useState<"LoadingFirstPage" | "LoadingMore" | "Exhausted" | "CanLoadMore">("LoadingFirstPage")
  const [, setRefreshTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef(false);

  const fetchResults = useCallback(async () => {
    if (!adminClient || isDeploymentPaused || isPausedUser) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);
      setError(null);
      const data = await adminClient.query(
        "_system/frontend/paginatedScheduledJobs:default" as any,
        {
          paginationOpts: {
            numItems: SCHEDULED_JOBS_PAGE_SIZE,
            cursor: null,
          },
          udfPath: udfPath ?? undefined,
        }
      );
      
      if (signal.aborted) return;
      
      setResults(data);
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setLoading(false);
    }
  }, [adminClient, isDeploymentPaused, isPausedUser, udfPath]);

  useEffect(() => {
    if (isPausedUser || isDeploymentPaused || !adminClient) {
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    isStreamingRef.current = true;

    fetchResults();

    const intervalId = setInterval(() => {
      if (isStreamingRef.current && !isPausedUser && !isDeploymentPaused) {
        fetchResults();
      }
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchResults, isPausedUser, isDeploymentPaused, adminClient]);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    fetchResults();
  }, [fetchResults]);

  // TODO: Grab paused data results
  // const {
  //   pausedData,
  //   isLoadingPausedData,
  //   isRateLimited,
  //   togglePaused,
  //   reload,
  // } = usePausedLiveData({
  //   results,
  //   args,
  //   storageKey: "pauseLiveScheduledJobs",
  //   udfName: udfs.paginatedScheduledJobs.default,
  //   numItems: SCHEDULED_JOBS_PAGE_SIZE,
  // });

  // return {
  //   jobs: isPaused ? pausedData : results,
  //   status: isPaused
  //     ? isLoadingPausedData
  //       ? "LoadingFirstPage"
  //       : "Exhausted"
  //     : status,
  //   isPaused,
  //   isLoadingPausedData,
  //   isRateLimited,
  //   loadMore,
  //   togglePaused,
  //   reload,
  // };

  return {
    jobs: isDeploymentPaused ? null : results, // this is null for now, gonna switch it soon
    status: status,
    isPaused: isDeploymentPaused,
    isLoading: loading,
    error: error,
    refetch,
  }
}

// const useCurrentDeployment = (adminClient: ConvexReactClient, deploymentUrl: string,) => {
//   const [deployment, setDeployment] = useState<CurrentDeployment | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setLoading(true);
//         const data = await fetchMetadata(adminClient, deploymentUrl,);
//         setDeployment(data);
//       } catch (err: unknown) {
//         setError(err as Error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [adminClient, deploymentUrl,]);

//   return {
//     deployment,
//     error,
//     loading
//   }
// }

// Type of backendState table
type BackendStateTableDoc = {
  state: "paused" | "running" | "disabled"
}

export function useIsDeploymentPaused(adminClient: ConvexReactClient) {
  const [deploymentState, setDeploymentState] = useState<BackendStateTableDoc | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchState = async () => {
      try {
        const state = await adminClient.query(
          "_system/frontend/deploymentState:deploymentState" as any
        ) as BackendStateTableDoc;

        if (!cancelled) {
          setDeploymentState(state);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch deployment state:", error);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchState();

    return () => {
      cancelled = true;
    };
  }, [adminClient]);

  if (loading || deploymentState === undefined) {
    return undefined;
  }

  return deploymentState.state === "paused";
}

export const useCronsJobsHistory =(adminClient: ConvexReactClient)=>{
  if(!adminClient) return [];
  const data = pullDataQuery(adminClient, "_system/frontend/listCronJobRuns:default")
  return data;
}

export const pullDataQuery = async (adminClient: ConvexReactClient, fnPath:string) => {
  try{
    // if this returns an error, you need to check the path
    const queryResult = await adminClient.query(fnPath as any);
    return queryResult;
  } catch(e){
    console.error(e, "at" + fnPath)
  }
}