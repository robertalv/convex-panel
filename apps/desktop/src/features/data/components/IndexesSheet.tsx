/**
 * IndexesSheet Component
 * Displays table indexes information in the side sheet
 */

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Database,
  Search,
  Sparkles,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { IndexDefinition } from "../types";

interface IndexesSheetProps {
  tableName: string;
  adminClient: any;
  componentId?: string | null;
  onClose: () => void;
}

function getIndexIcon(type: string): typeof Database {
  switch (type) {
    case "search":
      return Search;
    case "vector":
      return Sparkles;
    default:
      return Database;
  }
}

function getIndexTypeLabel(type: string): string {
  switch (type) {
    case "search":
      return "Search Index";
    case "vector":
      return "Vector Index";
    default:
      return "Database Index";
  }
}

function getIndexTypeColor(type: string): string {
  switch (type) {
    case "search":
      return "var(--color-warning-base)";
    case "vector":
      return "var(--color-info-base)";
    default:
      return "var(--color-success-base)";
  }
}

export function IndexesSheet({
  tableName,
  adminClient,
  componentId,
  onClose,
}: IndexesSheetProps) {
  const [indexes, setIndexes] = useState<IndexDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedComponentId = componentId === "app" ? null : componentId;

  // Fetch indexes for the table
  const fetchIndexes = useCallback(async () => {
    if (!adminClient || !tableName) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch index metadata using the same endpoint as Convex dashboard
      // Note: This endpoint may not exist in all Convex versions, so we catch errors gracefully
      const result = await adminClient
        .query("_system/frontend/indexes:default" as any, {
          tableName,
          tableNamespace: normalizedComponentId,
        })
        .catch(() => []);

      // Filter to only indexes for this table
      const tableIndexes: IndexDefinition[] = [];

      if (Array.isArray(result)) {
        // Result is an array of indexes for the table
        for (const idx of result) {
          tableIndexes.push({
            name: idx.name || idx.indexDescriptor || "Unknown",
            fields: idx.fields || [],
            type: idx.type || "db",
            staged: idx.staged || false,
          });
        }
      } else if (result && typeof result === "object") {
        // Handle the response format - typically an object with table names as keys
        const indexesForTable = result[tableName];

        if (Array.isArray(indexesForTable)) {
          for (const idx of indexesForTable) {
            tableIndexes.push({
              name: idx.name || idx.indexDescriptor || "Unknown",
              fields: idx.fields || [],
              type: idx.type || "db",
              staged: idx.staged || false,
            });
          }
        }
      }

      // Always include the built-in by_creation_time index
      const hasCreationTimeIndex = tableIndexes.some(
        (idx) => idx.name === "by_creation_time",
      );

      if (!hasCreationTimeIndex) {
        tableIndexes.unshift({
          name: "by_creation_time",
          fields: ["_creationTime"],
          type: "db",
          staged: false,
        });
      }

      // Always include the by_id index
      const hasIdIndex = tableIndexes.some((idx) => idx.name === "by_id");

      if (!hasIdIndex) {
        tableIndexes.unshift({
          name: "by_id",
          fields: ["_id"],
          type: "db",
          staged: false,
        });
      }

      setIndexes(tableIndexes);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch indexes";
      setError(message);

      // Still show built-in indexes even on error
      setIndexes([
        { name: "by_id", fields: ["_id"], type: "db", staged: false },
        {
          name: "by_creation_time",
          fields: ["_creationTime"],
          type: "db",
          staged: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [adminClient, tableName, normalizedComponentId]);

  useEffect(() => {
    fetchIndexes();
  }, [fetchIndexes]);

  // Group indexes by type
  const dbIndexes = indexes.filter((idx) => idx.type === "db");
  const searchIndexes = indexes.filter((idx) => idx.type === "search");
  const vectorIndexes = indexes.filter((idx) => idx.type === "vector");

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "var(--color-surface-base)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
        }}
      >
        <div>
          <h3
            className="text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          >
            Indexes
          </h3>
          <p
            className="text-xs mt-0.5 font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            {tableName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[var(--color-surface-base)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-12"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Loading indexes...</span>
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center justify-center py-12 px-4"
            style={{ color: "var(--color-error-base)" }}
          >
            <AlertCircle size={20} className="mb-2" />
            <span className="text-xs text-center">{error}</span>
          </div>
        ) : (
          <>
            {/* Database Indexes */}
            {dbIndexes.length > 0 && (
              <>
                <div
                  className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider"
                  style={{
                    color: "var(--color-text-subtle)",
                    backgroundColor: "var(--color-surface-raised)",
                    borderBottom: "1px solid var(--color-border-base)",
                  }}
                >
                  Database Indexes ({dbIndexes.length})
                </div>
                {dbIndexes.map((index) => (
                  <IndexRow key={index.name} index={index} />
                ))}
              </>
            )}

            {/* Search Indexes */}
            {searchIndexes.length > 0 && (
              <>
                <div
                  className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider mt-2"
                  style={{
                    color: "var(--color-text-subtle)",
                    backgroundColor: "var(--color-surface-raised)",
                    borderBottom: "1px solid var(--color-border-base)",
                  }}
                >
                  Search Indexes ({searchIndexes.length})
                </div>
                {searchIndexes.map((index) => (
                  <IndexRow key={index.name} index={index} />
                ))}
              </>
            )}

            {/* Vector Indexes */}
            {vectorIndexes.length > 0 && (
              <>
                <div
                  className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider mt-2"
                  style={{
                    color: "var(--color-text-subtle)",
                    backgroundColor: "var(--color-surface-raised)",
                    borderBottom: "1px solid var(--color-border-base)",
                  }}
                >
                  Vector Indexes ({vectorIndexes.length})
                </div>
                {vectorIndexes.map((index) => (
                  <IndexRow key={index.name} index={index} />
                ))}
              </>
            )}

            {/* No indexes message */}
            {indexes.length === 0 && (
              <div
                className="px-4 py-8 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                <p>No indexes defined for this table.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 text-xs flex-shrink-0"
        style={{
          borderTop: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-raised)",
          color: "var(--color-text-muted)",
        }}
      >
        <div className="flex items-center justify-between">
          <span>Total indexes: {indexes.length}</span>
          {indexes.some((idx) => idx.staged) && (
            <span
              className="flex items-center gap-1"
              style={{ color: "var(--color-warning-base)" }}
            >
              <Clock size={12} />
              <span>Some indexes are building</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface IndexRowProps {
  index: IndexDefinition;
}

function IndexRow({ index }: IndexRowProps) {
  const Icon = getIndexIcon(index.type);
  const typeColor = getIndexTypeColor(index.type);
  const typeLabel = getIndexTypeLabel(index.type);

  return (
    <div
      className="px-3 py-3 transition-colors hover:bg-[var(--color-surface-raised)]"
      style={{ borderBottom: "1px solid var(--color-border-weak)" }}
    >
      <div className="flex items-center gap-2">
        {/* Icon */}
        <Icon size={14} style={{ color: typeColor, flexShrink: 0 }} />

        {/* Name */}
        <span
          className="font-mono text-xs flex-1 truncate"
          style={{ color: "var(--color-text-base)" }}
        >
          {index.name}
        </span>

        {/* Staged indicator */}
        {index.staged && (
          <span
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--color-warning-base-alpha)",
              color: "var(--color-warning-base)",
            }}
          >
            <Clock size={10} />
            Building
          </span>
        )}

        {/* Type badge */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${typeColor}20`,
            color: typeColor,
          }}
        >
          {typeLabel}
        </span>
      </div>

      {/* Fields */}
      {index.fields.length > 0 && (
        <div className="mt-1.5 ml-5 flex flex-wrap gap-1">
          {index.fields.map((field, i) => (
            <span
              key={`${index.name}-${field}-${i}`}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-surface-raised)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border-base)",
              }}
            >
              {field}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default IndexesSheet;
