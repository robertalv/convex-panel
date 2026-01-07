import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import type { TableDefinition } from "../../../types";
import { ComponentSelector } from "../../../components/component-selector";
import { validateConvexIdentifier } from "../../../utils/validation";
import { callConvexMutation } from "../../../utils/api/helpers";

export interface TableSidebarProps {
  tables: TableDefinition;
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  isLoading: boolean;
  selectedComponent?: string | null;
  onComponentSelect?: (component: string | null) => void;
  availableComponents?: string[];
  convexUrl?: string;
  accessToken?: string;
  adminClient?: any;
  componentId?: string | null;
  onTableCreated?: () => void;
}

export const TableSidebar: React.FC<TableSidebarProps> = ({
  tables,
  selectedTable,
  setSelectedTable,
  isLoading,
  selectedComponent,
  onComponentSelect,
  availableComponents,
  convexUrl,
  accessToken,
  adminClient,
  componentId,
  onTableCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newTableName, setNewTableName] = useState<string | undefined>(
    undefined,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Filter and sort tables based on search query
  const filteredTables = Object.keys(tables)
    .filter((tableName) =>
      tableName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    // Sort alphabetically (case-insensitive)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // Validate table name
  const validationError = validateConvexIdentifier(
    newTableName || "",
    "Table name",
  );

  // Check if table already exists
  const tableExists = newTableName
    ? Object.keys(tables).includes(newTableName)
    : false;

  // Handle create table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTableName || validationError || tableExists) {
      return;
    }

    if (!convexUrl || !accessToken) {
      setCreateError("Missing deployment URL or access token");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const normalizedComponentId =
        componentId === "app" || componentId === null ? null : componentId;

      // Try using adminClient mutation first (preferred method)
      if (adminClient) {
        try {
          await adminClient.mutation(
            "_system/frontend/createTable:default" as any,
            {
              table: newTableName,
              componentId: normalizedComponentId,
            },
          );
        } catch (adminError: any) {
          // If adminClient fails, fall back to HTTP API
          console.warn(
            "Admin client mutation failed, trying HTTP API:",
            adminError,
          );
          await callConvexMutation(
            convexUrl,
            accessToken,
            "_system/frontend/createTable:default",
            {
              table: newTableName,
              componentId: normalizedComponentId,
            },
          );
        }
      } else {
        // Use HTTP API directly
        await callConvexMutation(
          convexUrl,
          accessToken,
          "_system/frontend/createTable:default",
          {
            table: newTableName,
            componentId: normalizedComponentId,
          },
        );
      }

      // Success - refresh tables and select the new table
      setNewTableName(undefined);
      if (onTableCreated) {
        onTableCreated();
      }
      // Select the newly created table
      setSelectedTable(newTableName);
    } catch (error: any) {
      let errorMessage = "Failed to create table";

      if (error?.data) {
        errorMessage = error.data;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setCreateError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        width: "240px",
        borderRight: "1px solid var(--color-panel-border)",
        backgroundColor: "var(--color-panel-bg)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Component Selector */}
      {availableComponents && availableComponents.length > 0 && (
        <div
          style={{
            padding: "8px",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
          }}
        >
          <ComponentSelector
            selectedComponent={selectedComponent || null}
            onSelect={onComponentSelect || (() => {})}
            components={availableComponents}
          />
        </div>
      )}

      {/* Search Input */}
      <div
        style={{
          padding: "8px",
          borderBottom: "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <div className="cp-search-wrapper">
          <Search size={14} className="cp-search-icon" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cp-search-input"
          />
        </div>
      </div>

      {/* Table List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
        }}
      >
        <div
          style={{
            gap: "4px",
            display: "flex",
            flexDirection: "column",
            color: "var(--color-panel-text-secondary)",
            fontSize: "12px",
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: "12px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "12px",
              }}
            >
              Loading tables...
            </div>
          ) : filteredTables.length === 0 ? (
            <div
              style={{
                padding: "12px",
                color: "var(--color-panel-text-secondary)",
                fontSize: "12px",
              }}
            >
              {searchQuery ? "No tables found" : "No tables available"}
            </div>
          ) : (
            filteredTables.map((tableName) => (
              <div
                key={tableName}
                onClick={() => setSelectedTable(tableName)}
                style={{
                  padding: "6px 12px",
                  margin: "0 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: "monospace",
                  backgroundColor:
                    selectedTable === tableName
                      ? "var(--color-panel-bg-tertiary)"
                      : "transparent",
                  color:
                    selectedTable === tableName
                      ? "var(--color-panel-text)"
                      : "var(--color-panel-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (selectedTable !== tableName) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    selectedTable === tableName
                      ? "var(--color-panel-bg-tertiary)"
                      : "transparent";
                }}
              >
                <span style={{ fontSize: "12px" }}>{tableName}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Table Section */}
      <div
        style={{
          padding: "13px",
          borderTop: "1px solid var(--color-panel-border)",
        }}
      >
        {newTableName !== undefined ? (
          <form
            onSubmit={handleCreateTable}
            style={{ display: "flex", flexDirection: "column", gap: "6px" }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Untitled table"
              value={newTableName}
              onChange={(e) => {
                setNewTableName(e.target.value);
                setCreateError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setNewTableName(undefined);
                  setCreateError(null);
                }
              }}
              style={{
                width: "100%",
                height: "32px",
                padding: "0 12px",
                fontSize: "12px",
                fontFamily: "monospace",
                backgroundColor: "var(--color-panel-bg-secondary)",
                border:
                  createError || tableExists
                    ? "1px solid var(--color-panel-error)"
                    : "1px solid var(--color-panel-border)",
                borderRadius: "8px",
                color: "var(--color-panel-text)",
                outline: "none",
                boxSizing: "border-box",
                transition:
                  "border-color 0.2s ease, background-color 0.2s ease",
              }}
              onFocus={(e) => {
                if (!createError && !tableExists) {
                  e.currentTarget.style.borderColor =
                    "var(--color-panel-accent)";
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-bg-tertiary)";
                }
              }}
              onBlur={(e) => {
                if (!createError && !tableExists) {
                  e.currentTarget.style.borderColor =
                    "var(--color-panel-border)";
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-bg-secondary)";
                }
              }}
            />
            {(validationError || tableExists || createError) && (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-panel-error)",
                  padding: "0 2px",
                  lineHeight: "14px",
                  minHeight: "14px",
                }}
              >
                {tableExists
                  ? `Table "${newTableName}" already exists.`
                  : createError
                    ? createError
                    : validationError}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
                marginTop: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setNewTableName(undefined);
                  setCreateError(null);
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  backgroundColor: "transparent",
                  border: "1px solid var(--color-panel-border)",
                  borderRadius: "6px",
                  color: "var(--color-panel-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-panel-text)";
                  e.currentTarget.style.borderColor =
                    "var(--color-panel-border-hover)";
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color =
                    "var(--color-panel-text-secondary)";
                  e.currentTarget.style.borderColor =
                    "var(--color-panel-border)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !newTableName ||
                  !!validationError ||
                  tableExists ||
                  isCreating
                }
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  backgroundColor:
                    !newTableName ||
                    !!validationError ||
                    tableExists ||
                    isCreating
                      ? "var(--color-panel-bg-tertiary)"
                      : "var(--color-panel-primary)",
                  border: "none",
                  borderRadius: "6px",
                  color:
                    !newTableName ||
                    !!validationError ||
                    tableExists ||
                    isCreating
                      ? "var(--color-panel-text-secondary)"
                      : "var(--color-panel-text-on-primary)",
                  cursor:
                    !newTableName ||
                    !!validationError ||
                    tableExists ||
                    isCreating
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (
                    !(
                      !newTableName ||
                      !!validationError ||
                      tableExists ||
                      isCreating
                    )
                  ) {
                    e.currentTarget.style.opacity = "0.9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    !(
                      !newTableName ||
                      !!validationError ||
                      tableExists ||
                      isCreating
                    )
                  ) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setNewTableName("")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--color-panel-text-secondary)",
              fontSize: "12px",
              fontWeight: 500,
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-panel-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-panel-text-secondary)";
            }}
          >
            <Plus size={14} />
            Create Table
          </button>
        )}
      </div>
    </div>
  );
};
