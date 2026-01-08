import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted } from "@tauri-apps/plugin-notification";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useDeploymentStatus } from "@/features/health/hooks/useDeploymentStatus";

const STORAGE_KEY = "convex-panel-notifications-enabled";

interface DeploymentPush {
  deployment_name: string;
  deployment_url: string;
  timestamp: number;
  version: string | null;
}

/**
 * Hook that monitors deployment pushes and sends system notifications
 * when new deployments are detected.
 *
 * Uses the lastPush timestamp from useDeploymentStatus to detect changes
 * and triggers Tauri system notifications via the tray icon.
 */
export function useDeploymentNotifications() {
  const { deployment, deploymentUrl } = useDeployment();
  const { lastPush, version } = useDeploymentStatus();
  const lastNotifiedTimestamp = useRef<number | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Check if notifications are enabled in settings
    const notificationsEnabled = (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : true;
      } catch {
        return true;
      }
    })();

    if (!notificationsEnabled) {
      return;
    }

    // Don't notify on initial load or if no deployment
    if (!deployment || !deploymentUrl || !lastPush) {
      return;
    }

    const pushTimestamp = lastPush.getTime();

    // Skip if this is the first load (don't notify for existing deployments)
    if (isInitialLoad.current) {
      console.log(
        "[Deployment Notifications] Initial load, setting baseline:",
        {
          deployment: deployment.name,
          timestamp: new Date(pushTimestamp).toISOString(),
        },
      );
      lastNotifiedTimestamp.current = pushTimestamp;
      isInitialLoad.current = false;
      return;
    }

    // Check if this is a new push
    if (
      lastNotifiedTimestamp.current === null ||
      pushTimestamp > lastNotifiedTimestamp.current
    ) {
      console.log("[Deployment Notifications] New deployment detected:", {
        deployment: deployment.name,
        timestamp: new Date(pushTimestamp).toISOString(),
        version: version || "unknown",
      });

      // Check permission before sending
      void isPermissionGranted()
        .then((granted) => {
          if (!granted) {
            console.warn(
              "[Deployment Notifications] Permission not granted, skipping notification",
            );
            return;
          }

          // Send notification
          return invoke("notify_deployment_push", {
            deploymentName: deployment.name || "Unnamed Deployment",
            deploymentUrl,
            timestamp: pushTimestamp,
            version: version || null,
          });
        })
        .then(() => {
          console.log(
            "[Deployment Notifications] Notification sent successfully",
          );
        })
        .catch((error) => {
          console.error("Failed to send deployment notification:", error);
        });

      // Update last notified timestamp
      lastNotifiedTimestamp.current = pushTimestamp;
    }
  }, [deployment, deploymentUrl, lastPush, version]);

  // Reset when deployment changes
  useEffect(() => {
    isInitialLoad.current = true;
    lastNotifiedTimestamp.current = null;
  }, [deploymentUrl]);
}

/**
 * Get recent deployment push history from the tray
 */
export async function getRecentDeployments(): Promise<DeploymentPush[]> {
  try {
    return await invoke<DeploymentPush[]>("get_recent_deployments");
  } catch (error) {
    console.error("Failed to get recent deployments:", error);
    return [];
  }
}

/**
 * Clear deployment notification history
 */
export async function clearDeploymentHistory(): Promise<void> {
  try {
    await invoke("clear_deployment_history");
  } catch (error) {
    console.error("Failed to clear deployment history:", error);
  }
}
