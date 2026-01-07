/**
 * Run Convex Function Command
 *
 * Search and execute Convex queries, mutations, and actions.
 * Shows function signatures, accepts arguments, and displays results.
 */

import {
  Action,
  ActionPanel,
  Color,
  Detail,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState } from "react";
import { useConvexAuth } from "./hooks/useConvexAuth";
import {
  useFunctions,
  useTeams,
  useProjects,
  useDeployments,
} from "./hooks/useConvexData";
import { runFunction, type FunctionSpec } from "./lib/api";

interface FunctionWithPath extends FunctionSpec {
  fullPath: string;
  modulePath: string;
}

export default function RunFunctionCommand() {
  const {
    session,
    isLoading: authLoading,
    isAuthenticated,
    login,
    selectedContext,
  } = useConvexAuth();
  const [searchText, setSearchText] = useState("");
  const { push } = useNavigation();

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

  // Fetch functions
  const { data: modules, isLoading: functionsLoading } = useFunctions(
    accessToken,
    deploymentName,
  );

  // Handle not authenticated
  if (authLoading) {
    return <List isLoading={true} searchBarPlaceholder="Loading..." />;
  }

  if (!isAuthenticated) {
    return (
      <List>
        <List.EmptyView
          title="Sign in to Convex"
          description="Connect your Convex account to run functions"
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

  // Flatten functions for search
  const allFunctions: FunctionWithPath[] = (modules ?? []).flatMap((module) =>
    module.functions
      .filter((fn) => fn.visibility?.kind === "public")
      .map((fn) => {
        const colonIndex = fn.identifier.lastIndexOf(":");
        const functionName =
          colonIndex > -1
            ? fn.identifier.substring(colonIndex + 1)
            : fn.identifier;

        return {
          ...fn,
          fullPath: fn.identifier,
          modulePath: module.path,
          identifier: functionName,
        };
      }),
  );

  // Filter functions based on search
  const filteredFunctions = allFunctions.filter((fn) => {
    const searchLower = searchText.toLowerCase();
    return (
      fn.fullPath.toLowerCase().includes(searchLower) ||
      fn.identifier.toLowerCase().includes(searchLower) ||
      fn.functionType.toLowerCase().includes(searchLower)
    );
  });

  // Group by module
  const groupedFunctions = filteredFunctions.reduce(
    (acc, fn) => {
      const module = fn.modulePath;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(fn);
      return acc;
    },
    {} as Record<string, FunctionWithPath[]>,
  );

  // Handle running a function
  const handleRunFunction = (fn: FunctionWithPath) => {
    push(
      <FunctionRunner
        functionSpec={fn}
        deploymentName={deploymentName}
        accessToken={accessToken!}
        teamSlug={selectedTeam?.slug}
        projectSlug={selectedProject?.slug}
        deploymentType={selectedDeployment?.deploymentType}
      />,
    );
  };

  return (
    <List
      isLoading={functionsLoading}
      searchBarPlaceholder="Search functions..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
      navigationTitle="Run Convex Function"
    >
      {Object.entries(groupedFunctions).map(([modulePath, functions]) => (
        <List.Section
          key={modulePath}
          title={modulePath}
          subtitle={`${functions.length} functions`}
        >
          {functions.map((fn) => (
            <List.Item
              key={fn.fullPath}
              title={fn.identifier}
              icon={getFunctionIcon(fn.functionType)}
              keywords={[fn.functionType, modulePath, fn.identifier]}
              accessories={[
                {
                  tag: {
                    value: fn.functionType,
                    color: getFunctionColor(fn.functionType),
                  },
                },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Run Function"
                    icon={Icon.Play}
                    onAction={() => handleRunFunction(fn)}
                  />
                  <Action.CopyToClipboard
                    title="Copy Function Path"
                    content={fn.fullPath}
                  />
                  <ActionPanel.Section>
                    <Action.OpenInBrowser
                      title="Open in Dashboard"
                      url={`https://dashboard.convex.dev/t/${selectedTeam?.slug}/${selectedProject?.slug}/${selectedDeployment?.deploymentType}/functions?function=${encodeURIComponent(fn.fullPath)}`}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}

      {filteredFunctions.length === 0 && !functionsLoading && (
        <List.EmptyView
          title="No Functions Found"
          description={
            searchText
              ? `No functions matching "${searchText}"`
              : "No public functions in this deployment"
          }
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}

// Function runner - now uses Detail view for better design
interface FunctionRunnerProps {
  functionSpec: FunctionWithPath;
  deploymentName: string;
  accessToken: string;
  teamSlug?: string;
  projectSlug?: string;
  deploymentType?: string;
}

function FunctionRunner({
  functionSpec,
  deploymentName,
  accessToken,
  teamSlug,
  projectSlug,
  deploymentType,
}: FunctionRunnerProps) {
  const [result, setResult] = useState<{
    data: unknown;
    executionTime: number;
    args: Record<string, unknown>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { push, pop } = useNavigation();

  const handleRunWithArgs = () => {
    push(
      <ArgumentsForm
        functionSpec={functionSpec}
        onSubmit={executeFunction}
        isRunning={isRunning}
      />,
    );
  };

  const executeFunction = async (args: Record<string, unknown>) => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await runFunction(
        deploymentName,
        accessToken,
        functionSpec.fullPath,
        functionSpec.functionType,
        args,
      );

      setResult({
        data: response.result,
        executionTime: response.executionTime,
        args,
      });

      await showToast({
        style: Toast.Style.Success,
        title: "Function executed successfully",
        message: `Completed in ${response.executionTime}ms`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      await showToast({
        style: Toast.Style.Failure,
        title: "Function failed",
        message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Quick run with empty args
  const handleQuickRun = () => executeFunction({});

  // Build the markdown content
  const buildMarkdown = () => {
    let md = `# ${functionSpec.identifier}\n\n`;
    md += `\`${functionSpec.fullPath}\`\n\n`;

    if (result) {
      md += `## Result\n\n`;
      md += `\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n\n`;

      if (Object.keys(result.args).length > 0) {
        md += `## Arguments Used\n\n`;
        md += `\`\`\`json\n${JSON.stringify(result.args, null, 2)}\n\`\`\`\n`;
      }
    } else if (error) {
      md += `## Error\n\n`;
      md += `\`\`\`\n${error}\n\`\`\`\n`;
    } else {
      md += `---\n\n`;
      md += `Press **Enter** to run with arguments, or **Cmd+R** to run with empty args.\n`;
    }

    return md;
  };

  return (
    <Detail
      isLoading={isRunning}
      navigationTitle={functionSpec.identifier}
      markdown={buildMarkdown()}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.TagList title="Type">
            <Detail.Metadata.TagList.Item
              text={functionSpec.functionType}
              color={getFunctionColor(functionSpec.functionType)}
            />
          </Detail.Metadata.TagList>

          <Detail.Metadata.Label
            title="Module"
            text={functionSpec.modulePath}
            icon={Icon.Document}
          />

          <Detail.Metadata.Label
            title="Full Path"
            text={functionSpec.fullPath}
            icon={Icon.Link}
          />

          <Detail.Metadata.Separator />

          {functionSpec.args && (
            <Detail.Metadata.Label
              title="Expected Args"
              text={formatArgsPreview(functionSpec.args)}
              icon={Icon.Text}
            />
          )}

          {result && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.TagList title="Status">
                <Detail.Metadata.TagList.Item
                  text="Success"
                  color={Color.Green}
                />
              </Detail.Metadata.TagList>
              <Detail.Metadata.Label
                title="Execution Time"
                text={`${result.executionTime}ms`}
                icon={Icon.Clock}
              />
              <Detail.Metadata.Label
                title="Result Type"
                text={getResultType(result.data)}
                icon={Icon.Code}
              />
            </>
          )}

          {error && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.TagList title="Status">
                <Detail.Metadata.TagList.Item text="Failed" color={Color.Red} />
              </Detail.Metadata.TagList>
            </>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Run with Arguments"
              icon={Icon.Play}
              onAction={handleRunWithArgs}
            />
            <Action
              title="Quick Run Without Arguments"
              icon={Icon.Bolt}
              onAction={handleQuickRun}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel.Section>

          {result && (
            <ActionPanel.Section>
              <Action.CopyToClipboard
                title="Copy Result"
                content={JSON.stringify(result.data, null, 2)}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy as One Line"
                content={JSON.stringify(result.data)}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel.Section>
          )}

          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy Function Path"
              content={functionSpec.fullPath}
            />
            <Action.OpenInBrowser
              title="Open in Dashboard"
              url={`https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/${deploymentType}/functions?function=${encodeURIComponent(functionSpec.fullPath)}`}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="Go Back"
              icon={Icon.ArrowLeft}
              onAction={pop}
              shortcut={{ modifiers: ["cmd"], key: "[" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

// Arguments form component
interface ArgumentsFormProps {
  functionSpec: FunctionWithPath;
  onSubmit: (args: Record<string, unknown>) => void;
  isRunning: boolean;
}

function ArgumentsForm({
  functionSpec,
  onSubmit,
  isRunning,
}: ArgumentsFormProps) {
  const [argsJson, setArgsJson] = useState("{}");
  const [parseError, setParseError] = useState<string | null>(null);
  const { pop } = useNavigation();

  const handleSubmit = () => {
    try {
      const args = JSON.parse(argsJson);
      setParseError(null);
      pop(); // Go back to the function runner
      onSubmit(args);
    } catch {
      setParseError("Invalid JSON format");
    }
  };

  return (
    <Form
      isLoading={isRunning}
      navigationTitle={`Arguments: ${functionSpec.identifier}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Run Function"
            icon={Icon.Play}
            onSubmit={handleSubmit}
          />
          <Action
            title="Cancel"
            icon={Icon.XMarkCircle}
            onAction={pop}
            shortcut={{ modifiers: ["cmd"], key: "." }}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="Function" text={`${functionSpec.fullPath}`} />

      <Form.Description
        title="Type"
        text={
          functionSpec.functionType.charAt(0).toUpperCase() +
          functionSpec.functionType.slice(1)
        }
      />

      {functionSpec.args && (
        <Form.Description
          title="Expected Arguments"
          text={formatArgsPreview(functionSpec.args)}
        />
      )}

      <Form.Separator />

      <Form.TextArea
        id="args"
        title="Arguments"
        placeholder='{"key": "value"}'
        value={argsJson}
        onChange={(value) => {
          setArgsJson(value);
          setParseError(null);
        }}
        error={parseError ?? undefined}
        info="Enter arguments as a JSON object"
      />
    </Form>
  );
}

// Helper functions
function getFunctionIcon(type: string): Icon {
  switch (type) {
    case "query":
      return Icon.MagnifyingGlass;
    case "mutation":
      return Icon.Pencil;
    case "action":
      return Icon.Bolt;
    default:
      return Icon.Code;
  }
}

function getFunctionColor(type: string): Color {
  switch (type) {
    case "query":
      return Color.Blue;
    case "mutation":
      return Color.Orange;
    case "action":
      return Color.Purple;
    default:
      return Color.SecondaryText;
  }
}

function formatArgsPreview(args: string): string {
  // Args is typically a validator string like "v.object({...})"
  // Simplify for display
  if (args.length > 100) {
    return args.substring(0, 100) + "...";
  }
  return args;
}

function getResultType(result: unknown): string {
  if (result === null) return "null";
  if (result === undefined) return "undefined";
  if (Array.isArray(result)) return `Array (${result.length} items)`;
  if (typeof result === "object") {
    const keys = Object.keys(result);
    return `Object (${keys.length} fields)`;
  }
  return typeof result;
}
