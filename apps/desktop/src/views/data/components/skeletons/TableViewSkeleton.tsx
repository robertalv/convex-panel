/**
 * TableViewSkeleton Component
 * Skeleton loading state that matches the exact layout of TableView
 * Displays animated placeholders for table header and rows
 */

import { Skeleton } from "@/components/ui/skeleton";

// Constants matching TableView
const DEFAULT_COLUMN_WIDTH = 160;
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 36;
const CHECKBOX_COLUMN_WIDTH = 40;
const CELL_PADDING = "6px 12px";

// Default columns to show in skeleton
const SKELETON_COLUMNS = ["_id", "name", "email", "status", "_creationTime"];

interface TableViewSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Column names to display (defaults to common fields) */
  columns?: string[];
}

export function TableViewSkeleton({
  rows = 10,
  columns = SKELETON_COLUMNS,
}: TableViewSkeletonProps) {
  return (
    <div className="h-full overflow-auto">
      <table
        className="w-full"
        style={{
          minWidth: "max-content",
          fontSize: "12px",
          fontFamily: "ui-monospace, monospace",
          borderCollapse: "separate",
          borderSpacing: 0,
        }}
      >
        {/* Header */}
        <thead style={{ position: "sticky", top: 0, zIndex: 15 }}>
          <tr
            style={{
              borderBottom: "1px solid var(--color-border-base)",
              fontSize: "12px",
              color: "var(--color-text-muted)",
              backgroundColor: "var(--color-surface-raised)",
            }}
          >
            {/* Checkbox column */}
            <th
              style={{
                width: CHECKBOX_COLUMN_WIDTH,
                minWidth: CHECKBOX_COLUMN_WIDTH,
                maxWidth: CHECKBOX_COLUMN_WIDTH,
                padding: 0,
                textAlign: "center",
                position: "sticky",
                left: 0,
                backgroundColor: "var(--color-surface-raised)",
                borderRight: "1px solid var(--color-border-base)",
                borderBottom: "1px solid var(--color-border-base)",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  width: CHECKBOX_COLUMN_WIDTH,
                  height: HEADER_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Skeleton className="w-4 h-4 rounded" />
              </div>
            </th>

            {/* Data columns */}
            {columns.map((column, index) => (
              <th
                key={column}
                style={{
                  width: DEFAULT_COLUMN_WIDTH,
                  minWidth: DEFAULT_COLUMN_WIDTH,
                  maxWidth: DEFAULT_COLUMN_WIDTH,
                  padding: 0,
                  textAlign: "left",
                  position: "relative",
                  borderRight: "1px solid var(--color-border-base)",
                  borderBottom: "1px solid var(--color-border-base)",
                  backgroundColor: "var(--color-surface-raised)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: CELL_PADDING,
                    height: HEADER_HEIGHT,
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {/* Column name skeleton */}
                    <Skeleton
                      className="h-4 rounded"
                      style={{
                        width: `${40 + (index % 3) * 20}px`,
                        animationDelay: `${index * 0.05}s`,
                      }}
                    />
                    {/* Type label skeleton */}
                    <Skeleton
                      className="h-3 rounded"
                      style={{
                        width: "30px",
                        animationDelay: `${index * 0.05 + 0.025}s`,
                      }}
                    />
                  </div>
                </div>
              </th>
            ))}

            {/* Trailing spacer */}
            <th
              style={{
                padding: "8px",
                minWidth: 100,
                borderBottom: "1px solid var(--color-border-base)",
                backgroundColor: "var(--color-surface-raised)",
              }}
            />
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                backgroundColor: "var(--color-surface-base)",
              }}
            >
              {/* Checkbox */}
              <td
                style={{
                  padding: 0,
                  textAlign: "center",
                  width: CHECKBOX_COLUMN_WIDTH,
                  minWidth: CHECKBOX_COLUMN_WIDTH,
                  maxWidth: CHECKBOX_COLUMN_WIDTH,
                  position: "sticky",
                  left: 0,
                  zIndex: 11,
                  backgroundColor: "var(--color-surface-base)",
                  borderRight: "1px solid var(--color-border-base)",
                  borderBottom: "1px solid var(--color-border-base)",
                }}
              >
                <div
                  style={{
                    width: CHECKBOX_COLUMN_WIDTH,
                    height: ROW_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Skeleton
                    className="w-4 h-4 rounded"
                    style={{ animationDelay: `${rowIndex * 0.03}s` }}
                  />
                </div>
              </td>

              {/* Data cells */}
              {columns.map((column, colIndex) => {
                // Vary skeleton widths based on column type
                const isIdColumn = column === "_id";
                const isDateColumn = column === "_creationTime";
                const baseWidth = isIdColumn
                  ? 80
                  : isDateColumn
                    ? 100
                    : 40 + ((rowIndex + colIndex) % 4) * 20;

                return (
                  <td
                    key={column}
                    style={{
                      padding: 0,
                      borderRight: "1px solid var(--color-border-base)",
                      borderBottom: "1px solid var(--color-border-base)",
                      width: DEFAULT_COLUMN_WIDTH,
                      minWidth: DEFAULT_COLUMN_WIDTH,
                      maxWidth: DEFAULT_COLUMN_WIDTH,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: CELL_PADDING,
                        height: ROW_HEIGHT,
                      }}
                    >
                      <Skeleton
                        className="h-4 rounded"
                        style={{
                          width: `${baseWidth}px`,
                          maxWidth: "90%",
                          animationDelay: `${(rowIndex * columns.length + colIndex) * 0.02}s`,
                        }}
                      />
                    </div>
                  </td>
                );
              })}

              {/* Trailing spacer */}
              <td
                style={{
                  padding: "8px",
                  minWidth: 100,
                  borderRight: "1px solid var(--color-border-base)",
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableViewSkeleton;
