/**
 * useTeamMembers Hook
 * Fetches team members for a team using BigBrain API
 */

import { useState, useEffect, useRef } from "react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  getTeamMembers,
  type TeamMember,
  type FetchFn,
} from "@convex-panel/shared/api";

// Use Tauri's fetch for CORS-free requests
const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);

interface UseTeamMembersOptions {
  accessToken: string | null;
  teamId: number | null;
  enabled?: boolean;
}

export function useTeamMembers({
  accessToken,
  teamId,
  enabled = true,
}: UseTeamMembersOptions) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function fetchMembers() {
      if (!accessToken || !teamId || !enabled) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getTeamMembers(accessToken, teamId, desktopFetch);

        if (!isMountedRef.current) return;

        setMembers(result);
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("Failed to fetch team members:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch team members"),
        );
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    fetchMembers();

    return () => {
      isMountedRef.current = false;
    };
  }, [accessToken, teamId, enabled]);

  return {
    members,
    isLoading,
    error,
  };
}
