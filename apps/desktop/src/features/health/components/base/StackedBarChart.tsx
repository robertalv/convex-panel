import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";

export interface StackedBarDataPoint {
  /** Timestamp in milliseconds or seconds */
  time: number;
  /** Success count or value */
  success?: number;
  /** Error count or value */
  errors?: number;
  /** Total count (if not providing success/errors) */
  total?: number;
  /** Optional label */
  label?: string;
}

interface StackedBarChartProps {
  /** Data points */
  data: StackedBarDataPoint[];
  /** Height of the chart */
  height?: number;
  /** Whether to show the X axis */
  showXAxis?: boolean;
  /** Whether to show the Y axis */
  showYAxis?: boolean;
  /** Whether to show stacked errors */
  showErrors?: boolean;
  /** Format function for tooltip values */
  formatTooltipValue?: (value: number, key: string) => string;
  /** Additional CSS classes */
  className?: string;
}

const COLORS = {
  success: "oklch(0.7 0.18 145)", // Green
  errors: "oklch(0.65 0.22 25)", // Red
  total: "oklch(0.65 0.2 250)", // Blue
};

/**
 * Stacked bar chart component for showing success/error distributions.
 */
export function StackedBarChart({
  data,
  height = 80,
  showXAxis = false,
  showYAxis = false,
  showErrors = true,
  formatTooltipValue,
  className,
}: StackedBarChartProps) {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((d) => ({
      time: d.time > 1e12 ? d.time : d.time * 1000, // Ensure milliseconds
      success: d.success ?? (d.total ?? 0) - (d.errors ?? 0),
      errors: d.errors ?? 0,
      total: d.total ?? (d.success ?? 0) + (d.errors ?? 0),
      label: d.label,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-text-muted text-xs",
          className,
        )}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const hasErrors = chartData.some((d) => d.errors > 0);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          {showXAxis && (
            <XAxis
              dataKey="time"
              tickFormatter={(t) => {
                const date = new Date(t);
                return isValid(date) ? format(date, "HH:mm") : "";
              }}
              tick={{ fontSize: 10, fill: "oklch(0.55 0.02 285)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
          )}
          {showYAxis && (
            <YAxis
              tick={{ fontSize: 10, fill: "oklch(0.55 0.02 285)" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const point = payload[0].payload;
              const timeDate = new Date(point.time);
              const formattedTime = point.label
                ? point.label
                : isValid(timeDate)
                  ? format(timeDate, "HH:mm:ss")
                  : "Invalid time";
              return (
                <div className="rounded-lg border border-border-base bg-surface-overlay px-2.5 py-1.5 shadow-md">
                  <p className="text-xs text-text-muted mb-1">
                    {formattedTime}
                  </p>
                  <div className="space-y-0.5">
                    <p className="text-xs">
                      <span
                        className="inline-block w-2 h-2 rounded-sm mr-1.5"
                        style={{ backgroundColor: COLORS.success }}
                      />
                      <span className="text-text-muted">Success: </span>
                      <span className="font-medium text-text-base">
                        {formatTooltipValue
                          ? formatTooltipValue(point.success, "success")
                          : point.success}
                      </span>
                    </p>
                    {showErrors && hasErrors && (
                      <p className="text-xs">
                        <span
                          className="inline-block w-2 h-2 rounded-sm mr-1.5"
                          style={{ backgroundColor: COLORS.errors }}
                        />
                        <span className="text-text-muted">Errors: </span>
                        <span className="font-medium text-error-text">
                          {formatTooltipValue
                            ? formatTooltipValue(point.errors, "errors")
                            : point.errors}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="success"
            stackId="stack"
            fill={COLORS.success}
            radius={[0, 0, 0, 0]}
          />
          {showErrors && hasErrors && (
            <Bar
              dataKey="errors"
              stackId="stack"
              fill={COLORS.errors}
              radius={[2, 2, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
