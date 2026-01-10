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

export function useDeploymentNotifications() {
  const { deployment, deploymentUrl } = useDeployment();
  const { lastPush, version } = useDeploymentStatus();
  const lastNotifiedTimestamp = useRef<number | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
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

    if (!deployment || !deploymentUrl || !lastPush) {
      return;
    }

    const pushTimestamp = lastPush.getTime();

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

    if (
      lastNotifiedTimestamp.current === null ||
      pushTimestamp > lastNotifiedTimestamp.current
    ) {
      console.log("[Deployment Notifications] New deployment detected:", {
        deployment: deployment.name,
        timestamp: new Date(pushTimestamp).toISOString(),
        version: version || "unknown",
      });

      void isPermissionGranted()
        .then((granted) => {
          if (!granted) {
            console.warn(
              "[Deployment Notifications] Permission not granted, skipping notification",
            );
            return;
          }

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

      lastNotifiedTimestamp.current = pushTimestamp;
    }
  }, [deployment, deploymentUrl, lastPush, version]);

  useEffect(() => {
    isInitialLoad.current = true;
    lastNotifiedTimestamp.current = null;
  }, [deploymentUrl]);
}

export async function getRecentDeployments(): Promise<DeploymentPush[]> {
  try {
    return await invoke<DeploymentPush[]>("get_recent_deployments");
  } catch (error) {
    console.error("Failed to get recent deployments:", error);
    return [];
  }
}

export async function clearDeploymentHistory(): Promise<void> {
  try {
    await invoke("clear_deployment_history");
  } catch (error) {
    console.error("Failed to clear deployment history:", error);
  }
}
