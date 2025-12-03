import { useState, useEffect } from 'react';

interface SubscriptionPlan {
  planType: 'CONVEX_PROFESSIONAL' | 'CONVEX_STARTER_PLUS' | 'CONVEX_BUSINESS' | string;
  [key: string]: any;
}

interface Subscription {
  plan: SubscriptionPlan;
  [key: string]: any;
}

interface UseTeamOrbSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch team subscription status from Convex dashboard API
 * @param teamId - The team ID (number or string)
 * @returns Object with subscription data, loading state, and error
 */
export function useTeamOrbSubscription(teamId?: number | string | null): UseTeamOrbSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teamId) {
      setIsLoading(false);
      setSubscription(null);
      return;
    }

    let cancelled = false;

    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // For now, we'll return null as subscription data is typically only available
        // through the dashboard API with proper authentication
        // In a real implementation, you would make a fetch call here:
        // const response = await fetch(`/api/teams/${teamIdStr}/get_orb_subscription`, {
        //   headers: { Authorization: `Bearer ${dashboardToken}` }
        // });
        
        // Since we don't have dashboard API access, we'll return null
        // This means we'll show the upgrade button by default
        if (!cancelled) {
          setSubscription(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
          setSubscription(null);
          setIsLoading(false);
        }
      }
    };

    fetchSubscription();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return { subscription, isLoading, error };
}

/**
 * Helper hook to check if team has a paid subscription
 * @param teamId - The team ID (number, string, or null)
 * @returns boolean | undefined (undefined while loading, true/false when loaded)
 */
export function useHasSubscription(teamId?: number | string | null): boolean | undefined {
  const { subscription, isLoading } = useTeamOrbSubscription(teamId);
  
  if (isLoading) return undefined;
  return subscription !== null;
}

