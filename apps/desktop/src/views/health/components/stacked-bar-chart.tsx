import React, { useState, useRef, useCallback, useMemo } from "react";
import type { TimeRange } from "@convex-panel/shared";

export interface StackedBarSeries {
  name: string;
  color: string;
  data: number[]; // Values for each timestamp
}

interface StackedBarChartProps {
  timestamps: number[];
  series: StackedBarSeries[];
  timeRange: TimeRange;
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  formatYAxis?: (value: number) => string;
  maxValue?: number;
  yAxisLabel?: string;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  timestamps,
  series,
  timeRange,
  height = 120,
  showLegend = true,
  formatValue = (v) => v.toFixed(0),
  formatYAxis,
  maxValue: providedMaxValue,
  yAxisLabel: _yAxisLabel,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    if (providedMaxValue !== undefined) return providedMaxValue;

    let max = 0;
    for (let i = 0; i < timestamps.length; i++) {
      let stackTotal = 0;
      for (const s of series) {
        stackTotal += s.data[i] || 0;
      }
      if (stackTotal > max) max = stackTotal;
    }
    return max || 100;
  }, [timestamps, series, providedMaxValue]);

  // Generate Y-axis labels
  const yAxisLabels = useMemo(() => {
    const labels: string[] = [];
    const steps = 4;
    for (let i = steps; i >= 0; i--) {
      const value = (maxValue / steps) * i;
      labels.push(formatYAxis ? formatYAxis(value) : formatValue(value));
    }
    return labels;
  }, [maxValue, formatValue, formatYAxis]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || timestamps.length === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const chartAreaLeft = 50; // Y-axis space
      const chartAreaWidth = rect.width - chartAreaLeft - 10;

      if (x < chartAreaLeft) {
        setHoverIndex(null);
        return;
      }

      const relativeX = x - chartAreaLeft;
      const barWidth = chartAreaWidth / timestamps.length;
      const index = Math.floor(relativeX / barWidth);

      if (index >= 0 && index < timestamps.length) {
        setHoverIndex(index);
        setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setHoverIndex(null);
      }
    },
    [timestamps.length],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
    setHoverPosition(null);
  }, []);

  // Calculate bar dimensions
  const chartAreaLeft = 50;
  const chartAreaRight = 10;
  const barGap = 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          height: `${height}px`,
          display: "flex",
          cursor: "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Y-axis labels */}
        <div
          style={{
            width: `${chartAreaLeft}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: "8px",
            fontSize: "10px",
            color: "var(--color-panel-text-muted)",
            textAlign: "right",
          }}
        >
          {yAxisLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        {/* Chart area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            marginRight: `${chartAreaRight}px`,
          }}
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${pct}%`,
                height: "1px",
                backgroundColor: "var(--color-panel-border)",
                opacity: pct === 100 ? 1 : 0.5,
              }}
            />
          ))}

          {/* Bars */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              gap: `${barGap}px`,
            }}
          >
            {timestamps.map((_, idx) => {
              // Calculate stack heights
              const stackHeights: {
                series: StackedBarSeries;
                height: number;
                y: number;
              }[] = [];
              let currentY = 0;

              for (const s of series) {
                const value = s.data[idx] || 0;
                const heightPct = (value / maxValue) * 100;
                stackHeights.push({
                  series: s,
                  height: heightPct,
                  y: currentY,
                });
                currentY += heightPct;
              }

              const isHovered = hoverIndex === idx;

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: "100%",
                    position: "relative",
                    opacity: hoverIndex !== null && !isHovered ? 0.6 : 1,
                    transition: "opacity 0.1s",
                  }}
                >
                  {stackHeights.map((stack, stackIdx) => (
                    <div
                      key={stackIdx}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: `${stack.y}%`,
                        height: `${stack.height}%`,
                        backgroundColor: stack.series.color,
                        borderRadius:
                          stackIdx === stackHeights.length - 1
                            ? "2px 2px 0 0"
                            : 0,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Hover tooltip */}
          {hoverIndex !== null && hoverPosition && (
            <div
              style={{
                position: "absolute",
                left: hoverPosition.x < 150 ? hoverPosition.x + 10 : "auto",
                right:
                  hoverPosition.x >= 150
                    ? containerRef.current
                      ? containerRef.current.offsetWidth - hoverPosition.x + 10
                      : 10
                    : "auto",
                top: "8px",
                backgroundColor: "var(--color-panel-bg-tertiary)",
                border: "1px solid var(--color-panel-border)",
                color: "var(--color-panel-text)",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                pointerEvents: "none",
                zIndex: 10,
                minWidth: "140px",
                boxShadow: "0 4px 12px var(--color-panel-shadow)",
              }}
            >
              <div
                style={{
                  marginBottom: "6px",
                  fontWeight: 500,
                  color: "var(--color-panel-text-muted)",
                  fontSize: "10px",
                }}
              >
                {new Date(timestamps[hoverIndex] * 1000).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </div>
              {series.map((s) => (
                <div
                  key={s.name}
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
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: s.color,
                        borderRadius: "2px",
                      }}
                    />
                    <span>{s.name}</span>
                  </div>
                  <span style={{ fontWeight: 500 }}>
                    {formatValue(s.data[hoverIndex] || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time range */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "var(--color-panel-text-muted)",
          marginTop: "8px",
          paddingLeft: `${chartAreaLeft}px`,
          paddingRight: `${chartAreaRight}px`,
        }}
      >
        <span>{timeRange.start}</span>
        <span>{timeRange.end}</span>
      </div>

      {/* Legend */}
      {showLegend && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "12px",
            justifyContent: "center",
            fontSize: "11px",
          }}
        >
          {series.map((s) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: s.color,
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: "var(--color-panel-text-secondary)" }}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
