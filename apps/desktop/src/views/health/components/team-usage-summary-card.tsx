import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HealthCard } from "@/components/ui";
import type { UsageSummary } from "@convex-panel/shared/api";
import { formatBytes } from "@/utils/udfs";
import { formatGBHours } from "@/utils/metrics";
import { formatLargeNumberWithSuffix } from "@/utils/metrics";

interface TeamUsageSummaryCardProps {
  data: UsageSummary | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

interface UsageMetricProps {
  icon?: string;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  percentage?: number;
}

function UsageMetric({
  label,
  value,
  subValue,
  color,
  percentage,
}: UsageMetricProps) {
  return (
    <div className="flex items-center rounded-lg bg-surface-alt/50">
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted block truncate">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold font-mono text-foreground">
            {value}
          </span>
          {subValue && (
            <span className="text-[10px] text-muted">{subValue}</span>
          )}
        </div>
      </div>
      {percentage !== undefined && percentage > 0 && (
        <div className="flex items-center justify-center w-10">
          <MiniDonut percentage={percentage} color={color} />
        </div>
      )}
    </div>
  );
}

interface MiniDonutProps {
  percentage: number;
  color: string;
  size?: number;
}

function MiniDonut({ percentage, color, size = 32 }: MiniDonutProps) {
  const data = [
    { name: "used", value: Math.min(percentage, 100) },
    { name: "remaining", value: Math.max(100 - percentage, 0) },
  ];

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.3}
            outerRadius={size * 0.45}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="var(--color-border-base)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Color palette for metrics
const COLORS = {
  functionCalls: "var(--color-brand-base)",
  actionCompute: "var(--color-warning-base)",
  databaseStorage: "var(--color-success-base)",
  databaseBandwidth: "var(--color-info-base)",
  fileStorage: "var(--color-accent-base)",
  fileBandwidth: "#8b5cf6", // purple
  vectorStorage: "#ec4899", // pink
  vectorBandwidth: "#f97316", // orange
};

/**
 * Card displaying team-level usage summary from BigBrain API.
 * Shows billing-period usage data including function calls, compute, storage, etc.
 */
export function TeamUsageSummaryCard({
  data,
  isLoading = false,
  error = null,
  className,
}: TeamUsageSummaryCardProps) {
  // Calculate total for donut chart (just for visual representation)
  const chartData = useMemo(() => {
    if (!data) return [];

    // Normalize values for the chart (these are relative sizes for visualization)
    const items = [
      {
        name: "Function Calls",
        value: Math.log10(data.functionCalls + 1),
        color: COLORS.functionCalls,
      },
      {
        name: "Action Compute",
        value: data.actionCompute * 100 + 1,
        color: COLORS.actionCompute,
      },
      {
        name: "Database",
        value: Math.log10(data.databaseStorage + data.databaseBandwidth + 1),
        color: COLORS.databaseStorage,
      },
      {
        name: "File Storage",
        value: Math.log10(data.fileStorage + data.fileBandwidth + 1),
        color: COLORS.fileStorage,
      },
      {
        name: "Vector",
        value: Math.log10(data.vectorStorage + data.vectorBandwidth + 1),
        color: COLORS.vectorStorage,
      },
    ].filter((item) => item.value > 0);

    return items;
  }, [data]);

  const hasData =
    data &&
    (data.functionCalls > 0 ||
      data.actionCompute > 0 ||
      data.databaseStorage > 0 ||
      data.databaseBandwidth > 0 ||
      data.fileStorage > 0 ||
      data.fileBandwidth > 0 ||
      data.vectorStorage > 0 ||
      data.vectorBandwidth > 0);

  return (
    <HealthCard
      title="Project Usage"
      tip="Project-level usage metrics for the current billing period. This data comes from Convex's billing system and shows usage for this project only."
      loading={isLoading}
      error={error}
      className={className}
    >
      {hasData && data ? (
        <div className="flex flex-col gap-3">
          {/* Main overview chart */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-surface-alt/30 border border-border-base/50">
            <div className="w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      return (
                        <div className="rounded-lg border border-border bg-overlay px-2.5 py-1.5 shadow-md">
                          <p className="text-xs font-medium text-foreground">
                            {payload[0].name}
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted mb-1">
                Total Function Calls
              </div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatLargeNumberWithSuffix(data.functionCalls)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted">
                  {formatGBHours(data.actionCompute)} GB-hours compute
                </span>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <UsageMetric
              label="Function Calls"
              value={formatLargeNumberWithSuffix(data.functionCalls)}
              color={COLORS.functionCalls}
            />
            <UsageMetric
              label="Action Compute"
              value={formatGBHours(data.actionCompute)}
              subValue="GB-hrs"
              color={COLORS.actionCompute}
            />
          </div>

          {/* Database section */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Database
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <UsageMetric
                label="Storage"
                value={formatBytes(data.databaseStorage)}
                color={COLORS.databaseStorage}
              />
              <UsageMetric
                label="Bandwidth"
                value={formatBytes(data.databaseBandwidth)}
                color={COLORS.databaseBandwidth}
              />
            </div>
          </div>

          {/* File Storage section */}
          <div>
            <div className="flex items-center mb-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                File Storage
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <UsageMetric
                label="Storage"
                value={formatBytes(data.fileStorage)}
                color={COLORS.fileStorage}
              />
              <UsageMetric
                label="Bandwidth"
                value={formatBytes(data.fileBandwidth)}
                color={COLORS.fileBandwidth}
              />
            </div>
          </div>

          {/* Vector section - only show if there's vector usage */}
          {(data.vectorStorage > 0 || data.vectorBandwidth > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wide">
                  Vector Index
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <UsageMetric
                  label="Storage"
                  value={formatBytes(data.vectorStorage)}
                  color={COLORS.vectorStorage}
                />
                <UsageMetric
                  label="Bandwidth"
                  value={formatBytes(data.vectorBandwidth)}
                  color={COLORS.vectorBandwidth}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-4 py-8 text-center">
          <span className="text-sm text-muted">No billing data available</span>
          <span className="text-xs text-muted mt-1">
            Team usage data may not be available for this deployment
          </span>
        </div>
      )}
    </HealthCard>
  );
}
