import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { CheckCircle } from "lucide-react";
import { HealthCard } from "./health-card";
import { fetchUdfExecutionStats } from "../../../utils/api/metrics";
import type { FunctionExecutionStats } from "../../../types";

interface TopErrorsCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface ErrorFunction {
  name: string;
  type: "query" | "mutation" | "action" | "httpAction";
  errorCount: number;
  errorRate: number;
  totalCount: number;
  lastError?: string;
}

// Normalize UDF type to a consistent format
const normalizeUdfType = (
  udfType: string | undefined | null,
): "query" | "mutation" | "action" | "httpAction" => {
  if (!udfType) return "action";
  const type = udfType.toLowerCase();
  if (type === "query" || type === "q") return "query";
  if (type === "mutation" || type === "m") return "mutation";
  if (type === "httpaction" || type === "http" || type === "h")
    return "httpAction";
  return "action";
};

const typeBadgeStyles: Record<string, React.CSSProperties> = {
  query: { backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3B82F6" },
  mutation: { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981" },
  action: { backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" },
  httpAction: { backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6" },
};

export const TopErrorsCard: React.FC<TopErrorsCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorFunctions, setErrorFunctions] = useState<ErrorFunction[]>([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const cursorRef = useRef<number>(0);

  // Process entries to find functions with errors
  const processEntries = useCallback(
    (
      entries: FunctionExecutionStats[],
    ): { errors: ErrorFunction[]; totalErrors: number } => {
      const now = Math.floor(Date.now() / 1000);
      const oneHourAgo = now - 60 * 60;

      // Aggregate by function
      const functionMap = new Map<
        string,
        {
          type: "query" | "mutation" | "action" | "httpAction";
          errorCount: number;
          successCount: number;
          lastError?: string;
          lastErrorTime: number;
        }
      >();

      let totalErrorCount = 0;

      entries.forEach((entry) => {
        let entryTime = entry.timestamp;
        if (entryTime > 1e12) {
          entryTime = Math.floor(entryTime / 1000);
        }

        // Skip entries outside our time window
        if (entryTime < oneHourAgo || entryTime > now) {
          return;
        }

        const funcName = entry.identifier || "Unknown";
        const existing = functionMap.get(funcName);
        const isError = !entry.success;

        if (isError) {
          totalErrorCount++;
        }

        if (existing) {
          if (isError) {
            existing.errorCount++;
            // Keep the most recent error message
            if (entry.error && entryTime > existing.lastErrorTime) {
              existing.lastError = entry.error;
              existing.lastErrorTime = entryTime;
            }
          } else {
            existing.successCount++;
          }
        } else {
          functionMap.set(funcName, {
            type: normalizeUdfType(entry.udf_type),
            errorCount: isError ? 1 : 0,
            successCount: isError ? 0 : 1,
            lastError: isError ? entry.error : undefined,
            lastErrorTime: isError ? entryTime : 0,
          });
        }
      });

      // Convert to sorted array (only functions with errors)
      const results: ErrorFunction[] = Array.from(functionMap.entries())
        .filter(([_, stats]) => stats.errorCount > 0)
        .map(([name, stats]) => {
          const totalCount = stats.errorCount + stats.successCount;
          return {
            name,
            type: stats.type,
            errorCount: stats.errorCount,
            errorRate: (stats.errorCount / totalCount) * 100,
            totalCount,
            lastError: stats.lastError,
          };
        })
        .sort((a, b) => b.errorCount - a.errorCount) // Sort by error count
        .slice(0, 5);

      return { errors: results, totalErrors: totalErrorCount };
    },
    [],
  );

  useEffect(() => {
    if (!deploymentUrl || !authToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const cursor = Math.floor(oneHourAgo);

        const response = await fetchUdfExecutionStats(
          deploymentUrl,
          authToken,
          cursor,
        );

        if (mounted && response && response.entries) {
          const { errors, totalErrors } = processEntries(response.entries);
          setErrorFunctions(errors);
          setTotalErrors(totalErrors);
          cursorRef.current = response.new_cursor;
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch error data",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, useMockData, processEntries]);

  // Find the max error count for bar scaling
  const maxErrors = useMemo(() => {
    if (errorFunctions.length === 0) return 1;
    return Math.max(...errorFunctions.map((f) => f.errorCount));
  }, [errorFunctions]);

  const getErrorRateColor = (rate: number): string => {
    if (rate > 50) return "#EF4444"; // Red for > 50%
    if (rate > 20) return "#F59E0B"; // Orange for > 20%
    if (rate > 5) return "#EAB308"; // Yellow for > 5%
    return "#F97316"; // Light orange for low rates
  };

  const truncateError = (error: string, maxLen: number = 60): string => {
    if (error.length <= maxLen) return error;
    return error.substring(0, maxLen) + "...";
  };

  return (
    <HealthCard
      title="Top Errors"
      tip="Functions with the most errors in the last hour. High error rates may indicate bugs, invalid inputs, or infrastructure issues."
      loading={loading}
      error={error}
    >
      <div style={{ padding: "8px 0" }}>
        {/* Summary */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: totalErrors > 0 ? "#EF4444" : "var(--color-panel-text)",
            }}
          >
            {totalErrors.toLocaleString()}
          </div>
          <div
            style={{ fontSize: "12px", color: "var(--color-panel-text-muted)" }}
          >
            total errors (1h)
          </div>
        </div>

        {errorFunctions.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {errorFunctions.map((fn) => (
              <div
                key={fn.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {/* Function name row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      ...typeBadgeStyles[fn.type],
                      padding: "2px 5px",
                      borderRadius: "3px",
                      fontSize: "9px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {fn.type === "httpAction"
                      ? "HTTP"
                      : fn.type.slice(0, 1).toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-panel-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                    title={fn.name}
                  >
                    {fn.name}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: getErrorRateColor(fn.errorRate),
                      flexShrink: 0,
                    }}
                  >
                    {fn.errorCount} ({fn.errorRate.toFixed(1)}%)
                  </span>
                </div>

                {/* Error bar */}
                <div
                  style={{
                    height: "4px",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (fn.errorCount / maxErrors) * 100)}%`,
                      height: "100%",
                      backgroundColor: getErrorRateColor(fn.errorRate),
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Last error message preview */}
                {fn.lastError && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--color-panel-text-muted)",
                      fontStyle: "italic",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={fn.lastError}
                  >
                    {truncateError(fn.lastError)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100px",
              color: "var(--color-panel-success, #10B981)",
              fontSize: "12px",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <CheckCircle size={24} style={{ opacity: 0.7 }} />
            <span>No errors in the last hour</span>
          </div>
        ) : null}
      </div>
    </HealthCard>
  );
};
