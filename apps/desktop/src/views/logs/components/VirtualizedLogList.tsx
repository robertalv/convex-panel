/**
 * VirtualizedLogList Component
 * High-performance virtualized list for rendering logs using react-window
 * Only renders visible logs + overscan buffer for smooth scrolling
 */

import { memo, forwardRef, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import type { ListChildComponentProps } from "react-window";
import type { InterleavedLog } from "../utils/interleaveLogs";
import type { UdfLog } from "../types";
import { LogRow, ITEM_SIZE } from "./LogRow";
import { DeploymentEventListItem } from "./DeploymentEventListItem";
import { getInterleavedLogKey } from "../utils/interleaveLogs";
import type { ModuleFunction } from "../types";

interface VirtualizedLogListProps {
  logs: InterleavedLog[];
  selectedLogId: string | null;
  onLogClick: (log: UdfLog) => void;
  functions: ModuleFunction[];
  overscanCount?: number;
}

interface RowData {
  logs: InterleavedLog[];
  selectedLogId: string | null;
  onLogClick: (log: UdfLog) => void;
  functions: ModuleFunction[];
}

/**
 * Row renderer for virtualized list
 * Memoized to prevent unnecessary re-renders
 */
const Row = memo(({ index, style, data }: ListChildComponentProps<RowData>) => {
  const { logs, selectedLogId, onLogClick, functions } = data;
  const item = logs[index];

  if (!item) {
    return null;
  }

  const key = getInterleavedLogKey(item);

  // Render deployment event
  if (item.kind === "DeploymentEvent") {
    return (
      <div style={style}>
        <DeploymentEventListItem
          key={key}
          event={item.deploymentEvent}
          setShownLog={() => {
            // For now, deployment events don't open details
            // Can add this functionality later
          }}
          logKey={key}
        />
      </div>
    );
  }

  if (item.kind === "ExecutionLog") {
    const log = item.executionLog;
    return (
      <div style={style}>
        <LogRow
          key={key}
          log={log as any}
          onClick={() => onLogClick(log as unknown as UdfLog)}
          isSelected={selectedLogId === log.id}
          functions={functions}
        />
      </div>
    );
  }

  // Render cleared logs marker (if needed in future)
  return null;
});

Row.displayName = "VirtualizedLogRow";

/**
 * Empty state component
 */
const EmptyState = memo(
  ({ isLoading, message }: { isLoading?: boolean; message?: string }) => {
    return (
      <div
        className="flex items-center justify-center h-full text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        {isLoading ? "Loading logs..." : message || "No logs to display"}
      </div>
    );
  },
);

EmptyState.displayName = "EmptyState";

/**
 * VirtualizedLogList Component
 * Renders a virtualized list of logs for optimal performance
 */
export const VirtualizedLogList = forwardRef<List, VirtualizedLogListProps>(
  ({ logs, selectedLogId, onLogClick, functions, overscanCount = 25 }, ref) => {
    // Memoize item data to prevent unnecessary re-renders
    const itemData: RowData = {
      logs,
      selectedLogId,
      onLogClick,
      functions,
    };

    // Memoize the row key getter
    const getItemKey = useCallback((index: number, data: RowData) => {
      const item = data.logs[index];
      if (!item) return `empty-${index}`;
      return getInterleavedLogKey(item);
    }, []);

    // Show empty state if no logs
    if (logs.length === 0) {
      return <EmptyState />;
    }

    return (
      <AutoSizer>
        {({ height, width }) => (
          <List
            ref={ref}
            height={height}
            width={width}
            itemCount={logs.length}
            itemSize={ITEM_SIZE}
            itemData={itemData}
            itemKey={getItemKey}
            overscanCount={overscanCount}
            className="virtualized-log-list"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    );
  },
);

VirtualizedLogList.displayName = "VirtualizedLogList";

export default VirtualizedLogList;
