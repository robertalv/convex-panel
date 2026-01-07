import { useMcpOptional } from "@/contexts/McpContext";
import { cn } from "@/lib/utils";

/**
 * MCP Connection Status Indicator
 * Shows a colored dot indicating MCP server connection status:
 * - Green: Server running and Cursor connected
 * - Red: Server running but no clients connected
 * - Gray: Server not running
 */
export function McpStatusIndicator() {
  const mcp = useMcpOptional();

  // Don't render if MCP context is not available
  if (!mcp) {
    return null;
  }

  const { status } = mcp;

  // Determine status and tooltip text
  // Note: Since MCP server is HTTP-based (stateless), we show green when running
  // The server doesn't maintain persistent connections, so connected_clients may not be accurate
  let statusColor: string;
  let tooltipText: string;

  if (status.running) {
    // Server is running: Green
    statusColor = "bg-[var(--color-success-base)]";
    tooltipText = `MCP Server Running${status.url ? `\n${status.url}` : ""}${status.port ? `\nPort: ${status.port}` : ""}`;
  } else {
    // Not running: Gray
    statusColor = "bg-[var(--color-border-muted)]";
    tooltipText = "MCP Server Not Running";
  }

  return (
    <div
      className={cn(
        "size-1.5 rounded-full shrink-0",
        statusColor,
      )}
      title={tooltipText}
    />
  );
}

