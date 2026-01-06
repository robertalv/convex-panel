import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { HealthCard } from "./HealthCard";
import type {
  FunctionActivityData,
  FunctionActivitySeries,
} from "../hooks/useFunctionActivity";

interface FunctionActivityCardProps {
  /** Activity data */
  data: FunctionActivityData | null;
  /** Pre-built series for charting */
  series: FunctionActivitySeries[];
  /** Current rate (last bucket total) */
  currentRate: number;
  /** Total invocations */
  totalInvocations: number;
  /** Maximum value for chart scaling */
  maxValue: number;
  /** Whether data is loading */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Action button for card header
 */
function ActionButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1 rounded-md border-0",
        "bg-transparent text-muted",
        "hover:bg-overlay hover:text-foreground",
        "cursor-pointer transition-all duration-150",
        "flex items-center justify-center",
      )}
    >
      {children}
    </button>
  );
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
  onRetry,
  className,
}: FunctionActivityCardProps) {
  const [showChart, setShowChart] = useState(true);

  // Transform data for Recharts stacked bar chart
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.timestamps.map((timestamp, i) => ({
      time: timestamp * 1000, // Convert to milliseconds
      Queries: data.queries[i],
      Mutations: data.mutations[i],
      Actions: data.actions[i],
      Scheduled: data.scheduled[i],
      HTTP: data.httpActions[i],
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
          <ActionButton
            onClick={() => setShowChart(!showChart)}
            title={showChart ? "Show summary" : "Show chart"}
          >
            {showChart ? <BarChart3 size={14} /> : <TrendingUp size={14} />}
          </ActionButton>
          {onRetry && (
            <ActionButton onClick={onRetry} title="Refresh">
              <RefreshCw size={14} />
            </ActionButton>
          )}
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
                  tickFormatter={(t) => format(new Date(t), "HH:mm")}
                  tick={{ fontSize: 9, fill: "var(--color-text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis hide domain={[0, maxValue]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-border bg-overlay px-3 py-2 shadow-md">
                        <p className="text-[10px] text-muted mb-1">
                          {format(new Date(label), "HH:mm:ss")}
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
                <Bar dataKey="Queries" stackId="stack" fill="#3B82F6" />
                <Bar dataKey="Mutations" stackId="stack" fill="#10B981" />
                <Bar dataKey="Actions" stackId="stack" fill="#F59E0B" />
                <Bar dataKey="Scheduled" stackId="stack" fill="#EF4444" />
                <Bar
                  dataKey="HTTP"
                  stackId="stack"
                  fill="#8B5CF6"
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
