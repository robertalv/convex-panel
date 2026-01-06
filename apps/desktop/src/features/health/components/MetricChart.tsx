import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface TimeSeriesDataPoint {
  /** Timestamp in milliseconds or seconds */
  time: number;
  /** Metric value */
  value: number | null;
}

interface MetricChartProps {
  /** Time series data points */
  data: TimeSeriesDataPoint[];
  /** Chart color variant */
  color?: "brand" | "success" | "warning" | "error" | "info";
  /** Height of the chart */
  height?: number;
  /** Whether to show the X axis */
  showXAxis?: boolean;
  /** Whether to show the Y axis */
  showYAxis?: boolean;
  /** Whether to show grid lines */
  showGrid?: boolean;
  /** Format function for Y axis values */
  formatValue?: (value: number) => string;
  /** Format function for tooltip values */
  formatTooltipValue?: (value: number) => string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to fill the area under the line */
  filled?: boolean;
}

// Color styles using CSS variables that work with light/dark modes
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
 * Styled with Tailwind and CSS variables for theme support.
 */
export function MetricChart({
  data,
  color = "brand",
  height = 80,
  showXAxis = false,
  showYAxis = false,
  formatValue,
  formatTooltipValue,
  className,
  filled = true,
}: MetricChartProps) {
  const colors = colorStyles[color];
  const gradientId = `gradient-${color}-${Math.random().toString(36).slice(2, 9)}`;

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data
      .filter((d) => d.value !== null)
      .map((d) => ({
        time: d.time > 1e12 ? d.time : d.time * 1000, // Ensure milliseconds
        value: d.value,
      }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted text-xs",
          className,
        )}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
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
              tickFormatter={(t) => format(new Date(t), "HH:mm")}
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
              return (
                <div className="rounded-lg border border-border bg-overlay px-2.5 py-1.5 shadow-md">
                  <p className="text-xs text-muted">
                    {format(new Date(point.time), "HH:mm:ss")}
                  </p>
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
