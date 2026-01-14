/**
 * CronJobsTable
 * Virtualized table for displaying cron jobs
 */

import { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { formatCronSchedule, formatRelativeTime } from "@convex-panel/shared";
import type { CronJobWithRuns } from "@convex-panel/shared";
import { toast } from "sonner";

interface CronJobsTableProps {
  cronJobs: CronJobWithRuns[];
  height: number;
  searchQuery?: string;
  onRowClick?: (job: CronJobWithRuns) => void;
  onFunctionClick?: (functionPath: string) => void;
}

const STATE_COLORS = {
  scheduled: "var(--color-panel-info)",
  running: "var(--color-panel-warning)",
  paused: "var(--color-panel-text-muted)",
};

const STATE_BG_COLORS = {
  scheduled: "color-mix(in srgb, var(--color-panel-info) 10%, transparent)",
  running: "color-mix(in srgb, var(--color-panel-warning) 10%, transparent)",
  paused: "var(--color-panel-bg-secondary)",
};

const STATE_LABELS = {
  scheduled: "Scheduled",
  running: "Running",
  paused: "Paused",
};

export function CronJobsTable({
  cronJobs,
  height,
  searchQuery = "",
  onRowClick,
  onFunctionClick,
}: CronJobsTableProps) {
  const filteredJobs = useMemo(() => {
    if (!searchQuery) return cronJobs;
    const query = searchQuery.toLowerCase();
    return cronJobs.filter((job) => {
      const name = job.name?.toLowerCase() || "";
      const functionName = job.cronSpec?.udfPath?.toLowerCase() || "";
      return name.includes(query) || functionName.includes(query);
    });
  }, [cronJobs, searchQuery]);

  const handleCopyName = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(name);
      toast.success("Name copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy name");
    }
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const job = filteredJobs[index];

    if (!job) return null;

    const state = job.nextRun?.state || "scheduled";
    const schedule = formatCronSchedule(job.cronSpec.cronSchedule);
    const functionName = job.cronSpec.udfPath || "Unknown";
    const lastRun = job.lastRun ? formatRelativeTime(job.lastRun.ts) : "Never";
    const nextRun = job.nextRun?.nextTs
      ? formatRelativeTime(job.nextRun.nextTs)
      : "-";
    const lastStatus = job.lastRun?.status.type;

    return (
      <div
        className="cron-job-row"
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          padding: "8px",
          borderBottom: "1px solid var(--cp-data-row-border)",
          fontSize: "12px",
          fontFamily: "monospace",
          color: "var(--color-panel-text-secondary)",
          backgroundColor: "var(--color-panel-bg)",
          cursor: "pointer",
        }}
        onClick={() => onRowClick?.(job)}
      >
        {/* Name Column */}
        <div
          style={{
            width: "25%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <span
            className="cron-job-name"
            onClick={(e) => handleCopyName(job.name, e)}
            style={{
              color: "var(--color-panel-text)",
              fontFamily: "monospace",
              fontSize: "11px",
              cursor: "pointer",
            }}
            title="Click to copy name"
          >
            {job.name}
          </span>
        </div>

        {/* Schedule Column */}
        <div
          style={{
            width: "25%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--color-panel-text-secondary)",
          }}
          title={schedule}
        >
          {schedule}
        </div>

        {/* Function Column */}
        <div
          style={{
            width: "25%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {onFunctionClick ? (
            <button
              className="cron-job-function-button"
              onClick={(e) => {
                e.stopPropagation();
                const path = job.cronSpec.udfPath;
                if (path) onFunctionClick(path);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-panel-text)",
                fontFamily: "monospace",
                fontSize: "11px",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                maxWidth: "100%",
              }}
              title={`${functionName} (click to view function)`}
            >
              {functionName}
            </button>
          ) : (
            <span
              style={{
                color: "var(--color-panel-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={functionName}
            >
              {functionName}
            </span>
          )}
        </div>

        {/* Last/Next Run Column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            <span style={{ fontSize: "10px" }}>Last:</span>
            <span style={{ fontSize: "11px" }}>{lastRun}</span>
            {lastStatus === "failure" && (
              <span style={{ color: "var(--color-panel-error)" }}>✕</span>
            )}
            {lastStatus === "success" && (
              <span style={{ color: "var(--color-panel-success)" }}>✓</span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--color-panel-text-muted)",
            }}
          >
            <span style={{ fontSize: "10px" }}>Next:</span>
            <span style={{ fontSize: "11px" }}>{nextRun}</span>
            <span
              style={{
                marginLeft: "4px",
                display: "inline-flex",
                alignItems: "center",
                padding: "1px 6px",
                borderRadius: "9999px",
                fontSize: "9px",
                fontWeight: 500,
                color: STATE_COLORS[state],
                backgroundColor: STATE_BG_COLORS[state],
              }}
            >
              {STATE_LABELS[state]}
            </span>
          </div>
        </div>

        <style>{`
          .cron-job-row:hover {
            background-color: var(--color-panel-hover) !important;
          }
          .cron-job-name:hover {
            color: var(--color-panel-accent) !important;
          }
          .cron-job-function-button:hover {
            color: var(--color-panel-accent) !important;
            text-decoration: underline !important;
          }
        `}</style>
      </div>
    );
  };

  if (filteredJobs.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          color: "var(--color-panel-text-muted)",
        }}
      >
        No cron jobs found
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px",
          borderBottom: "1px solid var(--cp-data-row-border)",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--color-panel-text-muted)",
          backgroundColor: "var(--color-panel-bg)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ width: "25%" }}>Name</div>
        <div style={{ width: "25%" }}>Schedule</div>
        <div style={{ width: "25%" }}>Function</div>
        <div style={{ flex: 1 }}>Last/Next Run</div>
      </div>

      {/* Virtualized List */}
      <List
        height={height - 32} // Subtract header height
        itemCount={filteredJobs.length}
        itemSize={52} // Slightly taller for two-line last/next run
        width="100%"
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
}
