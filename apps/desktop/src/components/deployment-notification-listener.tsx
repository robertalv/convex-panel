import { useDeploymentNotifications } from "@/hooks/useDeploymentNotifications";

/**
 * Component that listens for deployment changes and triggers system notifications.
 * Must be rendered inside DeploymentProvider to access deployment context.
 */
export function DeploymentNotificationListener() {
  useDeploymentNotifications();
  return null;
}
