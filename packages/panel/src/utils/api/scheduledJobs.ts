/**
 * Scheduled jobs management operations
 * Handles canceling scheduled jobs (individual and bulk)
 */

import { getAdminClientInfo } from '../adminClient';
import { toast } from '../toast';

/**
 * Cancel a specific scheduled job
 * @param adminClient - The Convex admin client instance
 * @param jobId - The ID of the job to cancel
 * @param componentId - Optional component ID
 * @returns Promise that resolves when the job is canceled
 */
export async function cancelScheduledJob(
  adminClient: any,
  jobId: string,
  componentId?: string | null
): Promise<void> {
  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  const clientInfo = getAdminClientInfo(adminClient);
  const { deploymentUrl, adminKey } = clientInfo;

  try {
    const response = await fetch(`${deploymentUrl}/api/cancel_job`, {
      method: 'POST',
      headers: {
        'Authorization': `Convex ${adminKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: jobId,
        componentId: componentId ?? undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    toast('success', 'Scheduled run canceled.');
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to cancel scheduled job';
    toast('error', errorMessage);
    throw error;
  }
}

/**
 * Cancel all scheduled jobs
 * @param adminClient - The Convex admin client instance
 * @param udfPath - Optional UDF path to filter jobs by function
 * @param componentId - Optional component ID
 * @returns Promise that resolves when all jobs are canceled
 */
export async function cancelAllScheduledJobs(
  adminClient: any,
  udfPath?: string,
  componentId?: string | null
): Promise<void> {
  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  const clientInfo = getAdminClientInfo(adminClient);
  const { deploymentUrl, adminKey } = clientInfo;

  try {
    const response = await fetch(`${deploymentUrl}/api/cancel_all_jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Convex ${adminKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        udfPath: udfPath ?? undefined,
        componentId: componentId ?? undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));

      if (error.code === 'OptimisticConcurrencyControlFailure') {
        throw new Error(
          'There are too many functions being scheduled in this deployment. Pause your deployment to cancel all functions.'
        );
      }
      
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const successMessage = udfPath
      ? `Canceled all scheduled runs for ${udfPath}.`
      : 'Canceled all scheduled runs.';
    
    toast('success', successMessage);
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to cancel all scheduled jobs';
    toast('error', errorMessage);
    throw error;
  }
}








