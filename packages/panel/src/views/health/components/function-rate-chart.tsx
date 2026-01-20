import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import type { ChartData, TimeRange } from "../types";
import { generateColor, formatFunctionName } from "../../../utils";
import { transformFunctionToSVGPath } from "../utils";

interface FunctionRateChartProps {
  chartData: ChartData;
  timeRange: TimeRange;
  kind: "cacheHitRate" | "failureRate";
}

export const FunctionRateChart: React.FC<FunctionRateChartProps> = ({
  chartData,
  timeRange,
  kind,
}) => {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverValues, setHoverValues] = useState<Map<string, number>>(
    new Map(),
  );
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [visibleFunctions, setVisibleFunctions] = useState<Set<string>>(
    new Set(),
  );
  const [currentTime, setCurrentTime] = useState<number>(
    Math.floor(Date.now() / 1000),
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize visible functions (all visible by default)
  useEffect(() => {
    if (chartData.functionData.size > 0 && visibleFunctions.size === 0) {
      setVisibleFunctions(new Set(chartData.functionData.keys()));
    }
  }, [chartData.functionData, visibleFunctions.size]);

  // Update current time every second for real-time current time line movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Generate paths and colors for all functions
  const functionPaths = useMemo(() => {
    const paths = new Map<string, string>();
    chartData.functionData.forEach((valueMap, functionName) => {
      const path = transformFunctionToSVGPath(
        chartData.timestamps,
        valueMap,
        100,
        300,
      );
      paths.set(functionName, path);
    });
    return paths;
  }, [chartData]);

  // Generate colors for functions
  const functionColors = useMemo(() => {
    const colors = new Map<string, string>();
    const functionNames = Array.from(chartData.functionData.keys());
    functionNames.forEach((name) => {
      colors.set(name, generateColor(name));
    });
    return colors;
  }, [chartData.functionData]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        !svgRef.current ||
        !containerRef.current ||
        chartData.timestamps.length === 0
      )
        return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentX = x / rect.width;
      const svgX = percentX * 300; // viewBox width

      const minTs = Math.min(...chartData.timestamps);
      const maxTs = Math.max(...chartData.timestamps);
      const timeRange = maxTs - minTs;
      const targetTs = minTs + percentX * timeRange;

      // Find closest timestamp
      let closestTs = chartData.timestamps[0];
      let minDiff = Math.abs(chartData.timestamps[0] - targetTs);
      for (const ts of chartData.timestamps) {
        const diff = Math.abs(ts - targetTs);
        if (diff < minDiff) {
          minDiff = diff;
          closestTs = ts;
        }
      }

      // Get values for all visible functions at this timestamp
      const values = new Map<string, number>();
      chartData.functionData.forEach((valueMap, functionName) => {
        if (visibleFunctions.has(functionName)) {
          const value = valueMap.get(closestTs);
          if (
            value !== undefined &&
            value !== null &&
            typeof value === "number"
          ) {
            values.set(functionName, value);
          }
        }
      });

      if (values.size > 0) {
        setHoverX(svgX);
        setHoverValues(values);
        // Format time range (e.g., "3:40 PM – 3:41 PM")
        const timeStr = new Date(closestTs * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const nextMinute = new Date((closestTs + 60) * 1000).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );
        setHoverTime(`${timeStr} – ${nextMinute}`);
      } else {
        setHoverX(null);
        setHoverValues(new Map());
        setHoverTime(null);
      }
    },
    [chartData, visibleFunctions],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
    setHoverValues(new Map());
    setHoverTime(null);
  }, []);

  const toggleFunction = useCallback(
    (functionName: string) => {
      setVisibleFunctions((prev) => {
        const next = new Set(prev);
        if (next.has(functionName)) {
          // If clicking the only visible function, show all
          if (next.size === 1) {
            return new Set(chartData.functionData.keys());
          }
          next.delete(functionName);
        } else {
          next.add(functionName);
        }
        // If all are hidden, show all
        if (next.size === 0) {
          return new Set(chartData.functionData.keys());
        }
        return next;
      });
    },
    [chartData.functionData],
  );

  // Calculate current time X position using the real-time current time
  const currentTimeX = useMemo(() => {
    if (chartData.timestamps.length === 0) return 300;
    const minTs = Math.min(...chartData.timestamps);
    const maxTs = Math.max(...chartData.timestamps);
    // If current time is beyond the data range, show at right edge
    if (currentTime >= maxTs) return 300;
    // Calculate position based on current time
    const progress = (currentTime - minTs) / (maxTs - minTs);
    return progress * 300;
  }, [chartData.timestamps, currentTime]);

  const functionNames = Array.from(chartData.functionData.keys());

  return (
    <>
      <div
        ref={containerRef}
        style={{
          height: "100px",
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          position: "relative",
          width: "100%",
          cursor: "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          ref={svgRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
          preserveAspectRatio="none"
          viewBox="0 0 300 100"
        >
          <defs>
            {/* Generate gradients for each function */}
            {functionNames.map((functionName) => {
              const color = functionColors.get(functionName) || "#3B82F6";
              const gradientId = `grad-${functionName.replace(/[^a-zA-Z0-9]/g, "-")}`;
              return (
                <linearGradient
                  key={gradientId}
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: color, stopOpacity: 0.2 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: color, stopOpacity: 0 }}
                  />
                </linearGradient>
              );
            })}
          </defs>
          {/* Render all function lines */}
          {functionNames.map((functionName) => {
            const path = functionPaths.get(functionName);
            const color = functionColors.get(functionName) || "#3B82F6";
            const gradientId = `grad-${functionName.replace(/[^a-zA-Z0-9]/g, "-")}`;
            const isVisible = visibleFunctions.has(functionName);

            if (!path || !isVisible) return null;

            return (
              <g key={functionName}>
                {/* Gradient fill */}
                <path
                  d={`${path} L 300,100 L 0,100 Z`}
                  fill={`url(#${gradientId})`}
                  stroke="none"
                  opacity={0.3}
                />
                {/* Main line */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  opacity={isVisible ? 1 : 0.5}
                />
              </g>
            );
          })}
          {/* Grid lines */}
          <line
            x1="0"
            y1="25"
            x2="300"
            y2="25"
            stroke="var(--color-panel-border)"
            strokeDasharray="4"
            opacity="0.5"
          />
          <line
            x1="0"
            y1="50"
            x2="300"
            y2="50"
            stroke="var(--color-panel-border)"
            strokeDasharray="4"
            opacity="0.5"
          />
          <line
            x1="0"
            y1="75"
            x2="300"
            y2="75"
            stroke="var(--color-panel-border)"
            strokeDasharray="4"
            opacity="0.5"
          />
          {/* Current time line (yellow, right edge) */}
          {chartData.timestamps.length > 0 && (
            <line
              x1={currentTimeX}
              y1="0"
              x2={currentTimeX}
              y2="100"
              stroke="var(--color-panel-warning)"
              strokeWidth="2"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* Hover line */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1="0"
              x2={hoverX}
              y2="100"
              stroke="var(--color-panel-text)"
              strokeWidth="1"
              strokeOpacity="0.3"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* Hover dots for all visible functions */}
          {hoverX !== null &&
            hoverValues.size > 0 &&
            (() => {
              const padding = 5;
              const usableHeight = 90;
              return Array.from(hoverValues.entries()).map(
                ([functionName, value]) => {
                  const color = functionColors.get(functionName) || "#3B82F6";
                  const percentage = Math.max(0, Math.min(100, value));
                  const y = 100 - padding - (percentage / 100) * usableHeight;
                  return (
                    <circle
                      key={functionName}
                      cx={hoverX}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="var(--color-panel-bg)"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                },
              );
            })()}
        </svg>
        {/* Tooltip with all function values */}
        {hoverX !== null && hoverValues.size > 0 && hoverTime !== null && (
          <div
            style={{
              position: "absolute",
              left: hoverX < 150 ? `${(hoverX / 300) * 100}%` : "auto",
              right:
                hoverX >= 150 ? `${((300 - hoverX) / 300) * 100}%` : "auto",
              top: "8px",
              transform: hoverX < 150 ? "translateX(-10%)" : "translateX(10%)",
              backgroundColor: "var(--color-panel-bg-tertiary)",
              border: "1px solid var(--color-panel-border)",
              color: "var(--color-panel-text)",
              padding: "6px 10px",
              borderRadius: "4px",
              fontSize: "10px",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "150px",
              maxWidth: "min(250px, 80vw)",
              boxShadow: "0 2px 8px var(--color-panel-shadow)",
            }}
          >
            <div style={{ marginBottom: "6px", fontWeight: 500 }}>
              {hoverTime}
            </div>
            {Array.from(hoverValues.entries()).map(([functionName, value]) => {
              const color = functionColors.get(functionName) || "#3B82F6";
              const displayName =
                functionName === "_rest"
                  ? `All${functionNames.length > 1 ? " other" : ""} ${kind === "cacheHitRate" ? "queries" : "functions"}`
                  : formatFunctionName(functionName);
              return (
                <div
                  key={functionName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "2px",
                        backgroundColor: color,
                        flexShrink: 0,
                      }}
                    ></div>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayName}
                    </span>
                  </div>
                  <span style={{ fontWeight: 500, flexShrink: 0 }}>
                    {value.toFixed(value % 1 === 0 ? 0 : 2)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Legend */}
      {functionNames.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "6px",
            padding: "0 2px",
            justifyContent: "center",
            fontSize: "10px",
          }}
        >
          {functionNames.map((functionName) => {
            const color = functionColors.get(functionName) || "#3B82F6";
            const isVisible = visibleFunctions.has(functionName);
            const displayName =
              functionName === "_rest"
                ? `All${functionNames.length > 1 ? " other" : ""} ${kind === "cacheHitRate" ? "queries" : "functions"}`
                : formatFunctionName(functionName);

            return (
              <button
                key={functionName}
                onClick={() => toggleFunction(functionName)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  background: "none",
                  border: "none",
                  color: isVisible
                    ? "var(--color-panel-text)"
                    : "var(--color-panel-text-muted)",
                  cursor: "pointer",
                  padding: "2px 3px",
                  fontSize: "10px",
                  opacity: isVisible ? 1 : 0.5,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isVisible) {
                    e.currentTarget.style.opacity = "0.7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isVisible) {
                    e.currentTarget.style.opacity = "0.5";
                  }
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "2px",
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                ></div>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "120px",
                  }}
                >
                  {displayName}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "var(--color-panel-text-muted)",
          marginTop: "6px",
          width: "100%",
        }}
      >
        <span>{timeRange.start}</span>
        <span>{timeRange.end}</span>
      </div>
    </>
  );
};
