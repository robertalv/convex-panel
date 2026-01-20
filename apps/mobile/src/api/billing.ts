/**
 * Billing API Functions for Mobile
 *
 * API functions for fetching billing and plan information
 */

import { callBigBrainAPI } from "./bigbrain";
import type { FetchFn } from "./types";

export interface PlanResponse {
  id: string;
  name: string;
  planType: string | null;
  description?: string;
  seatPrice?: number; // price per seat in dollars
  prices: {
    id: string;
    name: string;
    unitPrice: number; // in cents
    billingCadence: "monthly" | "annual";
  }[];
}

export interface PlansListResponse {
  plans: PlanResponse[];
}

/**
 * Fetch available plans for a team
 */
export async function getPlans(
  accessToken: string,
  teamId: number,
): Promise<PlansListResponse> {
  return callBigBrainAPI<PlansListResponse>(
    "/teams/{team_id}/list_active_plans",
    {
      accessToken,
      pathParams: { team_id: teamId },
    },
    fetch as FetchFn,
  );
}
