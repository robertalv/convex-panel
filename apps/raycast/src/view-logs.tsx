/**
 * View Logs Command
 *
 * Stream and view function execution logs from your Convex deployment.
 * Shows real-time logs with details panel and filtering.
 */

import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useState } from "react";
import { useConvexAuth } from "./hooks/useConvexAuth";
import {
  useLogs,
  useTeams,
  useProjects,
  useDeployments,
  useFunctions,
  type LogEntry,
} from "./hooks/useConvexData";
import {
  formatBytes,
  formatExecutionTime,
  formatTimestamp,
  formatRelativeTime,
} from "./lib/api";

export default function ViewLogsCommand() {
  const {
    session,
    isLoading: authLoading,
    isAuthenticated,
    login,
    selectedContext,
  } = useConvexAuth();
  const [functionFilter, setFunctionFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");

  const accessToken = session?.accessToken ?? null;
  const deploymentName = selectedContext.deploymentName;

  // Fetch context data
  const { data: teams } = useTeams(accessToken);
  const { data: projects } = useProjects(accessToken, selectedContext.teamId);
  const { data: deployments } = useDeployments(
    accessToken,
    selectedContext.projectId,
  );
  const { data: functions } = useFunctions(accessToken, deploymentName);

  const selectedTeam = teams?.find((t) => t.id === selectedContext.teamId);
  const selectedProject = projects?.find(
    (p) => p.id === selectedContext.projectId,
  );
  const selectedDeployment = deployments?.find(
    (d) => d.name === deploymentName,
  );

  // Fetch logs with polling
  const {
    logs,
    isLoading: logsLoading,
    isStreaming,
    toggleStreaming,
    refresh,
    clearLogs,
  } = useLogs(accessToken, deploymentName, {
    functionFilter,
    autoRefresh: true,
  });

  // Handle not authenticated
  if (authLoading) {
    return <List isLoading={true} searchBarPlaceholder="Loading..." />;
  }

  if (!isAuthenticated) {
    return (
      <List>
        <List.EmptyView
          title="Sign in to Convex"
          description="Connect your Convex account to view logs"
          icon={Icon.Key}
          actions={
            <ActionPanel>
              <Action
                title="Sign in with Convex"
                icon={Icon.Key}
                onAction={login}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // No deployment selected
  if (!deploymentName) {
    return (
      <List>
        <List.EmptyView
          title="No Deployment Selected"
          description="Use 'Switch Convex Project' to select a deployment first"
          icon={Icon.Cloud}
        />
      </List>
    );
  }

  // Build function list for dropdown
  const allFunctions = (functions ?? []).flatMap((module) =>
    module.functions.map((fn) => fn.identifier),
  );

  // Filter logs by search text
  const filteredLogs = logs.filter((log) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      log.functionPath.toLowerCase().includes(search) ||
      log.requestId.toLowerCase().includes(search) ||
      log.status.toLowerCase().includes(search) ||
      log.functionType.toLowerCase().includes(search)
    );
  });

  const contextSubtitle =
    selectedProject && selectedDeployment
      ? `${selectedProject.name} / ${selectedDeployment.deploymentType}`
      : deploymentName;

  return (
    <List
      isLoading={logsLoading}
      isShowingDetail={filteredLogs.length > 0}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search logs..."
      navigationTitle="View Logs"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by function"
          value={functionFilter ?? "all"}
          onChange={(value) =>
            setFunctionFilter(value === "all" ? undefined : value)
          }
        >
          <List.Dropdown.Item title="All Functions" value="all" />
          <List.Dropdown.Section title="Functions">
            {allFunctions.map((fn) => (
              <List.Dropdown.Item key={fn} title={fn} value={fn} />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      <List.Section
        title={contextSubtitle}
        subtitle={`${filteredLogs.length} logs${isStreaming ? " (streaming)" : ""}`}
      >
        {filteredLogs.map((log) => (
          <List.Item
            key={log.id}
            title={getFunctionName(log.functionPath)}
            icon={getLogIcon(log)}
            keywords={[log.functionType, log.status, log.requestId]}
            accessories={getLogAccessories(log)}
            detail={<LogDetailPanel log={log} />}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action.CopyToClipboard
                    title="Copy Request Id"
                    content={log.requestId}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.CopyToClipboard
                    title="Copy Full Log JSON"
                    content={JSON.stringify(log.raw, null, 2)}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                  {log.errorMessage && (
                    <Action.CopyToClipboard
                      title="Copy Error Message"
                      content={log.errorMessage}
                      shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
                    />
                  )}
                </ActionPanel.Section>

                <ActionPanel.Section>
                  <Action
                    title={isStreaming ? "Pause Streaming" : "Resume Streaming"}
                    icon={isStreaming ? Icon.Pause : Icon.Play}
                    onAction={toggleStreaming}
                    shortcut={{ modifiers: ["cmd"], key: "p" }}
                  />
                  <Action
                    title="Refresh Logs"
                    icon={Icon.ArrowClockwise}
                    onAction={async () => {
                      await refresh();
                      await showToast({
                        style: Toast.Style.Success,
                        title: "Logs refreshed",
                      });
                    }}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                  <Action
                    title="Clear Logs"
                    icon={Icon.Trash}
                    onAction={clearLogs}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
                  />
                </ActionPanel.Section>

                <ActionPanel.Section>
                  <Action.OpenInBrowser
                    title="Open in Dashboard"
                    url={`https://dashboard.convex.dev/t/${selectedTeam?.slug}/${selectedProject?.slug}/${selectedDeployment?.deploymentType}/logs`}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      {filteredLogs.length === 0 && !logsLoading && (
        <List.EmptyView
          title="No Logs Found"
          description={
            functionFilter
              ? `No logs for function "${functionFilter}"`
              : "No recent function executions"
          }
          icon={Icon.Document}
          actions={
            <ActionPanel>
              <Action
                title={isStreaming ? "Pause Streaming" : "Resume Streaming"}
                icon={isStreaming ? Icon.Pause : Icon.Play}
                onAction={toggleStreaming}
              />
              <Action
                title="Refresh Logs"
                icon={Icon.ArrowClockwise}
                onAction={refresh}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

// Log detail panel component
interface LogDetailPanelProps {
  log: LogEntry;
}

function LogDetailPanel({ log }: LogDetailPanelProps) {
  // Build markdown content
  let markdown = `## ${getFunctionName(log.functionPath)}\n\n`;
  markdown += `\`${log.functionPath}\`\n\n`;

  // Error section
  if (log.status === "failure" && log.errorMessage) {
    markdown += `### Error\n\n`;
    markdown += `\`\`\`\n${truncateError(log.errorMessage, 500)}\n\`\`\`\n\n`;
  }

  // Console output
  if (log.logLines.length > 0) {
    markdown += `### Console Output\n\n`;
    markdown += `\`\`\`\n${log.logLines.join("\n")}\n\`\`\`\n\n`;
  }

  // If no logs or errors, show success message
  if (log.status === "success" && log.logLines.length === 0) {
    markdown += `*Function executed successfully with no console output.*\n`;
  }

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.TagList title="Status">
            <List.Item.Detail.Metadata.TagList.Item
              text={log.status === "success" ? "Success" : "Failed"}
              color={log.status === "success" ? Color.Green : Color.Red}
            />
            {log.cached && (
              <List.Item.Detail.Metadata.TagList.Item
                text="Cached"
                color={Color.Blue}
              />
            )}
          </List.Item.Detail.Metadata.TagList>

          <List.Item.Detail.Metadata.TagList title="Type">
            <List.Item.Detail.Metadata.TagList.Item
              text={log.functionType}
              color={getFunctionTypeColor(log.functionType)}
            />
          </List.Item.Detail.Metadata.TagList>

          <List.Item.Detail.Metadata.Label
            title="Execution Time"
            text={
              log.cached ? "cached" : formatExecutionTime(log.executionTimeMs)
            }
            icon={Icon.Clock}
          />

          <List.Item.Detail.Metadata.Label
            title="Timestamp"
            text={new Date(log.timestamp).toLocaleString()}
            icon={Icon.Calendar}
          />

          <List.Item.Detail.Metadata.Label
            title="Relative Time"
            text={formatRelativeTime(log.timestamp)}
            icon={Icon.Clock}
          />

          <List.Item.Detail.Metadata.Separator />

          <List.Item.Detail.Metadata.Label
            title="Request ID"
            text={log.requestId}
            icon={Icon.Fingerprint}
          />

          <List.Item.Detail.Metadata.Separator />

          <List.Item.Detail.Metadata.Label
            title="Database Reads"
            text={formatBytes(log.usage.databaseReadBytes)}
            icon={Icon.Download}
          />

          <List.Item.Detail.Metadata.Label
            title="Database Writes"
            text={formatBytes(log.usage.databaseWriteBytes)}
            icon={Icon.Upload}
          />

          {log.usage.storageReadBytes > 0 && (
            <List.Item.Detail.Metadata.Label
              title="Storage Reads"
              text={formatBytes(log.usage.storageReadBytes)}
              icon={Icon.Document}
            />
          )}

          {log.usage.storageWriteBytes > 0 && (
            <List.Item.Detail.Metadata.Label
              title="Storage Writes"
              text={formatBytes(log.usage.storageWriteBytes)}
              icon={Icon.Document}
            />
          )}

          {log.usage.memoryUsedMb > 0 && (
            <List.Item.Detail.Metadata.Label
              title="Memory Used"
              text={`${log.usage.memoryUsedMb.toFixed(1)} MB`}
              icon={Icon.MemoryChip}
            />
          )}
        </List.Item.Detail.Metadata>
      }
    />
  );
}

// Helper functions

function getFunctionName(path: string): string {
  const colonIndex = path.lastIndexOf(":");
  if (colonIndex > -1) {
    return path.substring(colonIndex + 1);
  }
  return path;
}

function getLogIcon(log: LogEntry): { source: Icon; tintColor: Color } {
  if (log.status === "failure") {
    return { source: Icon.XMarkCircle, tintColor: Color.Red };
  }

  switch (log.functionType) {
    case "query":
      return { source: Icon.MagnifyingGlass, tintColor: Color.Blue };
    case "mutation":
      return { source: Icon.Pencil, tintColor: Color.Orange };
    case "action":
      return { source: Icon.Bolt, tintColor: Color.Purple };
    case "http":
      return { source: Icon.Globe, tintColor: Color.Green };
    default:
      return { source: Icon.Code, tintColor: Color.SecondaryText };
  }
}

function getLogAccessories(log: LogEntry): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];

  // Function type badge
  accessories.push({
    tag: {
      value: log.functionType.charAt(0).toUpperCase(),
      color: getFunctionTypeColor(log.functionType),
    },
    tooltip: log.functionType,
  });

  // Cached badge
  if (log.cached) {
    accessories.push({
      tag: { value: "cached", color: Color.Blue },
    });
  }

  // Execution time or status
  if (log.status === "failure") {
    accessories.push({
      tag: { value: "failed", color: Color.Red },
    });
  } else if (!log.cached) {
    accessories.push({
      text: formatExecutionTime(log.executionTimeMs),
      tooltip: "Execution time",
    });
  }

  // Timestamp
  accessories.push({
    text: formatTimestamp(log.timestamp),
    tooltip: new Date(log.timestamp).toLocaleString(),
  });

  return accessories;
}

function getFunctionTypeColor(type: string): Color {
  switch (type) {
    case "query":
      return Color.Blue;
    case "mutation":
      return Color.Orange;
    case "action":
      return Color.Purple;
    case "http":
      return Color.Green;
    default:
      return Color.SecondaryText;
  }
}

function truncateError(error: string, maxLength: number): string {
  if (error.length <= maxLength) return error;
  return (
    error.substring(0, maxLength) + "\n... (copy full error with Cmd+Opt+C)"
  );
}
