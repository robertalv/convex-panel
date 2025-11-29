import { ConvexReactClient, usePaginatedQuery } from "convex/react";
import { useEffect, useState } from "react";
import { extractDeploymentName, extractProjectName, fetchDeploymentMetadata } from "../utils/api";

export const SCHEDULED_JOBS_PAGE_SIZE = 50;

interface ScheduledJobsFn {
  udfPath: string | undefined;
  currentDeployment: string;

}

// Current Deployment info 
type CurrentDeployment = {
  deploymentName?: string;
  projectName?: string;
  deploymentType?: "prod" | "dev" | "preview";
  kind?: "local" | "cloud";
} | undefined;

const fetchMetadata = async (adminClient: ConvexReactClient, deploymentUrl: string,) => {
  let metadata: CurrentDeployment = undefined
  try {
    const _metadata = await fetchDeploymentMetadata(adminClient, deploymentUrl, undefined);
    metadata = _metadata
  } catch (error) {
    console.debug('Failed to fetch deployment metadata:', error);
    metadata = {
      deploymentName: extractDeploymentName(deploymentUrl),
      projectName: extractProjectName(deploymentUrl),
      deploymentType: 'dev',
      kind: 'cloud',
    }

  }

  return metadata;
};




export function usePaginatedScheduledJobs(udfPath: string | undefined, adminClient: ConvexReactClient, deploymentUrl: string,) {
  // const { deployment, error: errorDeployment, loading: loadingDeployment } = useCurrentDeployment(adminClient, deploymentUrl)
  // const isPaused = useIsDeploymentPaused(adminClient)
  const [results, setResults] = useState<any| null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error|null>(null);


  const args = {
    udfPath,
    componentId: null,
  };

  useEffect(() => {
    let cancelled = false;
    usePaginatedQuery
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await adminClient.query(
          "_system/frontend/paginatedScheduledJobs:default" as any,
          {
            paginationOpts: {
              numItems: SCHEDULED_JOBS_PAGE_SIZE,
              cursor: null,
            },
            udfPath: undefined,
          }
        );
        console.log(data.page)
        setResults(data);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [adminClient]);
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
    results
  }
}


const useCurrentDeployment = (adminClient: ConvexReactClient, deploymentUrl: string,) => {
  const [deployment, setDeployment] = useState<CurrentDeployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchMetadata(adminClient, deploymentUrl,);
        setDeployment(data);
      } catch (err: unknown) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [adminClient, deploymentUrl,]);

  return {
    deployment,
    error,
    loading
  }
}

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
