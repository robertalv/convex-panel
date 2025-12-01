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

// TODO: Save this in local storage
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
  const { deployment, error: errorDeployment, loading: loadingDeployment } = useCurrentDeployment(adminClient, deploymentUrl)
  const isPaused = useIsDeploymentPaused(adminClient)
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<"LoadingFirstPage" | "LoadingMore" | "Exhausted" | "CanLoadMore">("LoadingFirstPage")

  usePaginatedQuery
  const args = {
    udfPath,
    componentId: null,
  };

  // I do not like this method by one bit, I'm thinking of creating a useAsync hook, or focusing on doing this with pure javascript
  // maybe this https://react.dev/reference/react/useEffectEvent
  // or realistically https://developer.mozilla.org/en-US/docs/Glossary/IIFE
  useEffect(() => {
    let cancelled = false;
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
            udfPath: udfPath ?? undefined,
          }
        );
        // if(data)
        if (!cancelled) {
          setResults(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    // we only want to fetch these results when isPaused is false; 
    if (!isPaused) {
      fetchResults();
    }

    return () => {
      cancelled = true;
    };
  }, [adminClient, isPaused]);

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
    jobs: isPaused ? null : results, // this is null for now, gonna switch it soon
    status: status,
    isPaused

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