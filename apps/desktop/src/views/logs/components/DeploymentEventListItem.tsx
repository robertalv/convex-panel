/**
 * DeploymentEventListItem Component
 * Displays deployment event entries in the logs list
 * Based on dashboard-common DeploymentEventListItem
 */

import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import { ITEM_SIZE } from "./LogRow";

export interface DeploymentAuditLogEvent {
  _id: string;
  _creationTime: number;
  member_id: bigint | null;
  memberName: string;
  action: string;
  metadata?: Record<string, any>;
}

/**
 * Format deployment action to human-readable text
 * Based on ActionText from DeploymentEventContent.tsx
 */
function formatActionText(action: string): string {
  switch (action) {
    case "push_config":
    case "push_config_with_components":
      return "deployed functions";
    case "create_environment_variable":
      return "created environment variable";
    case "update_environment_variable":
      return "updated environment variable";
    case "delete_environment_variable":
      return "deleted environment variable";
    case "replace_environment_variable":
      return "renamed environment variable";
    case "update_canonical_url":
      return "updated canonical URL";
    case "delete_canonical_url":
      return "deleted canonical URL";
    case "build_indexes":
      return "updated indexes";
    case "change_deployment_state":
      return "changed deployment state";
    case "clear_tables":
      return "cleared tables";
    case "snapshot_import":
      return "imported snapshot";
    default:
      return action.replace(/_/g, " ");
  }
}

export function DeploymentEventListItem({
  event,
  focused = false,
  hitBoundary,
  setShownLog,
  logKey,
}: {
  event: DeploymentAuditLogEvent;
  focused?: boolean;
  hitBoundary?: "top" | "bottom" | null;
  setShownLog: () => void;
  logKey?: string;
}) {
  const actionText = formatActionText(event.action);

  // Format timestamp to match LogRow format (Jan 11, 17:35:06)
  const date = new Date(event._creationTime);
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const formattedTimestamp = `${month} ${day}, ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  // Only show boundary animation on the focused item
  const showBoundary = focused && hitBoundary;

  return (
    <div
      className={cn(
        showBoundary === "top" && "animate-[bounceTop_0.375s_ease-out]",
        showBoundary === "bottom" && "animate-[bounceBottom_0.375s_ease-out]",
      )}
    >
      <button
        type="button"
        data-log-key={logKey}
        className={cn(
          "animate-fadeInFromLoading",
          "group flex items-center gap-3 w-full text-xs items-center",
          "hover:bg-[var(--color-surface-raised)]",
          "focus:outline-none focus:border-y focus:border-[var(--color-border-selected)]",
          focused && "bg-[var(--color-surface-raised)]",
          "select-text",
        )}
        style={{
          height: ITEM_SIZE,
        }}
        onClick={setShownLog}
        onFocus={(e) => {
          // Only set shown log if focus is on the button itself,
          // not on child elements (like links)
          if (e.target === e.currentTarget) {
            setShownLog();
          }
        }}
        tabIndex={0}
      >
        <div className="min-w-[9.25rem] pl-3 text-left font-mono whitespace-nowrap text-[var(--color-text-base)]">
          {formattedTimestamp}
          <span className="text-[var(--color-text-muted)]">
            .{milliseconds}
          </span>
        </div>

        <hr className="min-w-[10.375rem] bg-[var(--color-border-base)]" />

        <div className="flex h-6 items-center gap-2 truncate">
          <Settings
            className="shrink-0"
            size={14}
            style={{ color: "var(--color-text-muted)" }}
          />
          <span
            className="truncate"
            style={{ color: "var(--color-text-base)" }}
          >
            {event.memberName} {actionText}
          </span>
        </div>
      </button>
    </div>
  );
}

export default DeploymentEventListItem;
