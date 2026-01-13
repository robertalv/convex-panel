/**
 * LogRow Component
 * Renders a single log entry row in the logs list
 * Matches the dashboard-common LogListItem format
 */

import { memo } from "react";
import { Puzzle } from "lucide-react";
import type { LogEntry, ModuleFunction } from "../types";
import {
  formatTimestamp,
  getShortRequestId,
  getFunctionTypeIcon,
  formatDuration,
  parseFunctionPath,
} from "../utils/formatters";
import { cn } from "@/lib/utils";

interface LogRowProps {
  log: LogEntry;
  onClick: () => void;
  isSelected: boolean;
  functions?: ModuleFunction[];
}

export const ITEM_SIZE = 24;

/**
 * Process log data for display
 */
function processLogData(log: LogEntry, functions: ModuleFunction[] = []) {
  const requestId = log.requestId || "";
  const shortId = getShortRequestId(requestId);
  const executionTime = log.durationMs
    ? formatDuration(log.durationMs)
    : undefined;

  // Check for cached result
  const isCached = log.cachedResult || false;

  // Determine if success/error
  const isSuccess = log.success;
  const isError = !log.success || !!log.error;

  // Get component path directly from log (more reliable than parsing)
  const componentId = log.componentPath || "";

  // Parse function path for fallback
  const functionPath = log.functionIdentifier || "";
  const { functionName } = parseFunctionPath(functionPath);

  // Use the displayable function name
  let displayFunctionName = log.functionName || functionName;

  // Find matching function for better display name if available
  if (functionPath && functions.length > 0) {
    const matchingFunction = functions.find((fn) => {
      const fnIdentifier = fn.identifier
        .replace(/\.js:/g, ":")
        .replace(/\.js$/g, "");
      const logPath = functionPath.replace(/\.js:/g, ":").replace(/\.js$/g, "");
      return (
        fnIdentifier === logPath || fnIdentifier.endsWith(`:${functionName}`)
      );
    });
    if (matchingFunction?.name) {
      displayFunctionName = matchingFunction.name;
    }
  }

  // Determine function type icon
  const typeIcon = getFunctionTypeIcon(log.udfType);

  // Get log lines
  const logLines = log.logLines || [];

  return {
    shortId,
    executionTime,
    componentId,
    displayFunctionName,
    typeIcon,
    isError,
    isSuccess,
    isCached,
    logLines,
  };
}

function LogRowInner({
  log,
  onClick,
  isSelected,
  functions = [],
}: LogRowProps) {
  const {
    shortId,
    executionTime,
    componentId,
    displayFunctionName,
    typeIcon,
    isError,
    isCached,
  } = processLogData(log, functions);

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center px-4 py-1 cursor-pointer transition-colors",
        "hover:bg-[var(--color-surface-raised)]",
        isSelected && "bg-[var(--color-surface-raised)]",
      )}
      style={{
        borderBottom: "1px solid transparent",
        fontFamily: "monospace",
        fontSize: "12px",
        backgroundColor:
          isError && !isSelected
            ? "rgba(239, 68, 68, 0.15)"
            : isSelected
              ? "var(--color-surface-raised)"
              : "transparent",
        color: isError ? "rgb(248, 113, 113)" : undefined,
      }}
      onMouseEnter={(e) => {
        // Always use the same hover color regardless of error state
        e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          if (isError) {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
          } else {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        } else {
          e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
        }
      }}
    >
      {/* Timestamp */}
      <div
        style={{
          width: "148px",
          color: isError ? "rgb(248, 113, 113)" : "var(--color-text-secondary)",
        }}
      >
        {formatTimestamp(log.timestamp)}
      </div>

      {/* Request ID badge */}
      <div
        style={{
          width: "60px",
          color: isError ? "rgb(248, 113, 113)" : "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span
          style={{
            border: `1px solid ${isError ? "rgb(239, 68, 68)" : "var(--color-border-base)"}`,
            borderRadius: "4px",
            padding: "0 4px",
            fontSize: "10px",
          }}
        >
          {shortId}
        </span>
      </div>

      {/* Status and duration */}
      <div
        style={{
          width: "112px",
          color: "var(--color-text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {isError ? (
          <span style={{ color: "rgb(239, 68, 68)" }}>Error</span>
        ) : (
          <>
            <span style={{ color: "var(--color-success-base)" }}>200</span>
            {isCached ? (
              <span
                style={{
                  color: "var(--color-success-base)",
                  fontSize: "11px",
                  fontWeight: 500,
                }}
              >
                (cached)
              </span>
            ) : executionTime ? (
              <span style={{ color: "var(--color-text-muted)" }}>
                {executionTime}
              </span>
            ) : null}
          </>
        )}
      </div>

      {/* Function */}
      <div
        style={{
          flex: 1,
          color: isError
            ? "var(--color-error-text)"
            : "var(--color-text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            width: "16px",
            textAlign: "center",
            color: isError
              ? "var(--color-error-text)"
              : "var(--color-text-muted)",
            fontWeight: 700,
            fontSize: "10px",
            flexShrink: 0,
          }}
        >
          {typeIcon}
        </span>
        {componentId && (
          <>
            <Puzzle
              size={12}
              className="shrink-0"
              style={{
                color: isError
                  ? "var(--color-error-text)"
                  : "var(--color-text-muted)",
              }}
            />
            <span
              className="shrink-0 text-xs px-1 py-0.5 rounded"
              style={{
                backgroundColor: isError
                  ? "var(--color-error-muted)"
                  : "var(--color-surface-raised)",
                color: isError
                  ? "var(--color-error-text)"
                  : "var(--color-text-muted)",
              }}
            >
              {componentId}
            </span>
          </>
        )}
        <span
          style={{
            color: isError
              ? "var(--color-error-text)"
              : "var(--color-text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexShrink: 1,
            minWidth: 0,
          }}
          title={log.functionIdentifier || displayFunctionName}
        >
          {displayFunctionName}
        </span>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const LogRow = memo(LogRowInner);

export default LogRow;
