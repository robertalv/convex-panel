/**
 * Browse Convex Tables Command
 *
 * Browse and search documents in your Convex database tables.
 * Supports pagination, document viewing with detail panel, and quick actions.
 */

import {
  Action,
  ActionPanel,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { useConvexAuth } from "./hooks/useConvexAuth";
import {
  useTables,
  useTeams,
  useProjects,
  useDeployments,
} from "./hooks/useConvexData";
import {
  getDocuments,
  formatDocumentId,
  type Document,
  type TableInfo,
} from "./lib/api";

type ViewState = "tables" | "documents";

export default function BrowseTablesCommand() {
  const {
    session,
    isLoading: authLoading,
    isAuthenticated,
    login,
    selectedContext,
  } = useConvexAuth();
  const [viewState, setViewState] = useState<ViewState>("tables");
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [showingDetail, setShowingDetail] = useState(true);

  const accessToken = session?.accessToken ?? null;
  const deploymentName = selectedContext.deploymentName;

  // Fetch context data
  const { data: teams } = useTeams(accessToken);
  const { data: projects } = useProjects(accessToken, selectedContext.teamId);
  const { data: deployments } = useDeployments(
    accessToken,
    selectedContext.projectId,
  );

  const selectedTeam = teams?.find((t) => t.id === selectedContext.teamId);
  const selectedProject = projects?.find(
    (p) => p.id === selectedContext.projectId,
  );
  const selectedDeployment = deployments?.find(
    (d) => d.name === deploymentName,
  );

  // Fetch tables
  const { data: tables, isLoading: tablesLoading } = useTables(
    accessToken,
    deploymentName,
  );

  // Fetch documents when table is selected
  useEffect(() => {
    if (!selectedTable || !accessToken || !deploymentName) return;

    async function fetchDocuments() {
      setDocumentsLoading(true);
      try {
        const result = await getDocuments(
          deploymentName!,
          accessToken!,
          selectedTable!.name,
          {
            limit: 50,
          },
        );
        setDocuments(result.documents);
        setNextCursor(result.nextCursor);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to load documents",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setDocumentsLoading(false);
      }
    }

    fetchDocuments();
  }, [selectedTable, accessToken, deploymentName]);

  // Load more documents
  const loadMore = async () => {
    if (!nextCursor || !selectedTable || !accessToken || !deploymentName)
      return;

    setDocumentsLoading(true);
    try {
      const result = await getDocuments(
        deploymentName,
        accessToken,
        selectedTable.name,
        {
          limit: 50,
          cursor: nextCursor,
        },
      );
      setDocuments((prev) => [...prev, ...result.documents]);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error("Failed to load more documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Handle not authenticated
  if (authLoading) {
    return <List isLoading={true} searchBarPlaceholder="Loading..." />;
  }

  if (!isAuthenticated) {
    return (
      <List>
        <List.EmptyView
          title="Sign in to Convex"
          description="Connect your Convex account to browse tables"
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

  // Handle table selection
  const handleSelectTable = (table: TableInfo) => {
    setSelectedTable(table);
    setDocuments([]);
    setNextCursor(undefined);
    setViewState("documents");
  };

  // Handle going back
  const handleGoBack = () => {
    setSelectedTable(null);
    setDocuments([]);
    setNextCursor(undefined);
    setViewState("tables");
  };

  const isLoading = viewState === "tables" ? tablesLoading : documentsLoading;
  const contextSubtitle =
    selectedProject && selectedDeployment
      ? `${selectedProject.name} / ${selectedDeployment.deploymentType}`
      : deploymentName;

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={
        viewState === "documents" && showingDetail && documents.length > 0
      }
      navigationTitle={
        viewState === "tables" ? "Browse Tables" : `${selectedTable?.name}`
      }
      searchBarPlaceholder={
        viewState === "tables" ? "Search tables..." : "Search documents..."
      }
    >
      {/* Tables view */}
      {viewState === "tables" && tables && (
        <List.Section
          title={contextSubtitle}
          subtitle={`${tables.length} tables`}
        >
          {tables.map((table) => (
            <List.Item
              key={table.name}
              title={table.name}
              icon={Icon.List}
              accessories={
                table.documentCount
                  ? [{ text: `${table.documentCount} docs` }]
                  : []
              }
              actions={
                <ActionPanel>
                  <Action
                    title="Browse Documents"
                    icon={Icon.ArrowRight}
                    onAction={() => handleSelectTable(table)}
                  />
                  <Action.CopyToClipboard
                    title="Copy Table Name"
                    content={table.name}
                  />
                  <ActionPanel.Section>
                    <Action.OpenInBrowser
                      title="Open in Dashboard"
                      url={`https://dashboard.convex.dev/t/${selectedTeam?.slug}/${selectedProject?.slug}/${selectedDeployment?.deploymentType}/data?table=${table.name}`}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}

      {/* Documents view */}
      {viewState === "documents" && (
        <>
          <List.Section
            title={selectedTable?.name}
            subtitle={`${documents.length} documents${nextCursor ? " (more available)" : ""}`}
          >
            {documents.map((doc) => (
              <List.Item
                key={doc._id}
                title={getDocumentTitle(doc)}
                subtitle={showingDetail ? undefined : getDocumentSubtitle(doc)}
                icon={Icon.Document}
                accessories={
                  showingDetail
                    ? undefined
                    : [
                        {
                          date: new Date(doc._creationTime),
                          tooltip: "Created",
                        },
                      ]
                }
                detail={<DocumentDetailPanel document={doc} />}
                actions={
                  <ActionPanel>
                    <Action
                      title={showingDetail ? "Hide Detail" : "Show Detail"}
                      icon={showingDetail ? Icon.EyeDisabled : Icon.Eye}
                      onAction={() => setShowingDetail(!showingDetail)}
                    />
                    <Action.CopyToClipboard
                      title="Copy Document JSON"
                      content={JSON.stringify(doc, null, 2)}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    <Action.CopyToClipboard
                      title="Copy Document Id"
                      content={doc._id}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    />
                    <ActionPanel.Section>
                      <Action
                        title="Go Back"
                        icon={Icon.ArrowLeft}
                        onAction={handleGoBack}
                        shortcut={{ modifiers: ["cmd"], key: "[" }}
                      />
                      {nextCursor && (
                        <Action
                          title="Load More"
                          icon={Icon.ArrowDown}
                          onAction={loadMore}
                          shortcut={{ modifiers: ["cmd"], key: "l" }}
                        />
                      )}
                    </ActionPanel.Section>
                    <ActionPanel.Section>
                      <Action.OpenInBrowser
                        title="Open in Dashboard"
                        url={`https://dashboard.convex.dev/t/${selectedTeam?.slug}/${selectedProject?.slug}/${selectedDeployment?.deploymentType}/data?table=${selectedTable?.name}`}
                      />
                    </ActionPanel.Section>
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>

          {/* Load more item */}
          {nextCursor && !documentsLoading && (
            <List.Item
              title="Load More Documents"
              icon={Icon.ArrowDown}
              actions={
                <ActionPanel>
                  <Action
                    title="Load More"
                    icon={Icon.ArrowDown}
                    onAction={loadMore}
                  />
                </ActionPanel>
              }
            />
          )}
        </>
      )}

      {/* Empty states */}
      {viewState === "tables" && tables?.length === 0 && !tablesLoading && (
        <List.EmptyView
          title="No Tables Found"
          description="This deployment has no tables"
          icon={Icon.List}
        />
      )}

      {viewState === "documents" &&
        documents.length === 0 &&
        !documentsLoading && (
          <List.EmptyView
            title="No Documents Found"
            description={`The ${selectedTable?.name} table is empty`}
            icon={Icon.Document}
            actions={
              <ActionPanel>
                <Action
                  title="Go Back"
                  icon={Icon.ArrowLeft}
                  onAction={handleGoBack}
                />
              </ActionPanel>
            }
          />
        )}
    </List>
  );
}

// Document detail panel component
interface DocumentDetailPanelProps {
  document: Document;
}

function DocumentDetailPanel({ document }: DocumentDetailPanelProps) {
  // Get all fields except system fields for the main display
  const userFields = Object.entries(document).filter(
    ([key]) => !key.startsWith("_"),
  );

  // Build markdown content with formatted JSON
  const markdown = `
\`\`\`json
${JSON.stringify(document, null, 2)}
\`\`\`
`;

  return (
    <List.Item.Detail
      markdown={markdown}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label
            title="Document ID"
            text={formatDocumentId(document._id)}
            icon={Icon.Fingerprint}
          />
          <List.Item.Detail.Metadata.Label
            title="Created"
            text={new Date(document._creationTime).toLocaleString()}
            icon={Icon.Clock}
          />
          <List.Item.Detail.Metadata.Separator />

          {userFields.map(([key, value]) => (
            <List.Item.Detail.Metadata.Label
              key={key}
              title={key}
              text={formatFieldValue(value)}
              icon={getFieldIcon(value)}
            />
          ))}

          {userFields.length === 0 && (
            <List.Item.Detail.Metadata.Label
              title="No fields"
              text="This document has no user-defined fields"
              icon={Icon.Warning}
            />
          )}
        </List.Item.Detail.Metadata>
      }
    />
  );
}

// Helper to get a meaningful title for the document
function getDocumentTitle(doc: Document): string {
  // Try to find a good title field
  const titleFields = [
    "name",
    "title",
    "label",
    "text",
    "email",
    "username",
    "id",
  ];
  for (const field of titleFields) {
    if (doc[field] && typeof doc[field] === "string") {
      const value = doc[field] as string;
      return value.length > 40 ? value.substring(0, 40) + "..." : value;
    }
  }
  // Fallback to abbreviated ID
  return formatDocumentId(doc._id);
}

// Helper to get subtitle with key fields
function getDocumentSubtitle(doc: Document): string {
  const fields = Object.entries(doc)
    .filter(([key]) => !key.startsWith("_"))
    .slice(0, 2);

  if (fields.length === 0) return "Empty document";

  return fields
    .map(([key, value]) => `${key}: ${formatFieldValue(value)}`)
    .join(" | ");
}

// Format a field value for display
function formatFieldValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (value.length > 50) return `"${value.substring(0, 50)}..."`;
    return `"${value}"`;
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `{${keys.length} fields}`;
  }
  return String(value);
}

// Get an appropriate icon for the field type
function getFieldIcon(value: unknown): Icon {
  if (value === null || value === undefined) return Icon.Circle;
  if (typeof value === "boolean")
    return value ? Icon.CheckCircle : Icon.XMarkCircle;
  if (typeof value === "number") return Icon.Hashtag;
  if (typeof value === "string") {
    // Check if it looks like an ID reference
    if (value.match(/^[a-z][a-z0-9]+\.[a-z0-9]+$/i)) return Icon.Link;
    return Icon.Text;
  }
  if (Array.isArray(value)) return Icon.List;
  if (typeof value === "object") return Icon.Folder;
  return Icon.QuestionMark;
}
