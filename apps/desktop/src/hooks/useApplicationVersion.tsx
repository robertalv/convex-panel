import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const STORAGE_KEY = "convex-panel-notified-sha";

export const applicationVersionKeys = {
  all: ["applicationVersion"] as const,
  latest: () => [...applicationVersionKeys.all, "latest"] as const,
};

interface VersionResponse {
  sha: string | null;
}

async function fetchLatestVersion(): Promise<VersionResponse> {
  const url = `${API_BASE_URL}/v1/version`;
  const res = await tauriFetch(url);

  if (!res.ok) {
    try {
      const { error } = await res.json();
      console.error("[useApplicationVersion] Failed to fetch version:", error);
    } catch (e) {
      console.error(
        "[useApplicationVersion] Failed to fetch version information.",
      );
    }
    throw new Error("Failed to fetch version information.");
  }

  return res.json();
}

function getNotifiedSha(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setNotifiedSha(sha: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, sha);
  } catch {
    // Ignore localStorage errors
  }
}

export function useApplicationVersion() {
  const currentSha =
    typeof __GIT_COMMIT_HASH__ !== "undefined" ? __GIT_COMMIT_HASH__ : null;

  const hasShownToastRef = useRef(false);
  const lastCheckedShaRef = useRef<string | null>(null);

  const { data, error } = useQuery<VersionResponse>({
    queryKey: applicationVersionKeys.latest(),
    queryFn: fetchLatestVersion,
    // Refresh every hour
    refetchInterval: 1000 * 60 * 60,
    // Refresh on window focus (throttled to once per 10 minutes)
    refetchOnWindowFocus: true,
    // Don't retry on error (we'll check again on next interval)
    retry: false,
    // Only run if we have a current SHA to compare against
    enabled: currentSha !== null && currentSha !== "unknown",
    // Keep stale data for 10 minutes
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    // Only show toast if:
    // - No error occurred
    // - We have version data
    // - Current SHA is valid
    // - Versions don't match (new version available)
    // - We haven't already shown the toast for this specific new SHA
    if (
      !error &&
      data?.sha &&
      currentSha &&
      currentSha !== "unknown" &&
      data.sha !== currentSha
    ) {
      // Check if we've already notified about this specific SHA
      const notifiedSha = getNotifiedSha();
      const hasAlreadyNotified = notifiedSha === data.sha;

      // Only show if this is a new SHA we haven't notified about
      if (!hasAlreadyNotified && !hasShownToastRef.current) {
        // Mark that we've shown the toast for this SHA
        hasShownToastRef.current = true;
        lastCheckedShaRef.current = data.sha;
        setNotifiedSha(data.sha);

        // Use a unique toast ID to prevent duplicates
        const toastId = "applicationVersion";

        sonnerToast.info(
          <div className="flex flex-col gap-3">
            <div className="font-medium">
              A new version of Convex Panel is available! Refresh the
              application to update.
            </div>
            <Button
              variant="default"
              size="sm"
              className="ml-auto w-fit"
              onClick={() => {
                // Reload the application
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>,
          {
            id: toastId,
            duration: Infinity, // Don't auto-dismiss
            dismissible: false,
          },
        );
      }
    }

    // Reset the toast flag if versions match (app was updated)
    if (data?.sha && currentSha && data.sha === currentSha) {
      hasShownToastRef.current = false;
      // Clear the notified SHA so we can notify about future updates
      setNotifiedSha(currentSha);
    }

    // Reset ref if the SHA we're checking changed
    if (lastCheckedShaRef.current !== data?.sha) {
      hasShownToastRef.current = false;
      lastCheckedShaRef.current = data?.sha || null;
    }
  }, [data, error, currentSha]);
}
