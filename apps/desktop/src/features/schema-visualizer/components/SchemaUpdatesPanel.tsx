/**
 * SchemaUpdatesPanel Component
 *
 * Displays real-time schema update notifications from GitHub webhooks.
 * Shows a list of recent schema.ts file changes with the ability to
 * view diffs and save snapshots.
 */

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  GitCommit,
  Check,
  ChevronRight,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { SchemaUpdate } from "../hooks/useSchemaUpdates";
import type { SSEConnectionState } from "../../../services/github/sse";

interface SchemaUpdatesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close the panel */
  onClose: () => void;
  /** List of schema updates */
  updates: SchemaUpdate[];
  /** Number of unseen updates */
  unseenCount: number;
  /** Mark all updates as seen */
  onMarkAllSeen: () => void;
  /** Mark a specific update as seen */
  onMarkSeen: (updateId: string) => void;
  /** Clear all updates */
  onClearUpdates: () => void;
  /** Save an update as a snapshot for diffing */
  onSaveSnapshot?: (update: SchemaUpdate) => Promise<void>;
  /** View diff with a specific update */
  onViewDiff?: (update: SchemaUpdate) => void;
  /** SSE connection state */
  connectionState: SSEConnectionState;
  /** Error message */
  error: string | null;
  /** Reconnect to SSE */
  onReconnect: () => void;
  /** Disconnect from SSE */
  onDisconnect: () => void;
  /** Position anchor element ref */
  anchorRef?: React.RefObject<HTMLElement>;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Connection status indicator
 */
function ConnectionStatus({
  state,
  error,
  onReconnect,
  onDisconnect,
}: {
  state: SSEConnectionState;
  error: string | null;
  onReconnect: () => void;
  onDisconnect: () => void;
}) {
  const getStatusColor = () => {
    switch (state) {
      case "connected":
        return "var(--color-success-base)";
      case "connecting":
        return "var(--color-warning-base)";
      case "disconnected":
      case "error":
        return "var(--color-error-base)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getStatusLabel = () => {
    switch (state) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      case "error":
        return error || "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        backgroundColor: "var(--color-surface-raised)",
        borderRadius: "8px",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {state === "connected" ? (
          <Wifi size={14} style={{ color: getStatusColor() }} />
        ) : state === "connecting" ? (
          <RefreshCw
            size={14}
            style={{ color: getStatusColor() }}
            className="animate-spin"
          />
        ) : (
          <WifiOff size={14} style={{ color: getStatusColor() }} />
        )}
        <span style={{ color: getStatusColor() }}>{getStatusLabel()}</span>
      </div>

      {state === "connected" ? (
        <button
          onClick={onDisconnect}
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            backgroundColor: "transparent",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Disconnect
        </button>
      ) : state !== "connecting" ? (
        <button
          onClick={onReconnect}
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            backgroundColor: "var(--color-brand-base)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Connect
        </button>
      ) : null}
    </div>
  );
}

/**
 * Individual update item
 */
function UpdateItem({
  update,
  onMarkSeen,
  onSaveSnapshot,
  onViewDiff,
}: {
  update: SchemaUpdate;
  onMarkSeen: () => void;
  onSaveSnapshot?: () => Promise<void>;
  onViewDiff?: () => void;
}) {
  return (
    <div
      style={{
        padding: "12px",
        backgroundColor: update.seen
          ? "transparent"
          : "color-mix(in srgb, var(--color-brand-base) 5%, transparent)",
        borderBottom: "1px solid var(--color-border-base)",
        cursor: "pointer",
        transition: "background-color 0.15s",
      }}
      onClick={() => {
        if (!update.seen) onMarkSeen();
        onViewDiff?.();
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-surface-raised)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = update.seen
          ? "transparent"
          : "color-mix(in srgb, var(--color-brand-base) 5%, transparent)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        {/* Unseen indicator */}
        {!update.seen && (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--color-brand-base)",
              marginTop: "4px",
              flexShrink: 0,
            }}
          />
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "4px",
            }}
          >
            <GitCommit size={12} style={{ color: "var(--color-text-muted)" }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-text-base)",
                fontFamily: "monospace",
              }}
            >
              {update.commitId.substring(0, 7)}
            </span>
            <span
              style={{ fontSize: "11px", color: "var(--color-text-muted)" }}
            >
              {formatTimestamp(update.timestamp)}
            </span>
          </div>

          {/* Commit message */}
          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-base)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {update.commitMessage.split("\n")[0]}
          </p>

          {/* Meta info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "6px",
              fontSize: "11px",
              color: "var(--color-text-subtle)",
            }}
          >
            <span>{update.author}</span>
            <span>•</span>
            <span>{update.branch}</span>
            <span>•</span>
            <span style={{ fontFamily: "monospace" }}>{update.file}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {onSaveSnapshot && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveSnapshot();
              }}
              style={{
                padding: "4px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                color: "var(--color-text-muted)",
              }}
              title="Save as snapshot"
            >
              <Check size={14} />
            </button>
          )}
          <ChevronRight
            size={14}
            style={{ color: "var(--color-text-subtle)" }}
          />
        </div>
      </div>
    </div>
  );
}

export function SchemaUpdatesPanel({
  isOpen,
  onClose,
  updates,
  unseenCount,
  onMarkAllSeen,
  onMarkSeen,
  onClearUpdates,
  onSaveSnapshot,
  onViewDiff,
  connectionState,
  error,
  onReconnect,
  onDisconnect,
  anchorRef,
}: SchemaUpdatesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const panelContent = (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: "50px",
        right: "16px",
        width: "380px",
        maxHeight: "calc(100vh - 80px)",
        backgroundColor: "var(--color-surface-base)",
        border: "1px solid var(--color-border-base)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-xl)",
        zIndex: 100000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "schemaUpdatesPanelFadeIn 0.15s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border-base)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bell size={16} style={{ color: "var(--color-text-muted)" }} />
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-text-base)",
            }}
          >
            Schema Updates
          </span>
          {unseenCount > 0 && (
            <span
              style={{
                padding: "2px 6px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--color-brand-base)",
                color: "white",
                borderRadius: "10px",
              }}
            >
              {unseenCount}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {unseenCount > 0 && (
            <button
              onClick={onMarkAllSeen}
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                backgroundColor: "transparent",
                color: "var(--color-text-muted)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "4px",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              color: "var(--color-text-muted)",
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Connection status */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--color-border-base)",
        }}
      >
        <ConnectionStatus
          state={connectionState}
          error={error}
          onReconnect={onReconnect}
          onDisconnect={onDisconnect}
        />
      </div>

      {/* Updates list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {updates.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            <Bell size={32} style={{ opacity: 0.5, marginBottom: "12px" }} />
            <p style={{ fontSize: "13px", margin: 0 }}>No schema updates yet</p>
            <p style={{ fontSize: "12px", margin: "8px 0 0 0", opacity: 0.7 }}>
              Changes to schema.ts will appear here in real-time
            </p>
          </div>
        ) : (
          updates.map((update) => (
            <UpdateItem
              key={update.id}
              update={update}
              onMarkSeen={() => onMarkSeen(update.id)}
              onSaveSnapshot={
                onSaveSnapshot ? () => onSaveSnapshot(update) : undefined
              }
              onViewDiff={onViewDiff ? () => onViewDiff(update) : undefined}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {updates.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border-base)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11px", color: "var(--color-text-subtle)" }}>
            {updates.length} update{updates.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClearUpdates}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              backgroundColor: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border-base)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`
        @keyframes schemaUpdatesPanelFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );

  return createPortal(panelContent, document.body);
}

export default SchemaUpdatesPanel;
