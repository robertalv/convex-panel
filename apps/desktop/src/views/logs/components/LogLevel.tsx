/**
 * LogLevel Component
 * Displays a color-coded badge for log levels
 * Based on dashboard-common LogLevel implementation
 */

import { cn } from "@/lib/utils";
import type { LogLevel } from "./LogOutput";

const levelToColor: Record<LogLevel | "FAILURE", string> = {
  INFO: "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]",
  LOG: "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]",
  ERROR: "bg-[var(--color-error-base-alpha)] text-[var(--color-error-base)]",
  FAILURE: "bg-[var(--color-error-base-alpha)] text-[var(--color-error-base)]",
  WARN: "bg-[var(--color-warning-base-alpha)] text-[var(--color-warning-base)]",
  DEBUG: "bg-blue-100/50 dark:bg-blue-700/50 text-blue-700 dark:text-blue-200",
};

interface LogLevelProps {
  level: LogLevel | "FAILURE";
}

export function LogLevelBadge({ level }: LogLevelProps) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded-sm text-[10px] font-medium uppercase",
        levelToColor[level],
      )}
    >
      {level.toLowerCase()}
    </span>
  );
}

export default LogLevelBadge;
