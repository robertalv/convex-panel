/**
 * useIsProUser Hook (MOBILE PRO)
 *
 * Checks if the authenticated user has an active Mobile Pro subscription
 * NOT CONVEX PRO
 */

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const CONVEX_URL = "https://friendly-wombat-759.convex.cloud";

interface ProStatusResponse {
  isPro: boolean;
  subscription: any | null;
  needsUpdate?: boolean;
}

interface UseIsProUserResult {
  isPro: boolean;
  subscription: any | null;
  isLoading: boolean;
}

async function checkProStatus(email: string): Promise<ProStatusResponse> {
  const response = await axios.post(
    `${CONVEX_URL}/api/query`,
    {
      path: "subscriptions:checkProStatus",
      args: { email },
      format: "json",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.value;
}

export function useIsProUser(): UseIsProUserResult {
  const { session, isAuthenticated } = useAuth();
  const email = session?.profile?.email;

  const { data, isLoading } = useQuery({
    queryKey: ["proStatus", email],
    queryFn: () => checkProStatus(email!),
    enabled: isAuthenticated && !!email,
    staleTime: 60000,
    gcTime: 300000,
  });

  return {
    isPro: data?.isPro ?? false,
    subscription: data?.subscription ?? null,
    isLoading: isLoading && isAuthenticated,
  };
}
