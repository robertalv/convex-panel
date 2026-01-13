/**
 * Deployment Utilities
 *
 * Utility functions for getting icons and colors for deployments
 * Matching the desktop app's implementation
 */

import type { Deployment, Theme } from "../types";

/**
 * Get the icon name for a deployment based on its type and kind
 */
export function getDeploymentIcon(deployment: Deployment): string {
  if (deployment.deploymentType === "dev") {
    return deployment.kind === "local" ? "code" : "globe";
  } else if (deployment.deploymentType === "prod") {
    return "signal";
  } else if (deployment.deploymentType === "preview") {
    return "pencil";
  }
  return "code";
}

/**
 * Get the color scheme for a deployment type (matching dashboard colors)
 */
export function getDeploymentColors(
  deploymentType: Deployment["deploymentType"],
  theme: Theme,
): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
} {
  switch (deploymentType) {
    case "prod":
      return {
        backgroundColor: theme.dark
          ? "rgba(147, 51, 234, 0.3)"
          : "rgba(147, 51, 234, 0.1)",
        borderColor: theme.dark
          ? "rgba(243, 232, 255, 1)"
          : "rgba(147, 51, 234, 1)",
        textColor: theme.dark
          ? "rgba(243, 232, 255, 1)"
          : "rgba(147, 51, 234, 1)",
        iconColor: theme.dark
          ? "rgba(243, 232, 255, 1)"
          : "rgba(147, 51, 234, 1)",
      };
    case "preview":
      return {
        backgroundColor: theme.dark
          ? "rgba(154, 52, 18, 0.3)"
          : "rgba(254, 243, 199, 0.5)",
        borderColor: theme.dark
          ? "rgba(251, 146, 60, 1)"
          : "rgba(234, 88, 12, 1)",
        textColor: theme.dark
          ? "rgba(251, 146, 60, 1)"
          : "rgba(234, 88, 12, 1)",
        iconColor: theme.dark
          ? "rgba(251, 146, 60, 1)"
          : "rgba(234, 88, 12, 1)",
      };
    case "dev":
      return {
        backgroundColor: theme.dark
          ? "rgba(20, 83, 45, 0.3)"
          : "rgba(220, 252, 231, 0.5)",
        borderColor: theme.dark
          ? "rgba(134, 239, 172, 1)"
          : "rgba(22, 163, 74, 1)",
        textColor: theme.dark
          ? "rgba(134, 239, 172, 1)"
          : "rgba(22, 163, 74, 1)",
        iconColor: theme.dark
          ? "rgba(134, 239, 172, 1)"
          : "rgba(22, 163, 74, 1)",
      };
    default:
      return {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        textColor: theme.colors.text,
        iconColor: theme.colors.textSecondary,
      };
  }
}