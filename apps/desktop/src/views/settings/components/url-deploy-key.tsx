import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Plus,
  Loader2,
  Key,
  Trash2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useDeployment } from "../../../contexts/deployment-context";
import {
  getDeploymentAccessTokens,
  createAccessToken,
  deleteAccessToken,
  type AccessToken,
} from "@convex-panel/shared/api";
import {
  getKeyPreview,
  readDeployKeyFromEnvLocal,
  writeDeployKeyToEnvLocal,
} from "../../../lib/envFile";
import { useProjectPathOptional } from "../../../contexts/project-path-context";

/**
 * Get the deployment type from a deployment name
 */
function getDeploymentType(
  deploymentName: string | undefined,
): "prod" | "dev" | "preview" | null {
  if (!deploymentName) return null;
  if (deploymentName.includes("-prod-") || deploymentName.endsWith("-prod")) {
    return "prod";
  }
  if (deploymentName.includes("-dev-") || deploymentName.endsWith("-dev")) {
    return "dev";
  }
  if (
    deploymentName.includes("-preview-") ||
    deploymentName.endsWith("-preview")
  ) {
    return "preview";
  }
  // Default to prod if no pattern matches (older deployments)
  return "prod";
}

/**
 * Check if a serialized access token matches the current deploy key
 * Handles both formatted keys (type:deployment|token) and raw tokens
 */
function isTokenActive(
  currentDeployKey: string | null | undefined,
  serializedAccessToken: string,
  deploymentName: string,
): boolean {
  if (!currentDeployKey) return false;

  // Direct match (both in same format)
  if (currentDeployKey === serializedAccessToken) return true;

  // Check if currentDeployKey contains the serializedAccessToken
  // currentDeployKey format: "dev:deployment-name|token"
  // serializedAccessToken might be: "token" or "dev:deployment-name|token"
  if (currentDeployKey.includes("|")) {
    const tokenPart = currentDeployKey.split("|")[1];
    if (tokenPart === serializedAccessToken) return true;
  }

  // Check if we need to construct the full key format to compare
  const type = getDeploymentType(deploymentName) || "prod";
  const constructedKey = `${type}:${deploymentName}|${serializedAccessToken}`;
  if (currentDeployKey === constructedKey) return true;

  return false;
}

