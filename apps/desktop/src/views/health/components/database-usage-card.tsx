import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { HealthCard, BarChart, BarDataPoint } from "@/components/ui";
import type { UsageDataPoint } from "../hooks/useUsageMetrics";
import { formatBytes } from "@/utils/udfs";

type TabType = "Storage" | "Bandwidth" | "Document Count";

interface DatabaseUsageCardProps {
  databaseReadBytes: number;
  databaseWriteBytes: number;
  databaseReadDocuments: number;
  storageReadBytes: number;
  storageWriteBytes: number;
  timeSeries: UsageDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

interface TabButtonProps {
  tab: TabType;
  activeTab: TabType;
  onClick: (tab: TabType) => void;
}

function TabButton({ tab, activeTab, onClick }: TabButtonProps) {
  return (
    <button
      onClick={() => onClick(tab)}
      className={cn(
        "px-2.5 py-1 text-[10px] font-medium rounded transition-all whitespace-nowrap",
        activeTab === tab
          ? "bg-surface-alt text-foreground"
          : "text-muted hover:text-foreground",
      )}
    >
      {tab}
    </button>
  );
}

/**
 * Card displaying database usage metrics with charts.
 * Shows storage (Tables/Indexes), bandwidth (Reads/Writes), and document count.
 */
export function DatabaseUsageCard({
  databaseReadBytes,
  databaseWriteBytes,
  databaseReadDocuments,
  storageReadBytes,
  storageWriteBytes,
  timeSeries,
  isLoading = false,
  error = null,
  className,
}: DatabaseUsageCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("Bandwidth");

  const hasData =
    databaseReadBytes > 0 ||
    databaseWriteBytes > 0 ||
    storageReadBytes > 0 ||
    storageWriteBytes > 0 ||
    timeSeries.length > 0;

  // Calculate totals for the legend
  const totals = useMemo(() => {
    // For Storage: Tables = database bytes, Indexes = storage bytes
    const tablesTotal = databaseReadBytes + databaseWriteBytes;
    const indexesTotal = storageReadBytes + storageWriteBytes;

    // For Bandwidth: Reads = read bytes, Writes = write bytes
    const readsTotal = databaseReadBytes + storageReadBytes;
    const writesTotal = databaseWriteBytes + storageWriteBytes;

    return {
      tables: tablesTotal,
      indexes: indexesTotal,
      reads: readsTotal,
      writes: writesTotal,
      documents: databaseReadDocuments,
    };
  }, [
    databaseReadBytes,
    databaseWriteBytes,
    storageReadBytes,
    storageWriteBytes,
    databaseReadDocuments,
  ]);

  // Convert time-series data to chart data based on active tab
  const chartData: BarDataPoint[] = useMemo(() => {
    if (timeSeries.length === 0) {
      return [];
    }

    return timeSeries.map((point) => {
      if (activeTab === "Storage") {
        // Storage: Tables (database bytes) vs Indexes (storage bytes)
        return {
          label: point.label,
          value: point.databaseReadBytes + point.databaseWriteBytes,
          secondary: point.storageReadBytes + point.storageWriteBytes,
        };
      } else if (activeTab === "Bandwidth") {
        // Bandwidth: Reads vs Writes
        return {
          label: point.label,
          value: point.databaseReadBytes + point.storageReadBytes,
          secondary: point.databaseWriteBytes + point.storageWriteBytes,
        };
      } else {
        // Document Count
        return {
          label: point.label,
          value: point.databaseReadDocuments,
        };
      }
    });
  }, [activeTab, timeSeries]);

  const formatValue = (v: number): string => {
    if (activeTab === "Document Count") return v.toFixed(0);
    return formatBytes(v);
  };

  // Get legend config based on active tab
  const legendConfig = useMemo(() => {
    if (activeTab === "Storage") {
      return {
        primary: { label: "Tables", value: totals.tables, color: "bg-info" },
        secondary: {
          label: "Indexes",
          value: totals.indexes,
          color: "bg-warning",
        },
        stacked: true,
      };
    } else if (activeTab === "Bandwidth") {
      return {
        primary: { label: "Reads", value: totals.reads, color: "bg-info" },
        secondary: {
          label: "Writes",
          value: totals.writes,
          color: "bg-warning",
        },
        stacked: true,
      };
    } else {
      return {
        primary: {
          label: "Documents",
          value: totals.documents,
          color: "bg-info",
        },
        secondary: null,
        stacked: false,
      };
    }
  }, [activeTab, totals]);

  // Tab navigation component for the HealthCard action slot
  const tabNavigation = (
    <div className="flex items-center gap-0.5 rounded-md bg-surface-alt/50 p-0.5 border border-border/50">
      {(["Storage", "Bandwidth", "Document Count"] as TabType[]).map((tab) => (
        <TabButton
          key={tab}
          tab={tab}
          activeTab={activeTab}
          onClick={setActiveTab}
        />
      ))}
    </div>
  );

  return (
    <HealthCard
      title="Database"
      tip="Database storage, bandwidth, and document count metrics. Storage shows Tables vs Indexes, Bandwidth shows Reads vs Writes."
      loading={isLoading}
      error={error}
      action={tabNavigation}
      className={className}
    >
      {hasData ? (
        <div className="flex flex-col gap-3">
          {/* Chart Area */}
          <div className="min-h-[180px] w-full">
            <BarChart
              data={chartData}
              height={170}
              stacked={legendConfig.stacked}
              formatValue={formatValue}
              colors={
                legendConfig.stacked
                  ? ["var(--color-info-base)", "var(--color-warning-base)"]
                  : ["var(--color-info-base)"]
              }
              labels={
                legendConfig.stacked
                  ? [
                      legendConfig.primary.label,
                      legendConfig.secondary?.label || "",
                    ]
                  : [legendConfig.primary.label]
              }
            />
          </div>

          {/* Legend with totals */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  legendConfig.primary.color,
                )}
              />
              <span className="text-[11px] text-muted">
                {legendConfig.primary.label}:
              </span>
              <span className="text-[11px] font-medium text-foreground">
                {activeTab === "Document Count"
                  ? legendConfig.primary.value.toLocaleString()
                  : formatBytes(legendConfig.primary.value)}
              </span>
            </div>
            {legendConfig.secondary && (
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    legendConfig.secondary.color,
                  )}
                />
                <span className="text-[11px] text-muted">
                  {legendConfig.secondary.label}:
                </span>
                <span className="text-[11px] font-medium text-foreground">
                  {formatBytes(legendConfig.secondary.value)}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-[180px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-alt/30 px-6 text-center">
          <div className="h-8 w-8 rounded-full bg-surface-alt flex items-center justify-center mb-2 text-muted">
            <Icon name="database2" size={16} />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
            No Database Activity
          </span>
          <p className="mt-1 text-[10px] text-subtle leading-relaxed max-w-[180px]">
            Waiting for database operations to generate metrics.
          </p>
        </div>
      )}
    </HealthCard>
  );
}
