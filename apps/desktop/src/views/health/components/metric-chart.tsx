import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import type {
  TimeSeriesDataPoint,
  MultiSeriesChartData,
  DeploymentMarker,
} from "../types";
import { Button } from "@/components/ui/button";

export type { TimeSeriesDataPoint };

interface MetricChartProps {
  data?: TimeSeriesDataPoint[];
  multiSeriesData?: MultiSeriesChartData | null;
  deploymentMarkers?: DeploymentMarker[];
  color?: "brand" | "success" | "warning" | "error" | "info";
  height?: number;
  fullHeight?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  formatTooltipValue?: (value: number) => string;
  className?: string;
  filled?: boolean;
}

const colorStyles = {
  brand: {
    stroke: "var(--color-brand-base)",
    fill: "var(--color-brand-muted)",
    gradient: ["var(--color-brand-muted)", "transparent"],
  },
  success: {
    stroke: "var(--color-success-base)",
    fill: "var(--color-success-muted)",
    gradient: ["var(--color-success-muted)", "transparent"],
  },
  warning: {
    stroke: "var(--color-warning-base)",
    fill: "var(--color-warning-muted)",
    gradient: ["var(--color-warning-muted)", "transparent"],
  },
  error: {
    stroke: "var(--color-error-base)",
    fill: "var(--color-error-muted)",
    gradient: ["var(--color-error-muted)", "transparent"],
  },
  info: {
    stroke: "var(--color-info-base)",
    fill: "var(--color-info-muted)",
    gradient: ["var(--color-info-muted)", "transparent"],
  },
};

/**
 * Time series chart component using Recharts.
 * Supports both single-series and multi-series data with legend.
 * Styled with Tailwind and CSS variables for theme support.
 */
export function MetricChart({
  data,
  multiSeriesData,
  deploymentMarkers = [],
  color = "brand",
  height = 80,
  fullHeight = false,
  showXAxis = false,
  showYAxis = false,
  showLegend = false,
  formatValue,
  formatTooltipValue,
  className,
  filled = true,
}: MetricChartProps) {
  const colors = colorStyles[color];
  const gradientId = `gradient-${color}-${Math.random().toString(36).slice(2, 9)}`;
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  const isMultiSeries = Boolean(
    multiSeriesData && multiSeriesData.data.length > 0,
  );

  const singleSeriesChartData = useMemo(() => {
    if (!data) return [];
    return data
      .filter((d) => d.value !== null)
      .map((d) => ({
        time: d.time > 1e12 ? d.time : d.time * 1000,
        value: d.value,
      }));
  }, [data]);

  const chartData = isMultiSeries
    ? multiSeriesData!.data
    : singleSeriesChartData;

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted text-xs",
          className,
        )}
        style={{ height: fullHeight ? "100%" : height }}
      >
        No data available
      </div>
    );
  }

  if (!isMultiSeries) {
    return (
      <div
        className={cn("w-full", className)}
        style={{ height: fullHeight ? "100%" : height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.gradient[0]} />
                <stop offset="100%" stopColor={colors.gradient[1]} />
              </linearGradient>
            </defs>
            {showXAxis && (
              <XAxis
                dataKey="time"
                tickFormatter={(t) => {
                  const date = new Date(t);
                  return isValid(date) ? format(date, "HH:mm") : "";
                }}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
            )}
            {showYAxis && (
              <YAxis
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const point = payload[0].payload;
                const formattedValue = formatTooltipValue
                  ? formatTooltipValue(point.value)
                  : point.value?.toFixed(2);
                const timeDate = new Date(point.time);
                const formattedTime = isValid(timeDate)
                  ? format(timeDate, "HH:mm:ss")
                  : "Invalid time";
                return (
                  <div className="rounded-lg border border-border bg-overlay px-2.5 py-1.5 shadow-md">
                    <p className="text-xs text-muted">{formattedTime}</p>
                    <p className="text-sm font-medium text-foreground font-mono">
                      {formattedValue}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.stroke}
              strokeWidth={1.5}
              fill={filled ? `url(#${gradientId})` : "transparent"}
              dot={false}
              activeDot={{
                r: 3,
                stroke: colors.stroke,
                strokeWidth: 2,
                fill: "var(--color-surface-base)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  const { lineKeys, xAxisKey } = multiSeriesData!;

  return (
    <div
      className={cn("w-full flex flex-col", className)}
      style={{ height: fullHeight ? "100%" : height }}
    >
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            {/* Deployment markers */}
            {deploymentMarkers.map((marker) => (
              <ReferenceLine
                key={marker.timestamp}
                x={marker.time}
                stroke="var(--color-warning-base)"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            ))}

            {showXAxis && (
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={25}
              />
            )}

            {showYAxis && (
              <YAxis
                tickFormatter={formatValue}
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
            )}

            <Tooltip
              animationDuration={100}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                const visiblePayload = payload.filter(
                  (p) => !hiddenSeries.has(p.dataKey as string),
                );

                if (visiblePayload.length === 0) return null;

                const deployment = deploymentMarkers.find(
                  (m) => m.time === label,
                );

                return (
                  <div className="rounded-lg border border-border bg-overlay px-2.5 py-1.5 shadow-md max-w-sm">
                    <p className="text-xs text-muted mb-1">{label}</p>
                    {deployment && (
                      <p className="text-xs text-warning-base mb-1.5">
                        ⚠ Deployment
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {visiblePayload.map((p) => {
                        const value = p.value as number;
                        const formattedValue = formatTooltipValue
                          ? formatTooltipValue(value)
                          : value?.toFixed(2);
                        return (
                          <div
                            key={p.dataKey}
                            className="flex items-center justify-between gap-4 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2 h-0.5"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-muted truncate max-w-[150px]">
                                {p.name}
                              </span>
                            </div>
                            <span className="font-mono font-medium text-foreground">
                              {formattedValue}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />

            {/* Render a Line for each series */}
            {lineKeys.map((lineKey) => {
              const isHidden = hiddenSeries.has(lineKey.key);
              return (
                <Line
                  key={lineKey.key}
                  dataKey={lineKey.key}
                  name={lineKey.name}
                  stroke={lineKey.color}
                  strokeWidth={1.5}
                  dot={false}
                  hide={isHidden}
                  activeDot={{
                    r: 4,
                    strokeWidth: 0,
                    display: isHidden ? "none" : "block",
                  }}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {showLegend && lineKeys.length > 0 && (
        <div className="flex flex-wrap items-start gap-2 px-2 pt-2 text-[11px]">
          {lineKeys.map((lineKey) => {
            const isHidden = hiddenSeries.has(lineKey.key);
            return (
              <Button
                key={lineKey.key}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto py-0.5 px-1.5 text-[11px] font-normal transition-opacity hover:bg-muted/50",
                  isHidden ? "opacity-50" : "opacity-100",
                )}
                onClick={() => toggleSeries(lineKey.key)}
              >
                <div
                  className="h-0.5 w-2.5 mr-1.5 shrink-0"
                  style={{ backgroundColor: lineKey.color }}
                />
                <span className="truncate max-w-[200px]">
                  {lineKey.key === "_rest"
                    ? "All other functions"
                    : lineKey.name}
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
