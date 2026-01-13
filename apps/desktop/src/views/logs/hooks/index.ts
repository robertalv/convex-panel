/**
 * Logs Feature Hooks
 * Re-exports all hooks for the logs feature
 */

export { useLogs } from "./useLogs";
export type { UseLogsOptions, UseLogsReturn } from "./useLogs";

// Re-export the global useComponents hook for convenience
export { useComponents } from "@/hooks/useComponents";
export type {
  UseComponentsOptions,
  UseComponentsReturn,
} from "@/hooks/useComponents";

export { useFunctions } from "./useFunctions";
export type { UseFunctionsProps, UseFunctionsReturn } from "./useFunctions";

export { useLogStorage } from "./useLogStorage";
export type {
  UseLogStorageOptions,
  UseLogStorageReturn,
} from "./useLogStorage";

export { useDeploymentAuditLogs } from "./useDeploymentAuditLogs";
export type {
  DeploymentAuditLogEvent,
  DeploymentAction,
} from "./useDeploymentAuditLogs";
