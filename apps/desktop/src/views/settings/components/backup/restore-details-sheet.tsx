import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Monitor,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export interface TableChange {
  table: string;
  created: number;
  deleted: number;
  total: number;
}

export interface SchemaSection {
  schema: string;
  tables: TableChange[];
}

export interface RestoreDetailsSheetProps {
  restoreStatus: {
    state:
      | "in_progress"
      | "uploaded"
      | "waiting_for_confirmation"
      | "completed"
      | "failed"
      | null;
    progressMessage?: string;
    checkpointMessages?: string[];
    errorMessage?: string;
    completedTime?: Date;
    restoredRowsCount?: number;
    importId?: string;
  };
  backupInfo?: {
    name?: string;
    timestamp?: number;
    type?: string;
  };
  deploymentInfo?: {
    name?: string;
    projectName?: string;
  };
  tableChanges?: SchemaSection[];
}

export const RestoreDetailsSheet: React.FC<RestoreDetailsSheetProps> = ({
  restoreStatus,
  backupInfo,
  deploymentInfo,
  tableChanges = [],
}) => {
  const isCompleted = restoreStatus.state === "completed";
  const isFailed = restoreStatus.state === "failed";
  const isInProgress =
    restoreStatus.state === "in_progress" ||
    restoreStatus.state === "uploaded" ||
    restoreStatus.state === "waiting_for_confirmation";

  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    new Set(["default"]),
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  const toggleSchema = (schema: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schema)) {
      newExpanded.delete(schema);
    } else {
      newExpanded.add(schema);
    }
    setExpandedSchemas(newExpanded);
  };

  // If no table changes provided, create a default structure from checkpoint messages
  const defaultTables: TableChange[] =
    restoreStatus.checkpointMessages?.map((msg) => {
      // Extract table name from messages like "Imported 'chats'"
      const match = msg.match(/['"]([^'"]+)['"]/);
      const tableName = match ? match[1] : msg;
      return {
        table: tableName,
        created: 0,
        deleted: 0,
        total: 0,
      };
    }) || [];

  const defaultSchema: SchemaSection = {
    schema: "default",
    tables: defaultTables,
  };

  const schemas =
    tableChanges.length > 0
      ? tableChanges
      : defaultTables.length > 0
        ? [defaultSchema]
        : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        padding: "24px",
        gap: "24px",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {isCompleted && (
            <CheckCircle2
              size={24}
              style={{ color: "var(--color-success-base)" }}
            />
          )}
          {isFailed && (
            <XCircle size={24} style={{ color: "var(--color-error-base)" }} />
          )}
          {isInProgress && (
            <Clock size={24} style={{ color: "var(--color-brand-base)" }} />
          )}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text-base)",
              margin: 0,
            }}
          >
            Restore{" "}
            {isCompleted ? "Succeeded" : isFailed ? "Failed" : "In Progress"}
          </h2>
        </div>
      </div>

      {/* Backup to Deployment Flow */}
      {(backupInfo || deploymentInfo) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "16px",
            backgroundColor: "var(--color-surface-raised)",
            borderRadius: "8px",
            border: "1px solid var(--color-border-base)",
          }}
        >
          {/* Backup */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <HardDrive
                size={16}
                style={{ color: "var(--color-text-muted)" }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Backup
              </span>
            </div>
            {backupInfo?.name && (
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-base)",
                  fontWeight: 500,
                }}
              >
                {backupInfo.name}
              </div>
            )}
            {backupInfo?.timestamp && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                {formatDate(backupInfo.timestamp)} (
                {formatRelativeTime(backupInfo.timestamp)})
              </div>
            )}
            {backupInfo?.type && (
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                {backupInfo.type}
              </div>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight
            size={20}
            style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
          />

          {/* Deployment */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <Monitor size={16} style={{ color: "var(--color-text-muted)" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                Deployment
              </span>
            </div>
            {(deploymentInfo?.name || deploymentInfo?.projectName) && (
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-base)",
                  fontWeight: 500,
                }}
              >
                {deploymentInfo.name && deploymentInfo.projectName
                  ? `${deploymentInfo.name} / ${deploymentInfo.projectName}`
                  : deploymentInfo.name || deploymentInfo.projectName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Changes */}
      {schemas.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {schemas.map((schemaSection, schemaIdx) => {
            const isExpanded = expandedSchemas.has(schemaSection.schema);
            const hasMultipleSchemas = schemas.length > 1;

            return (
              <div
                key={schemaIdx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: hasMultipleSchemas ? "16px" : 0,
                }}
              >
                {/* Schema Header (if multiple schemas) */}
                {hasMultipleSchemas && (
                  <button
                    type="button"
                    onClick={() => toggleSchema(schemaSection.schema)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      backgroundColor: "var(--color-surface-raised)",
                      border: "1px solid var(--color-border-base)",
                      borderBottom: isExpanded
                        ? "none"
                        : "1px solid var(--color-border-base)",
                      borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
                      cursor: "pointer",
                      color: "var(--color-text-base)",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-surface-raised)";
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown
                        size={16}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                    )}
                    <span>{schemaSection.schema}</span>
                  </button>
                )}

                {/* Table */}
                {(!hasMultipleSchemas || isExpanded) && (
                  <div
                    style={{
                      border: "1px solid var(--color-border-base)",
                      borderRadius: hasMultipleSchemas ? "0 0 8px 8px" : "8px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: hasMultipleSchemas ? "400px" : "none",
                    }}
                  >
                    {/* Table Header */}
                    <div
                      style={{
                        display: "flex",
                        backgroundColor: "var(--color-surface-raised)",
                        borderBottom: "1px solid var(--color-border-base)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRight: "1px solid var(--color-border-base)",
                        }}
                      >
                        Table
                      </div>
                      <div
                        style={{
                          width: "120px",
                          padding: "12px",
                          borderRight: "1px solid var(--color-border-base)",
                        }}
                      >
                        Created
                      </div>
                      <div
                        style={{
                          width: "140px",
                          padding: "12px",
                        }}
                      >
                        Deleted
                      </div>
                    </div>

                    {/* Table Body */}
                    <div
                      style={{
                        overflow: "auto",
                        backgroundColor: "var(--color-surface-base)",
                        maxHeight: hasMultipleSchemas ? "350px" : "none",
                      }}
                    >
                      {schemaSection.tables.map((table, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            borderBottom:
                              idx < schemaSection.tables.length - 1
                                ? "1px solid var(--color-border-base)"
                                : "none",
                            fontSize: "14px",
                            color: "var(--color-text-base)",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              padding: "12px",
                              borderRight: "1px solid var(--color-border-base)",
                              fontFamily: "monospace",
                              fontSize: "13px",
                            }}
                          >
                            {table.table}
                          </div>
                          <div
                            style={{
                              width: "120px",
                              padding: "12px",
                              borderRight: "1px solid var(--color-border-base)",
                            }}
                          >
                            {table.created > 0 ? (
                              <span>
                                {table.created.toLocaleString()}{" "}
                                {table.created === 1 ? "document" : "documents"}
                              </span>
                            ) : (
                              <span
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                0 documents
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              width: "140px",
                              padding: "12px",
                            }}
                          >
                            {table.total !== undefined &&
                            !isNaN(table.total) ? (
                              table.deleted > 0 ? (
                                <span>
                                  {table.deleted.toLocaleString()} of{" "}
                                  {table.total.toLocaleString()}{" "}
                                  {table.total === 1 ? "document" : "documents"}
                                </span>
                              ) : (
                                <span
                                  style={{ color: "var(--color-text-muted)" }}
                                >
                                  0 of {table.total.toLocaleString()}{" "}
                                  {table.total === 1 ? "document" : "documents"}
                                </span>
                              )
                            ) : (
                              <span
                                style={{ color: "var(--color-text-muted)" }}
                              >
                                0 documents
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error Message */}
      {isFailed && restoreStatus.errorMessage && (
        <div
          style={{
            padding: "12px",
            backgroundColor:
              "color-mix(in srgb, var(--color-error-base) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--color-error-base) 20%, transparent)",
            borderRadius: "6px",
            color: "var(--color-error-base)",
            fontSize: "14px",
          }}
        >
          {restoreStatus.errorMessage}
        </div>
      )}

      {/* Summary */}
      {isCompleted && restoreStatus.restoredRowsCount !== undefined && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "var(--color-surface-raised)",
            borderRadius: "6px",
            border: "1px solid var(--color-border-base)",
            fontSize: "14px",
            color: "var(--color-text-base)",
          }}
        >
          <strong>{restoreStatus.restoredRowsCount.toLocaleString()}</strong>{" "}
          {restoreStatus.restoredRowsCount === 1
            ? "document was"
            : "documents were"}{" "}
          restored successfully.
        </div>
      )}
    </div>
  );
};
