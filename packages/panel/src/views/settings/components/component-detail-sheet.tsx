import React from "react";
import { X } from "lucide-react";
import type { Component } from "../../../utils/api/types";
import { useSheetActionsSafe } from "../../../contexts/sheet-context";
import { useCronJobs } from "../../../hooks/useCronJobs";
import {
  formatCronSchedule,
  formatRelativeTime,
} from "../../../utils/cronFormatters";

export interface ComponentDetailSheetProps {
  component: Component;
  adminClient?: any;
}

export const ComponentDetailSheet: React.FC<ComponentDetailSheetProps> = ({
  component,
  adminClient,
}) => {
  const { closeSheet } = useSheetActionsSafe();

  // Fetch cron jobs for this component
  const { cronJobs, loading: loadingCrons } = useCronJobs(
    adminClient,
    component.id || null,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--color-panel-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 12px",
          borderBottom: "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg-secondary)",
          height: "40px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-panel-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
            }}
          >
            {component.path || component.name || "Component"}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={closeSheet}
          style={{
            padding: "6px",
            color: "var(--color-panel-text-secondary)",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-panel-text)";
            e.currentTarget.style.backgroundColor = "var(--color-panel-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-panel-text-secondary)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Component Info */}
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-panel-text-secondary)",
              fontFamily: "monospace",
              marginBottom: "8px",
            }}
          >
            ID: {component.id}
          </div>
          {component.state && (
            <div
              style={{
                fontSize: "12px",
                color:
                  component.state === "active"
                    ? "var(--color-panel-success)"
                    : "var(--color-panel-text-muted)",
              }}
            >
              Status: {component.state}
            </div>
          )}
        </div>

        {/* Cron Jobs Section */}
        {adminClient && (
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                margin: "0 0 16px 0",
                color: "var(--color-panel-text)",
              }}
            >
              Cron Jobs
            </h3>
            {loadingCrons ? (
              <div
                style={{
                  padding: "16px",
                  color: "var(--color-panel-text-secondary)",
                  fontSize: "14px",
                }}
              >
                Loading cron jobs...
              </div>
            ) : cronJobs && cronJobs.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {cronJobs.map((job) => (
                  <div
                    key={job.name}
                    style={{
                      padding: "12px",
                      backgroundColor: "var(--color-panel-bg-secondary)",
                      border: "1px solid var(--color-panel-border)",
                      borderRadius: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--color-panel-text)",
                        }}
                      >
                        {job.name}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text-secondary)",
                        fontFamily: "monospace",
                      }}
                    >
                      Function: {job.cronSpec?.udfPath || "N/A"}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text-secondary)",
                      }}
                    >
                      Schedule: {formatCronSchedule(job.cronSpec?.cronSchedule)}
                    </div>
                    {job.lastRun && (
                      <div
                        style={{
                          fontSize: "12px",
                          color:
                            job.lastRun.status.type === "success"
                              ? "var(--color-panel-success)"
                              : "var(--color-panel-error)",
                        }}
                      >
                        Last run:{" "}
                        {job.lastRun.status.type === "success"
                          ? "Success"
                          : "Failed"}{" "}
                        {formatRelativeTime(job.lastRun.ts)}
                      </div>
                    )}
                    {job.nextRun?.nextTs && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--color-panel-text-secondary)",
                        }}
                      >
                        Next run: {formatRelativeTime(job.nextRun.nextTs)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--color-panel-bg-tertiary)",
                  border: "1px solid var(--color-panel-border)",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "var(--color-panel-text-secondary)",
                }}
              >
                No cron jobs found for this component.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
