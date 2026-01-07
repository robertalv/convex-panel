import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface HealthPageHeaderProps {
  /** Page title */
  title?: string;
  /** Page subtitle or description */
  subtitle?: string;
  /** Whether data is currently refreshing */
  isRefreshing?: boolean;
  /** Callback when refresh button is clicked */
  onRefresh?: () => void;
  /** Additional actions to display in the header */
  actions?: React.ReactNode;
  /** Children rendered in the right section */
  children?: React.ReactNode;
}

/**
 * Header component for the health page with title, refresh, and actions.
 */
export function HealthPageHeader({
  title = "Health Overview",
  subtitle,
  isRefreshing = false,
  onRefresh,
  actions,
  children,
}: HealthPageHeaderProps) {
  const [isRefreshHovered, setIsRefreshHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        paddingBottom: "16px",
        borderBottom: "1px solid var(--color-border-base)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text-base)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                margin: "2px 0 0 0",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          {children}
          {actions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              onMouseEnter={() => setIsRefreshHovered(true)}
              onMouseLeave={() => setIsRefreshHovered(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "6px",
                backgroundColor: isRefreshHovered
                  ? "var(--color-surface-overlay)"
                  : "var(--color-surface-raised)",
                color: isRefreshHovered
                  ? "var(--color-text-base)"
                  : "var(--color-text-muted)",
                border: "1px solid var(--color-border-base)",
                cursor: isRefreshing ? "not-allowed" : "pointer",
                opacity: isRefreshing ? 0.5 : 1,
                transition: "all 0.15s ease",
              }}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: isRefreshing ? "spin 1s linear infinite" : "none",
                }}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
