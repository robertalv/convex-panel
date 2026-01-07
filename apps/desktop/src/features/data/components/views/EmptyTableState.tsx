import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface EmptyTableStateProps {
  columns: string[];
  onAddDocument?: () => void;
}

export const EmptyTableState = ({
  columns,
  onAddDocument,
}: EmptyTableStateProps) => {
  const placeholderColumns = columns.length ? columns : ["_id", "_creationTime"];
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [fakeRows, setFakeRows] = useState(18);

  useEffect(() => {
    if (!tableRef.current) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height ?? 0;
      const rowHeight = 32;
      setFakeRows(Math.max(10, Math.ceil(height / rowHeight) + 5));
    });
    observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        ref={tableRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: "12px",
            color: "var(--color-panel-text-muted)",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-panel-bg) 85%, transparent)",
              }}
            >
              {placeholderColumns.map((column) => (
                <th
                  key={column}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRight:
                      "1px solid color-mix(in srgb, var(--color-panel-border) 60%, transparent)",
                    borderBottom:
                      "1px solid color-mix(in srgb, var(--color-panel-border) 60%, transparent)",
                    textTransform: "lowercase",
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: fakeRows }).map((_, rowIdx) => (
              <tr key={`empty-row-${rowIdx}`}>
                {placeholderColumns.map((column) => (
                  <td
                    key={`${rowIdx}-${column}`}
                    style={{
                      padding: "6px 12px",
                      borderRight:
                        "1px solid color-mix(in srgb, var(--color-panel-border) 30%, transparent)",
                      borderBottom:
                        "1px solid color-mix(in srgb, var(--color-panel-border) 30%, transparent)",
                    }}
                  >
                    <div
                      style={{
                        height: "12px",
                        borderRadius: "999px",
                        backgroundColor: "var(--color-panel-hover)",
                        width: `${60 + Math.random() * 30}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-panel-bg) 92%, transparent)",
            border: "1px solid var(--color-panel-border)",
            borderRadius: "18px",
            padding: "32px 40px",
            textAlign: "center",
            color: "var(--color-panel-text)",
            maxWidth: 420,
            width: "90%",
            // boxShadow: "0 25px 55px var(--color-panel-shadow)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              margin: "0 auto 16px",
              borderRadius: "12px",
              backgroundColor: "var(--color-panel-bg-tertiary)",
              border: "1px solid var(--color-panel-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            ⌗
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 600 }}>
            This table is empty.
          </h3>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "13px",
              color: "var(--color-panel-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            Create a document or run a mutation to start storing data.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {onAddDocument && (
              <div style={{ pointerEvents: "auto" }}>
                <Button
                  variant="outline"
                  onClick={onAddDocument}
                  style={{
                    height: "36px",
                    fontSize: "13px",
                  }}
                >
                  + Add Documents
                </Button>
              </div>
            )}
            <a
              href="https://docs.convex.dev/quickstarts"
              target="_blank"
              rel="noreferrer"
              style={{
                pointerEvents: "auto",
                fontSize: "12px",
                color: "var(--color-panel-success)",
                textDecoration: "none",
              }}
            >
              Follow a quickstart guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