export function UrlDeployKey() {
  const projectPathContext = useProjectPathOptional();
  const projectPath = projectPathContext?.projectPath ?? null;
  const deployment = useDeployment();
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // .env.local state
  const [envLocalKey, setEnvLocalKey] = useState<string | null>(null);
  const [isWritingEnvLocal, setIsWritingEnvLocal] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState<AccessToken[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [deletedKeyIds, setDeletedKeyIds] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [keyToDelete, setKeyToDelete] = useState<{
    accessToken: string;
    name: string;
    isActive: boolean;
  } | null>(null);

  const deploymentUrl = deployment.deploymentUrl || "";
  // HTTP Actions URL - construct it from deployment URL if not available
  const httpActionsUrl = deployment.deploymentUrl
    ? deployment.deploymentUrl.replace(".convex.cloud", ".convex.site")
    : "";
  const deploymentType = getDeploymentType(deployment.deployment?.name);
  const isDev = deploymentType === "dev";
  const isNonProd = deploymentType !== "prod";

  // Load API keys
  useEffect(() => {
    loadApiKeys();
  }, [deployment.deployment?.name, deployment.accessToken, deployment.fetchFn]);

  // Load .env.local key
  useEffect(() => {
    if (projectPath) {
      readDeployKeyFromEnvLocal(projectPath)
        .then(setEnvLocalKey)
        .catch(() => setEnvLocalKey(null));
    }
  }, [projectPath]);

  const loadApiKeys = async () => {
    console.log("[UrlDeployKey] loadApiKeys called", {
      hasAccessToken: Boolean(deployment.accessToken),
      deploymentName: deployment.deployment?.name,
      hasFetchFn: Boolean(deployment.fetchFn),
      deploymentId: deployment.deployment?.id,
    });

    if (
      !deployment.accessToken ||
      !deployment.deployment?.name ||
      !deployment.fetchFn
    ) {
      console.log("[UrlDeployKey] Missing required data, not loading API keys");
      setApiKeys([]);
      return;
    }

    setIsLoadingKeys(true);
    try {
      console.log(
        "[UrlDeployKey] Fetching deployment access tokens for:",
        deployment.deployment.name,
      );
      const tokens = await getDeploymentAccessTokens(
        deployment.accessToken,
        deployment.deployment.name,
        deployment.fetchFn,
      );
      console.log("[UrlDeployKey] Loaded API keys:", tokens.length);
      setApiKeys(tokens);
    } catch (err) {
      console.error("[UrlDeployKey] Failed to load API keys:", err);
      setApiKeys([]);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(identifier);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCreateDeployKey = async () => {
    if (
      !deployment.accessToken ||
      !deployment.deployment ||
      !deployment.fetchFn ||
      !deployment.teamId
    ) {
      setError("Missing required information to create deploy key");
      return;
    }

    const trimmedName = newKeyName.trim();
    if (!trimmedName) {
      return;
    }

    setIsCreatingKey(true);
    setError(null);
    try {
      const result = await createAccessToken(
        deployment.accessToken,
        {
          name: trimmedName,
          teamId: deployment.teamId,
          deploymentId: deployment.deployment.id,
        },
        deployment.fetchFn,
      );

      // Use the newly created key
      await deployment.setManualDeployKey(result.accessToken);

      // Reload keys
      await loadApiKeys();

      setNewKeyName("");
      setShowCreateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deployment.accessToken || !deployment.fetchFn || !keyToDelete) {
      return;
    }

    // Check if we're deleting the currently active key
    const isDeletingActiveKey = keyToDelete.isActive;

    setDeletingKeyId(keyToDelete.accessToken);
    try {
      await deleteAccessToken(
        deployment.accessToken,
        keyToDelete.accessToken,
        deployment.fetchFn,
      );

      // Mark as deleted (shows "Deleted!" message)
      setDeletedKeyIds((prev) => new Set(prev).add(keyToDelete.accessToken));
      setDeletingKeyId(null);

      // If we deleted the active key, clear it from the deployment context
      if (isDeletingActiveKey) {
        await deployment.clearManualDeployKey();
      }

      // Wait 1 second to show "Deleted!" message, then remove from list
      setTimeout(() => {
        setApiKeys((prev) =>
          prev.filter((k) => k.accessToken !== keyToDelete.accessToken),
        );
        setDeletedKeyIds((prev) => {
          const next = new Set(prev);
          next.delete(keyToDelete.accessToken);
          return next;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
      setDeletingKeyId(null);
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleSelectKey = async (serializedToken: string) => {
    if (!deployment.deployment?.name) {
      setError("No deployment selected");
      return;
    }

    try {
      // Check if the key already has the correct format (type:deployment|token)
      // If it does, use it as-is. If not, construct the proper format.
      let deployKey: string;

      if (serializedToken.includes(":") && serializedToken.includes("|")) {
        // Key already in correct format
        deployKey = serializedToken;
      } else {
        // Construct the proper format: {type}:{deployment-name}|{token}
        const deploymentName = deployment.deployment.name;
        const type = getDeploymentType(deploymentName) || "prod";
        deployKey = `${type}:${deploymentName}|${serializedToken}`;
      }

      await deployment.setManualDeployKey(deployKey);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate key");
    }
  };

  const handleWriteToEnvLocal = async () => {
    if (!projectPath || !deployment.cliDeployKey) return;

    setIsWritingEnvLocal(true);
    setError(null);

    try {
      await writeDeployKeyToEnvLocal(projectPath, deployment.cliDeployKey);
      setEnvLocalKey(deployment.cliDeployKey);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to write deploy key",
      );
    } finally {
      setIsWritingEnvLocal(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (deployment.cliDeployKeyLoading) {
      console.log(
        "[UrlDeployKey] Key regeneration already in progress, skipping",
      );
      return;
    }

    try {
      await deployment.regenerateDeployKey();
      await loadApiKeys();
    } catch (err) {
      await loadApiKeys();
    }
  };

  if (!deployment.deployment) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
        <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-2">
          <h2 className="m-0 text-sm font-bold text-text-base">
            Deployment URL and Deploy Key
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-text-muted">
          No deployment selected
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Header */}
      <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-2">
        <h2 className="m-0 text-sm font-bold text-text-base">
          Deployment URL and Deploy Key
        </h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="flex w-full max-w-[600px] flex-col gap-4">
          {/* Description paragraphs */}
          <div className="flex flex-col gap-3 text-sm leading-[1.6] text-text-muted">
            <p className="m-0">
              {deploymentType === "dev"
                ? "This personal development Convex deployment also has deployment credentials. Edits you make to functions in your editor sync automatically, but it is also possible to deploy to it from somewhere else using a deploy key."
                : "Manage deploy keys for your Convex deployment. Deploy keys allow you to deploy to this deployment from CI/CD pipelines or other environments."}
            </p>
          </div>

          {/* Non-prod Warning */}
          {isNonProd && deploymentType && (
            <div className="flex items-start gap-3 rounded-lg border border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.1)] p-4">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-warning-base"
              />
              <div>
                <p className="m-0 mb-1 text-[13px] font-semibold text-warning-base">
                  {deploymentType === "dev"
                    ? "Development Deployment"
                    : "Preview Deployment"}
                </p>
                <p className="m-0 text-xs text-text-muted">
                  {deploymentType === "dev"
                    ? "This deploy key is for your development deployment. Data here is separate from production."
                    : "This deploy key is for a preview deployment. Preview deployments are temporary and may be deleted."}
                </p>
              </div>
            </div>
          )}

          {/* Active Deploy Key Status */}
          <div className="rounded-xl border border-border-base bg-surface-raised p-4">
            <h3 className="m-0 mb-1 text-sm font-semibold text-text-base">
              Active Deploy Key
            </h3>
            <p className="m-0 mb-3 text-xs text-text-muted">
              Currently active key for CLI commands in the terminal
            </p>

            <div className="rounded-lg border border-border-base bg-surface-base p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: deployment.cliDeployKeyError
                        ? "var(--color-error-base)"
                        : deployment.cliDeployKeyLoading
                          ? "var(--color-warning-base, #eab308)"
                          : deployment.cliDeployKey
                            ? "var(--color-success-base, #22c55e)"
                            : "var(--color-text-muted)",
                    }}
                  />
                  <div>
                    <div className="text-[13px] font-medium text-text-base">
                      {deployment.cliDeployKeyError
                        ? "Error"
                        : deployment.cliDeployKeyLoading
                          ? "Loading..."
                          : deployment.cliDeployKey
                            ? deployment.cliDeployKeyIsManual
                              ? "Manual Key Active"
                              : "Authenticated"
                            : "No Key Active"}
                    </div>
                    {deployment.cliDeployKey && (
                      <div className="font-mono text-[11px] text-text-muted">
                        {getKeyPreview(deployment.cliDeployKey)}
                      </div>
                    )}
                  </div>
                </div>
                {!deployment.cliDeployKeyLoading && (
                  <button
                    onClick={handleRegenerateKey}
                    disabled={deployment.cliDeployKeyLoading}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border-base bg-transparent px-2.5 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-overlay"
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                )}
              </div>

              {deployment.cliDeployKeyError && (
                <div className="mt-3 rounded-lg border border-error-base bg-[rgba(239,68,68,0.1)] p-3">
                  <p className="m-0 text-xs text-error-base">
                    {deployment.cliDeployKeyError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Development Credentials Section */}
          <div className="overflow-hidden rounded-lg border border-border-base bg-surface-raised">
            {/* Collapsible Header */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent p-3 px-4 text-left text-sm text-text-base transition-colors hover:bg-surface-overlay"
            >
              {isExpanded ? (
                <ChevronUp size={16} className="text-text-muted" />
              ) : (
                <ChevronDown size={16} className="text-text-muted" />
              )}
              <span className="font-medium">
                {deploymentType === "dev"
                  ? "Show development credentials"
                  : "Show deployment credentials"}
              </span>
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
              <div className="flex flex-col gap-6 border-t border-border-base p-4">
                {/* Deployment URL Section */}
                <div className="flex flex-col gap-2">
                  <h3 className="m-0 text-sm font-semibold text-text-base">
                    Deployment URL
                  </h3>
                  <p className="m-0 text-[13px] text-text-muted">
                    This {deploymentType === "dev" ? "development" : ""} Convex
                    deployment is hosted at the following URL. Configure a
                    Convex client with this URL while developing locally.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-border-base bg-background-base px-3 py-2 font-mono text-[13px] text-text-base">
                      {deploymentUrl || "Loading..."}
                    </div>
                    <button
                      onClick={() =>
                        deploymentUrl &&
                        copyToClipboard(deploymentUrl, "deployment-url")
                      }
                      className="flex cursor-pointer items-center justify-center rounded-md border border-border-base bg-transparent p-2 transition-colors hover:border-brand-base hover:text-text-base"
                      style={{
                        color:
                          copiedValue === "deployment-url"
                            ? "var(--color-brand-base)"
                            : "var(--color-text-muted)",
                      }}
                      title="Copy deployment URL"
                    >
                      {copiedValue === "deployment-url" ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* HTTP Actions URL Section */}
                {httpActionsUrl && (
                  <div className="flex flex-col gap-2">
                    <h3 className="m-0 text-sm font-semibold text-text-base">
                      HTTP Actions URL
                    </h3>
                    <p className="m-0 text-[13px] text-text-muted">
                      This {deploymentType === "dev" ? "development" : ""}{" "}
                      Convex deployment hosts{" "}
                      <a
                        href="https://docs.convex.dev/functions/http-actions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-base no-underline hover:underline"
                      >
                        HTTP Actions
                      </a>{" "}
                      at the following URL. In Convex functions, this is
                      available as process.env.CONVEX_SITE_URL.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-border-base bg-background-base px-3 py-2 font-mono text-[13px] text-text-base">
                        {httpActionsUrl || "Loading..."}
                      </div>
                      <button
                        onClick={() =>
                          httpActionsUrl &&
                          copyToClipboard(httpActionsUrl, "http-actions-url")
                        }
                        className="flex cursor-pointer items-center justify-center rounded-md border border-border-base bg-transparent p-2 transition-colors hover:border-brand-base hover:text-text-base"
                        style={{
                          color:
                            copiedValue === "http-actions-url"
                              ? "var(--color-brand-base)"
                              : "var(--color-text-muted)",
                        }}
                        title="Copy HTTP Actions URL"
                      >
                        {copiedValue === "http-actions-url" ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Deploy Keys Section */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="m-0 mb-1 text-sm font-semibold text-text-base">
                        Deploy Keys
                      </h3>
                      <p className="m-0 text-[13px] text-text-muted">
                        {isDev
                          ? "It's rare to need a development deploy key."
                          : "Create and manage deploy keys for CI/CD and other environments."}
                      </p>
                    </div>
                    {deployment.accessToken && deployment.teamId && (
                      <button
                        onClick={() => setShowCreateDialog(true)}
                        disabled={isLoadingKeys}
                        className="flex items-center gap-1.5 rounded-md border border-border-base bg-transparent px-2.5 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus size={14} /> Create Deploy Key
                      </button>
                    )}
                  </div>

                  {/* Create Dialog */}
                  {showCreateDialog && (
                    <div className="rounded-lg border border-brand-base bg-surface-base p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[13px] font-medium text-text-base">
                          Create New Deploy Key
                        </span>
                        <button
                          onClick={() => {
                            setShowCreateDialog(false);
                            setNewKeyName("");
                          }}
                          className="cursor-pointer border-none bg-none p-1 px-2 text-[11px] text-text-muted"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., CI/CD Deploy Key"
                        className="mb-3 w-full rounded-lg border border-border-base bg-surface-raised px-3 py-2.5 text-xs text-text-base outline-none focus:border-brand-base"
                      />
                      <button
                        onClick={handleCreateDeployKey}
                        disabled={!newKeyName.trim() || isCreatingKey}
                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-none px-4 py-2.5 text-xs font-medium text-white transition-all disabled:cursor-not-allowed hover:opacity-90"
                        style={{
                          backgroundColor:
                            !newKeyName.trim() || isCreatingKey
                              ? "var(--color-brand-base-alpha, rgba(99, 102, 241, 0.3))"
                              : "var(--color-brand-base)",
                        }}
                      >
                        {isCreatingKey ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            Create and Activate
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Keys List */}
                  <div className="overflow-hidden rounded-lg border border-border-base bg-surface-base">
                    {isLoadingKeys ? (
                      <div className="flex items-center justify-center gap-3 p-6">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-xs text-text-muted">
                          Loading keys...
                        </span>
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="p-6 text-center">
                        <Key
                          size={32}
                          className="mx-auto mb-3 opacity-30 text-text-muted"
                        />
                        <p className="m-0 text-xs text-text-muted">
                          No deploy keys found. Create one to get started.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {apiKeys.map((key, index) => {
                          const isActive = isTokenActive(
                            deployment.cliDeployKey,
                            key.serializedAccessToken,
                            deployment.deployment?.name || "",
                          );
                          const isDeleting = deletingKeyId === key.accessToken;
                          const isDeleted = deletedKeyIds.has(key.accessToken);

                          return (
                            <div
                              key={key.accessToken}
                              className="flex items-center justify-between px-4 py-3 transition-all"
                              style={{
                                borderBottom:
                                  index < apiKeys.length - 1
                                    ? "1px solid var(--color-border-base)"
                                    : "none",
                                backgroundColor: isDeleted
                                  ? "var(--color-success-base-alpha, rgba(34, 197, 94, 0.05))"
                                  : isActive
                                    ? "var(--color-success-base-alpha, rgba(34, 197, 94, 0.05))"
                                    : "transparent",
                                opacity: isDeleted ? 0.7 : 1,
                              }}
                            >
                              {isDeleting || isDeleted ? (
                                // Deleting/Deleted state
                                <div className="flex flex-1 items-center justify-center gap-2">
                                  {isDeleting ? (
                                    <>
                                      <Loader2
                                        size={16}
                                        className="animate-spin text-text-muted"
                                      />
                                      <span className="text-[13px] font-medium text-text-muted">
                                        Deleting...
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2
                                        size={16}
                                        className="text-success-base"
                                      />
                                      <span className="text-[13px] font-medium text-success-base">
                                        Deleted!
                                      </span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                // Normal state
                                <>
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                      <span className="text-[13px] font-medium text-text-base">
                                        {key.name}
                                      </span>
                                      {isActive && (
                                        <span className="flex items-center gap-1 rounded bg-[rgba(34,197,94,0.1)] px-1.5 py-0.5 text-[11px] text-success-base">
                                          <CheckCircle2 size={12} />
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <div className="mb-1 font-mono text-[11px] text-text-muted">
                                      {getKeyPreview(key.serializedAccessToken)}
                                    </div>
                                    <div className="text-[11px] text-text-muted">
                                      {key.lastUsedTime
                                        ? `Last used: ${new Date(key.lastUsedTime).toLocaleDateString()}`
                                        : "Never used"}{" "}
                                      • Created:{" "}
                                      {new Date(
                                        key.creationTime,
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!isActive && (
                                      <button
                                        onClick={() =>
                                          handleSelectKey(
                                            key.serializedAccessToken,
                                          )
                                        }
                                        className="flex cursor-pointer items-center gap-1 rounded-md border border-border-base bg-transparent px-2.5 py-1.5 text-xs font-medium text-success-base transition-colors hover:bg-[rgba(34,197,94,0.1)]"
                                      >
                                        <Check size={12} />
                                        Use This Key
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        setKeyToDelete({
                                          accessToken: key.accessToken,
                                          name: key.name,
                                          isActive,
                                        })
                                      }
                                      className="flex cursor-pointer items-center gap-1 rounded-md border border-border-base bg-transparent px-2.5 py-1.5 text-xs font-medium text-error-base transition-colors hover:bg-[rgba(239,68,68,0.1)]"
                                    >
                                      <Trash2 size={12} />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* .env.local Section */}
          {projectPath && (
            <div className="rounded-xl border border-border-base bg-surface-raised p-4">
              <h3 className="m-0 mb-1 text-sm font-semibold text-text-base">
                Project .env.local
              </h3>
              <p className="m-0 mb-3 text-xs text-text-muted">
                Sync your deploy key with the project for CLI tools
              </p>

              <div className="rounded-lg border border-border-base bg-surface-base p-3">
                {envLocalKey ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-medium text-text-base">
                        Key in .env.local
                      </div>
                      <div className="font-mono text-[11px] text-text-muted">
                        {getKeyPreview(envLocalKey)}
                      </div>
                    </div>
                    {deployment.cliDeployKey &&
                    envLocalKey === deployment.cliDeployKey ? (
                      <span className="flex items-center gap-1.5 text-xs text-success-base">
                        <Check size={14} />
                        Synced
                      </span>
                    ) : deployment.cliDeployKey ? (
                      <button
                        onClick={handleWriteToEnvLocal}
                        disabled={isWritingEnvLocal}
                        className="flex items-center gap-1.5 rounded-md border border-border-base bg-transparent px-2.5 py-1.5 text-xs font-medium text-warning-base transition-colors hover:bg-[rgba(234,179,8,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isWritingEnvLocal ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Update
                      </button>
                    ) : null}
                  </div>
                ) : deployment.cliDeployKey ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-text-muted">
                      No key in .env.local
                    </span>
                    <button
                      onClick={handleWriteToEnvLocal}
                      disabled={isWritingEnvLocal}
                      className="flex items-center gap-1.5 rounded-md border border-border-base bg-transparent px-2.5 py-1.5 text-xs font-medium text-text-base transition-colors hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isWritingEnvLocal ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Writing...
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Write to .env.local
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-[13px] text-text-muted">
                    No active deploy key to sync
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-error-base bg-[rgba(239,68,68,0.1)] p-3 text-[13px] text-error-base">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {keyToDelete && (
        <div
          className="fixed bottom-0 left-0 right-0 top-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
          onClick={() => setKeyToDelete(null)}
        >
          <div
            className="w-[90%] max-w-[400px] rounded-xl bg-background-base p-6 shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-3 text-base font-semibold text-text-base">
              Delete Deploy Key?
            </h3>
            <p className="m-0 mb-5 text-sm text-text-muted">
              Are you sure you want to delete "{keyToDelete.name}"?
              {keyToDelete.isActive &&
                " This is your currently active key and will be cleared from authentication."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setKeyToDelete(null)}
                className="cursor-pointer rounded-md border border-border-base bg-transparent px-4 py-2 text-[13px] font-medium text-text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteKey}
                className="cursor-pointer rounded-md border-none bg-error-base px-4 py-2 text-[13px] font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
