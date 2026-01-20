/**
 * ScheduledJobsTable
 * Virtualized table for displaying scheduled jobs
 */

import { useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Trash2 } from "lucide-react";
import { formatTimestamp } from "@convex-panel/shared";
import { toast } from "sonner";

interface ScheduledJob {
  _id: string;
  udfPath?: string;
  component?: string;
  name?: string;
  nextTs?: bigint | number;
  state?: {
    type: "pending" | "inProgress" | "success" | "failed" | "canceled";
  };
  args?: any;
  udfArgs?: ArrayBuffer;
}

interface ScheduledJobsTableProps {
  jobs: ScheduledJob[];
  height: number;
  searchQuery?: string;
  onCancelJob?: (jobId: string) => void;
  onViewArgs?: (job: ScheduledJob) => void;
  onFunctionClick?: (functionPath: string) => void;
}

const STATUS_COLORS = {
  pending: "var(--color-panel-warning)",
  inProgress: "var(--color-panel-info)",
  success: "var(--color-panel-success)",
  failed: "var(--color-panel-error)",
  canceled: "var(--color-panel-text-muted)",
};

const STATUS_BG_COLORS = {
  pending: "color-mix(in srgb, var(--color-panel-warning) 10%, transparent)",
  inProgress: "color-mix(in srgb, var(--color-panel-info) 10%, transparent)",
  success: "color-mix(in srgb, var(--color-panel-success) 10%, transparent)",
  failed: "color-mix(in srgb, var(--color-panel-error) 10%, transparent)",
  canceled: "var(--color-panel-bg-secondary)",
};

const STATUS_LABELS = {
  pending: "Pending",
  inProgress: "Running",
  success: "Success",
  failed: "Failed",
  canceled: "Canceled",
};

export function ScheduledJobsTable({
  jobs,
  height,
  searchQuery = "",
  onCancelJob,
  onViewArgs,
  onFunctionClick,
}: ScheduledJobsTableProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter((job) => {
      const jobId = job._id?.toLowerCase() || "";
      const functionName = (job.udfPath || job.component || "").toLowerCase();
      return jobId.includes(query) || functionName.includes(query);
    });
  }, [jobs, searchQuery]);

  const handleCopyId = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(jobId);
      toast.success("ID copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy ID");
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

    const status = job.state?.type || "pending";
    const functionName = job.component || job.udfPath || job.name || "Unknown";
    const scheduledTime = job.nextTs ? formatTimestamp(job.nextTs) : "-";
    const isHovered = hoveredIndex === index;

    return (
      <div
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
          transition: "background-color 0.15s",
          userSelect: "none",
        }}
        onClick={() => {
          if (onViewArgs) {
            onViewArgs(job);
          }
        }}
        onMouseEnter={(e) => {
          setHoveredIndex(index);
          e.currentTarget.style.backgroundColor = "var(--color-panel-hover)";
        }}
        onMouseLeave={(e) => {
          setHoveredIndex(null);
          e.currentTarget.style.backgroundColor = "var(--color-panel-bg)";
        }}
      >
        {/* ID Column */}
        <div
          style={{
            width: "25%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <button
            onClick={(e) => handleCopyId(job._id, e)}
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
              userSelect: "text",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-panel-accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-panel-text)";
            }}
            title="Click to copy ID"
          >
            {job._id}
          </button>
        </div>

        {/* Scheduled Time Column */}
        <div
          style={{
            width: "180px",
            color: "var(--color-panel-text-secondary)",
            userSelect: "none",
          }}
        >
          {scheduledTime}
        </div>

        {/* Status Column */}
        <div style={{ width: "100px", userSelect: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "10px",
              fontWeight: 500,
              color: STATUS_COLORS[status],
              backgroundColor: STATUS_BG_COLORS[status],
            }}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Function Column */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {onFunctionClick ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const path = job.udfPath || job.component || job.name;
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
                userSelect: "text",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-panel-accent)";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-panel-text)";
                e.currentTarget.style.textDecoration = "none";
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
                userSelect: "none",
              }}
              title={functionName}
            >
              {functionName}
            </span>
          )}
        </div>

        {/* Actions Column */}
        <div
          style={{
            width: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            userSelect: "none",
          }}
        >
          {isHovered && onCancelJob && status === "pending" && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onCancelJob(job._id);
              }}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-panel-text-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-panel-error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-panel-text-muted)";
              }}
              title="Cancel job"
            >
              <Trash2 size={12} />
            </div>
          )}
        </div>
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
        No scheduled jobs found
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
          userSelect: "none",
        }}
      >
        <div style={{ width: "25%" }}>Job ID</div>
        <div style={{ width: "180px" }}>Scheduled Time</div>
        <div style={{ width: "100px" }}>Status</div>
        <div style={{ flex: 1 }}>Function</div>
        <div style={{ width: "64px", textAlign: "right" }}>Actions</div>
      </div>

      {/* Virtualized List */}
      <List
        height={height - 32} // Subtract header height
        itemCount={filteredJobs.length}
        itemSize={40}
        width="100%"
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
}
