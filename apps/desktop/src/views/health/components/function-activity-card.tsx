import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, isValid } from "date-fns";
import { HealthCard } from "@/components/ui";
import { FUNCTION_ACTIVITY_COLORS } from "@/utils/colors";
import type {
  FunctionActivityData,
  FunctionActivitySeries,
} from "../hooks/useFunctionActivity";
import { ActionButtonForHealthCard } from "./action-button-for-health-card";

interface FunctionActivityCardProps {
  data: FunctionActivityData | null;
  series: FunctionActivitySeries[];
  currentRate: number;
  totalInvocations: number;
  maxValue: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Card displaying function activity by type over time.
 * Matches the Convex dashboard design.
 */
export function FunctionActivityCard({
  data,
  series,
  currentRate,
  totalInvocations,
  maxValue,
  loading = false,
  error = null,
  className,
}: FunctionActivityCardProps) {
  const [showChart, setShowChart] = useState(true);

  const chartData = useMemo(() => {
    if (!data || !data.timestamps || !Array.isArray(data.timestamps)) return [];
    return data.timestamps.map((timestamp, i) => ({
      time: timestamp * 1000, // Convert to milliseconds
      Queries: data.queries?.[i] ?? 0,
      Mutations: data.mutations?.[i] ?? 0,
      Actions: data.actions?.[i] ?? 0,
      Scheduled: data.scheduled?.[i] ?? 0,
      HTTP: data.httpActions?.[i] ?? 0,
    }));
  }, [data]);

  return (
    <HealthCard
      title="Function Activity"
      tip="Invocations by type per minute."
      loading={loading}
      error={error}
      className={className}
      action={
        <div className="flex items-center gap-1">
          <ActionButtonForHealthCard
            onClick={() => setShowChart(!showChart)}
            title={showChart ? "Show summary" : "Show chart"}
          >
            {showChart ? <Icon name="barChart" size={14} /> : <Icon name="trendingUp" size={14} />}
          </ActionButtonForHealthCard>
        </div>
      }
    >
      <div className="flex flex-col gap-4 w-full">
        {/* Current rate display */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground font-mono">
            {currentRate}
          </span>
          <span className="text-xs text-muted">invocations/min</span>
          <span className="ml-auto text-[11px] text-subtle">
            {totalInvocations.toLocaleString()} total (1h)
          </span>
        </div>

        {/* Chart view */}
        {data && showChart && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <XAxis
                  dataKey="time"
                  tickFormatter={(t) => {
                    const date = new Date(t);
                    return isValid(date) ? format(date, "HH:mm") : "";
                  }}
                  tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis hide domain={[0, maxValue]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const labelDate = new Date(label);
                    const formattedTime = isValid(labelDate)
                      ? format(labelDate, "HH:mm:ss")
                      : "Invalid time";
                    return (
                      <div className="rounded-lg border border-border bg-overlay px-3 py-2 shadow-md">
                        <p className="text-[10px] text-muted mb-1">
                          {formattedTime}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {payload.map((entry) => (
                            <p
                              key={entry.name}
                              className="text-[10px] flex items-center gap-1.5"
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted">{entry.name}:</span>
                              <span className="font-medium text-foreground font-mono">
                                {entry.value}
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="Queries"
                  stackId="stack"
                  fill={FUNCTION_ACTIVITY_COLORS.queries}
                />
                <Bar
                  dataKey="Mutations"
                  stackId="stack"
                  fill={FUNCTION_ACTIVITY_COLORS.mutations}
                />
                <Bar
                  dataKey="Actions"
                  stackId="stack"
                  fill={FUNCTION_ACTIVITY_COLORS.actions}
                />
                <Bar
                  dataKey="Scheduled"
                  stackId="stack"
                  fill={FUNCTION_ACTIVITY_COLORS.scheduled}
                />
                <Bar
                  dataKey="HTTP"
                  stackId="stack"
                  fill={FUNCTION_ACTIVITY_COLORS.http}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary view */}
        {data && !showChart && (
          <div className="flex flex-col gap-2">
            {series.map((s) => {
              const total = s.data.reduce((sum, val) => sum + val, 0);
              const pct =
                totalInvocations > 0
                  ? ((total / totalInvocations) * 100).toFixed(1)
                  : "0.0";
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="flex-1 text-xs text-foreground">
                    {s.name}
                  </span>
                  <span className="text-xs font-medium text-foreground font-mono">
                    {total.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted w-12 text-right font-mono">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend (only in chart view) */}
        {data && showChart && (
          <div className="flex flex-wrap gap-4">
            {series.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[10px] text-muted">{s.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* No data state */}
        {!data && !loading && (
          <div className="flex items-center justify-center h-24 text-muted text-xs">
            No function activity data available
          </div>
        )}
      </div>
    </HealthCard>
  );
}
