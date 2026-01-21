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
  time: number;
  success?: number;
  errors?: number;
  total?: number;
  label?: string;
}

interface StackedBarChartProps {
  data: StackedBarDataPoint[];
  height?: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showErrors?: boolean;
  formatTooltipValue?: (value: number, key: string) => string;
  className?: string;
}

const COLORS = {
  success: "oklch(0.7 0.18 145)",
  errors: "oklch(0.65 0.22 25)",
  total: "oklch(0.65 0.2 250)",
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
  const chartData = useMemo(() => {
    return data.map((d) => ({
      time: d.time > 1e12 ? d.time : d.time * 1000,
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
