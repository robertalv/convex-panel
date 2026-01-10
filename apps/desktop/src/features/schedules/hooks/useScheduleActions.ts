/**
 * useScheduleActions
 * Hook for schedule cancellation operations using React Query mutations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  cancelScheduledJob,
  cancelAllScheduledJobs,
} from "@convex-panel/shared/api";
import { useDeployment } from "@/contexts/DeploymentContext";
import { scheduledJobsKeys } from "./useScheduledJobs";
import { toast } from "sonner";

export function useScheduleActions() {
  const { deploymentUrl, authToken } = useDeployment();
  const queryClient = useQueryClient();

  // Cancel a single scheduled job
  const cancelJobMutation = useMutation({
    mutationFn: async ({
      jobId,
      componentId,
    }: {
      jobId: string;
      componentId?: string | null;
    }) => {
      if (!deploymentUrl || !authToken) {
        throw new Error("Deployment not configured");
      }

      await cancelScheduledJob(
        deploymentUrl,
        authToken,
        jobId,
        componentId,
        tauriFetch,
      );
    },
    onSuccess: () => {
      // Invalidate scheduled jobs query to refetch
      queryClient.invalidateQueries({ queryKey: scheduledJobsKeys.all });
      toast.success("Scheduled job canceled");
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel job: ${error.message}`);
    },
  });

  // Cancel all scheduled jobs (optionally filtered by UDF path)
  const cancelAllJobsMutation = useMutation({
    mutationFn: async ({
      udfPath,
      componentId,
    }: {
      udfPath?: string;
      componentId?: string | null;
    }) => {
      if (!deploymentUrl || !authToken) {
        throw new Error("Deployment not configured");
      }

      await cancelAllScheduledJobs(
        deploymentUrl,
        authToken,
        udfPath,
        componentId,
        tauriFetch,
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate scheduled jobs query to refetch
      queryClient.invalidateQueries({ queryKey: scheduledJobsKeys.all });

      const message = variables.udfPath
        ? `Canceled all scheduled jobs for ${variables.udfPath}`
        : "Canceled all scheduled jobs";
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel jobs: ${error.message}`);
    },
  });

  return {
    cancelJob: cancelJobMutation.mutate,
    cancelAllJobs: cancelAllJobsMutation.mutate,
    isCanceling: cancelJobMutation.isPending || cancelAllJobsMutation.isPending,
  };
}
