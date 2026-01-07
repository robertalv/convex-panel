import { X } from "lucide-react";
import { useSheetSafe } from "@/contexts/SheetContext";

interface DataSheetProps {
  width?: string;
}

/**
 * A side sheet component that displays content from the sheet context.
 * Used for Schema, Indexes, Metrics views in the desktop data tab.
 * Uses flex layout to push the main content when open.
 */
export function DataSheet({ width = "500px" }: DataSheetProps) {
  const { state, closeSheet } = useSheetSafe();
  const { isOpen, sheetContent } = state;

  if (!isOpen || !sheetContent) {
    return null;
  }

  return (
    <div
      style={{
        width: width,
        minWidth: width,
        maxWidth: width,
        height: "100%",
        backgroundColor: "var(--color-panel-bg-secondary)",
        borderLeft: "1px solid var(--color-panel-border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        animation: "slideInRight 0.2s ease-out",
      }}
    >
      {/* Header */}
      {sheetContent.title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-panel-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sheetContent.title}
          </h3>
          <button
            type="button"
            onClick={closeSheet}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              border: "none",
              backgroundColor: "transparent",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--color-panel-text-secondary)",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "var(--color-panel-bg-tertiary)";
              e.currentTarget.style.color = "var(--color-panel-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-panel-text-secondary)";
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {sheetContent.content}
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
