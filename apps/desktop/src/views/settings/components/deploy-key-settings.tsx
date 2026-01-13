import { useState, useEffect } from "react";
import {
  Key,
  Loader2,
  RefreshCw,
  ExternalLink,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useDeployment } from "../../../contexts/deployment-context";
import {
  readDeployKeyFromEnvLocal,
  writeDeployKeyToEnvLocal,
  getKeyPreview,
} from "../../../lib/envFile";
import { useProjectPathOptional } from "../../../contexts/project-path-context";
import {
  getDeploymentAccessTokens,
  createAccessToken,
  deleteAccessToken,
  type AccessToken,
} from "../../../api/bigbrain";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";

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

export function DeployKeySettings() {
  const projectPathContext = useProjectPathOptional();
  const projectPath = projectPathContext?.projectPath ?? null;
  const deployment = useDeployment();

  const [envLocalKey, setEnvLocalKey] = useState<string | null>(null);
  const [isWritingEnvLocal, setIsWritingEnvLocal] = useState(false);
  const [deployKeyMessage, setDeployKeyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState("");
  const [manualKeyError, setManualKeyError] = useState<string | null>(null);
  const [isSavingManualKey, setIsSavingManualKey] = useState(false);

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

  const deploymentType = getDeploymentType(deployment.deployment?.name);
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
    if (
      !deployment.accessToken ||
      !deployment.deployment?.name ||
      !deployment.fetchFn
    ) {
      setApiKeys([]);
      return;
    }

    setIsLoadingKeys(true);
    try {
      const tokens = await getDeploymentAccessTokens(
        deployment.accessToken,
        deployment.deployment.name,
        deployment.fetchFn,
      );
      setApiKeys(tokens);
    } catch (err) {
      console.error("[DeployKeySettings] Failed to load API keys:", err);
      setApiKeys([]);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const handleCreateKey = async () => {
    // Prevent multiple simultaneous key creations
    if (isCreatingKey || deployment.cliDeployKeyLoading) {
      console.log("[DeployKeySettings] Key creation already in progress, skipping");
      return;
    }

    if (
      !deployment.accessToken ||
      !deployment.deployment ||
      !deployment.fetchFn ||
      !deployment.teamId
    ) {
      setDeployKeyMessage({
        type: "error",
        text: "Missing required information to create deploy key",
      });
      return;
    }

    const trimmedName = newKeyName.trim();
    if (!trimmedName) {
      return;
    }

    setIsCreatingKey(true);
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
      setDeployKeyMessage({
        type: "success",
        text: "Deploy key created and activated",
      });
    } catch (err) {
      setDeployKeyMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create key",
      });
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
        setDeployKeyMessage({
          type: "success",
          text: "Deploy key deleted and cleared from authentication",
        });
      } else {
        setDeployKeyMessage({
          type: "success",
          text: "Deploy key deleted",
        });
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
      setDeployKeyMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete key",
      });
      setDeletingKeyId(null);
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleSelectKey = async (serializedToken: string) => {
    if (!deployment.deployment?.name) {
      setDeployKeyMessage({
        type: "error",
        text: "No deployment selected",
      });
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
      setDeployKeyMessage({
        type: "success",
        text: "Deploy key activated",
      });
    } catch (err) {
      setDeployKeyMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to activate key",
      });
    }
  };

  const handleWriteToEnvLocal = async () => {
    if (!projectPath || !deployment.cliDeployKey) return;

    setIsWritingEnvLocal(true);
    setDeployKeyMessage(null);

    try {
      await writeDeployKeyToEnvLocal(projectPath, deployment.cliDeployKey);
      setEnvLocalKey(deployment.cliDeployKey);
      setDeployKeyMessage({
        type: "success",
        text: "Deploy key written to .env.local",
      });
    } catch (err) {
      setDeployKeyMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to write deploy key",
      });
    } finally {
      setIsWritingEnvLocal(false);
    }
  };

  const handleRegenerateKey = async () => {
    // Prevent multiple simultaneous regenerations
    if (deployment.cliDeployKeyLoading) {
      console.log("[DeployKeySettings] Key regeneration already in progress, skipping");
      return;
    }

    try {
      await deployment.regenerateDeployKey();

      // Reload the API keys list to show the newly created key
      await loadApiKeys();

      setDeployKeyMessage({
        type: "success",
        text: "Deploy key regenerated successfully",
      });
    } catch (err) {
      // Error handling is already done in regenerateDeployKey
      // Just reload keys in case a new key was created before error
      await loadApiKeys();
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-panel-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "49px",
          borderBottom: "1px solid var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-panel-text)",
            margin: 0,
          }}
        >
          Deploy Keys
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        <div style={{ maxWidth: "700px" }}>
          {/* Current Active Key Status */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Active Deploy Key
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              Currently active key for CLI commands in the terminal
            </p>

            {/* Status Card */}
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--color-panel-border)",
                backgroundColor: "var(--color-panel-bg-secondary)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: deployment.cliDeployKeyError
                        ? "#ef4444"
                        : deployment.cliDeployKeyLoading
                          ? "#eab308"
                          : deployment.cliDeployKey
                            ? "#22c55e"
                            : "#6b7280",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--color-panel-text)",
                      }}
                    >
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
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-panel-text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {getKeyPreview(deployment.cliDeployKey)}
                      </div>
                    )}
                  </div>
                </div>
                {!deployment.cliDeployKeyLoading && (
                  <button
                    onClick={handleRegenerateKey}
                    disabled={deployment.cliDeployKeyLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: deployment.cliDeployKeyLoading
                        ? "rgba(99, 102, 241, 0.3)"
                        : "rgba(99, 102, 241, 0.1)",
                      color: "#6366f1",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: deployment.cliDeployKeyLoading
                        ? "not-allowed"
                        : "pointer",
                      opacity: deployment.cliDeployKeyLoading ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!deployment.cliDeployKeyLoading) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(99, 102, 241, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!deployment.cliDeployKeyLoading) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(99, 102, 241, 0.1)";
                      }
                    }}
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                )}
              </div>

              {deployment.cliDeployKeyError && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#ef4444",
                    }}
                  >
                    {deployment.cliDeployKeyError}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* API Deploy Keys Management */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                  margin: 0,
                }}
              >
                Manage Deploy Keys
              </h3>
              <button
                onClick={() => setShowCreateDialog(true)}
                disabled={
                  isLoadingKeys || !deployment.accessToken || !deployment.teamId
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  color: "#6366f1",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor:
                    !deployment.accessToken || !deployment.teamId
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !deployment.accessToken || !deployment.teamId ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (deployment.accessToken && deployment.teamId) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(99, 102, 241, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(99, 102, 241, 0.1)";
                }}
              >
                <Plus size={14} />
                Create New Key
              </button>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              Deploy keys from your Convex dashboard for this deployment
            </p>

            {/* Create Dialog */}
            {showCreateDialog && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #6366f1",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--color-panel-text)",
                    }}
                  >
                    Create New Deploy Key
                  </span>
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      setNewKeyName("");
                    }}
                    style={{
                      fontSize: "11px",
                      color: "var(--color-panel-text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My Desktop Key"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg)",
                    color: "var(--color-panel-text)",
                    fontSize: "12px",
                    outline: "none",
                    marginBottom: "12px",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-panel-border)";
                  }}
                />
                <button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || isCreatingKey}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      !newKeyName.trim() || isCreatingKey
                        ? "rgba(99, 102, 241, 0.3)"
                        : "#6366f1",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor:
                      !newKeyName.trim() || isCreatingKey
                        ? "not-allowed"
                        : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (newKeyName.trim() && !isCreatingKey) {
                      e.currentTarget.style.backgroundColor = "#5558dd";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newKeyName.trim() && !isCreatingKey) {
                      e.currentTarget.style.backgroundColor = "#6366f1";
                    }
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
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid var(--color-panel-border)",
                backgroundColor: "var(--color-panel-bg-secondary)",
                overflow: "hidden",
              }}
            >
              {isLoadingKeys ? (
                <div
                  style={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                  }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-panel-text-muted)",
                    }}
                  >
                    Loading keys...
                  </span>
                </div>
              ) : apiKeys.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  <Key
                    size={32}
                    style={{
                      color: "var(--color-panel-text-muted)",
                      opacity: 0.3,
                      margin: "0 auto 12px",
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "var(--color-panel-text-muted)",
                    }}
                  >
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
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            index < apiKeys.length - 1
                              ? "1px solid var(--color-panel-border)"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: isDeleted
                            ? "rgba(34, 197, 94, 0.05)"
                            : isActive
                              ? "rgba(34, 197, 94, 0.05)"
                              : "transparent",
                          opacity: isDeleted ? 0.7 : 1,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {isDeleting || isDeleted ? (
                          // Deleting/Deleted state
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                  style={{ color: "#6b7280" }}
                                />
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "var(--color-panel-text-muted)",
                                  }}
                                >
                                  Deleting...
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2
                                  size={16}
                                  style={{ color: "#22c55e" }}
                                />
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#22c55e",
                                  }}
                                >
                                  Deleted!
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          // Normal state
                          <>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "var(--color-panel-text)",
                                  }}
                                >
                                  {key.name}
                                </span>
                                {isActive && (
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "11px",
                                      color: "#22c55e",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                                    }}
                                  >
                                    <CheckCircle2 size={12} />
                                    Active
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-panel-text-muted)",
                                  fontFamily: "monospace",
                                  marginBottom: "4px",
                                }}
                              >
                                {getKeyPreview(key.serializedAccessToken)}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--color-panel-text-subtle)",
                                }}
                              >
                                {key.lastUsedTime
                                  ? `Last used: ${new Date(key.lastUsedTime).toLocaleDateString()}`
                                  : "Never used"}{" "}
                                • Created:{" "}
                                {new Date(
                                  key.creationTime,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              {!isActive && (
                                <button
                                  onClick={() =>
                                    handleSelectKey(key.serializedAccessToken)
                                  }
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                                    color: "#22c55e",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "rgba(34, 197, 94, 0.2)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "rgba(34, 197, 94, 0.1)";
                                  }}
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
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "none",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(239, 68, 68, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "rgba(239, 68, 68, 0.1)";
                                }}
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

          {/* .env.local Section */}
          {projectPath && (
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                  marginBottom: "8px",
                }}
              >
                Project .env.local
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-panel-text-secondary)",
                  marginBottom: "16px",
                }}
              >
                Sync your deploy key with the project for CLI tools
              </p>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                }}
              >
                {envLocalKey ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--color-panel-text)",
                        }}
                      >
                        Key in .env.local
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--color-panel-text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {getKeyPreview(envLocalKey)}
                      </div>
                    </div>
                    {deployment.cliDeployKey &&
                    envLocalKey === deployment.cliDeployKey ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "#22c55e",
                        }}
                      >
                        <Check size={14} />
                        Synced
                      </span>
                    ) : deployment.cliDeployKey ? (
                      <button
                        onClick={handleWriteToEnvLocal}
                        disabled={isWritingEnvLocal}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "rgba(234, 179, 8, 0.1)",
                          color: "#eab308",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: isWritingEnvLocal ? "not-allowed" : "pointer",
                          opacity: isWritingEnvLocal ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isWritingEnvLocal) {
                            e.currentTarget.style.backgroundColor =
                              "rgba(234, 179, 8, 0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(234, 179, 8, 0.1)";
                        }}
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
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text-muted)",
                      }}
                    >
                      No key in .env.local
                    </span>
                    {deployment.cliDeployKey && (
                      <button
                        onClick={handleWriteToEnvLocal}
                        disabled={isWritingEnvLocal}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                          color: "#6366f1",
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: isWritingEnvLocal ? "not-allowed" : "pointer",
                          opacity: isWritingEnvLocal ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isWritingEnvLocal) {
                            e.currentTarget.style.backgroundColor =
                              "rgba(99, 102, 241, 0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(99, 102, 241, 0.1)";
                        }}
                      >
                        {isWritingEnvLocal ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Key size={14} />
                        )}
                        Write to .env.local
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Non-prod Warning */}
          {isNonProd && deploymentType && (
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(234, 179, 8, 0.1)",
                  border: "1px solid rgba(234, 179, 8, 0.3)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <AlertTriangle
                  size={20}
                  style={{ color: "#eab308", flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#eab308",
                      marginBottom: "4px",
                    }}
                  >
                    {deploymentType === "dev"
                      ? "Development Deployment"
                      : "Preview Deployment"}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "var(--color-panel-text-secondary)",
                    }}
                  >
                    {deploymentType === "dev"
                      ? "This deploy key is for your development deployment. Data here is separate from production."
                      : "This deploy key is for a preview deployment. Preview deployments are temporary and may be deleted."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Key Entry */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Enter Deploy Key Manually
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              If auto-generation fails, paste a deploy key from an external
              source
            </p>

            {!showManualEntry ? (
              <button
                onClick={() => setShowManualEntry(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "transparent",
                  color: "var(--color-panel-text)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-bg-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Plus size={14} />
                Enter Key Manually
              </button>
            ) : (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--color-panel-text)",
                    }}
                  >
                    Paste your deploy key
                  </span>
                  <button
                    onClick={() => {
                      setShowManualEntry(false);
                      setManualKeyInput("");
                      setManualKeyError(null);
                    }}
                    style={{
                      fontSize: "11px",
                      color: "var(--color-panel-text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={manualKeyInput}
                  onChange={(e) => {
                    setManualKeyInput(e.target.value);
                    setManualKeyError(null);
                  }}
                  placeholder="prod:my-deployment|ey..."
                  style={{
                    width: "100%",
                    height: "80px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg)",
                    color: "var(--color-panel-text)",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    resize: "none",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-panel-border)";
                  }}
                />
                {manualKeyError && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "11px",
                      color: "#ef4444",
                    }}
                  >
                    {manualKeyError}
                  </p>
                )}
                <button
                  onClick={async () => {
                    const trimmedKey = manualKeyInput.trim();
                    if (!trimmedKey) {
                      setManualKeyError("Please enter a deploy key");
                      return;
                    }

                    // Basic validation
                    if (
                      !trimmedKey.includes("|") ||
                      !/^(dev|prod|preview|project):/.test(trimmedKey)
                    ) {
                      setManualKeyError(
                        "Invalid key format. Keys start with dev:, prod:, preview:, or project: and contain |",
                      );
                      return;
                    }

                    setIsSavingManualKey(true);
                    try {
                      await deployment.setManualDeployKey(trimmedKey);
                      setManualKeyInput("");
                      setShowManualEntry(false);
                      setManualKeyError(null);
                      setDeployKeyMessage({
                        type: "success",
                        text: "Manual deploy key activated",
                      });
                    } catch (err) {
                      setManualKeyError(
                        err instanceof Error
                          ? err.message
                          : "Failed to save key",
                      );
                    } finally {
                      setIsSavingManualKey(false);
                    }
                  }}
                  disabled={!manualKeyInput.trim() || isSavingManualKey}
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      !manualKeyInput.trim() || isSavingManualKey
                        ? "rgba(99, 102, 241, 0.3)"
                        : "#6366f1",
                    color: "white",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor:
                      !manualKeyInput.trim() || isSavingManualKey
                        ? "not-allowed"
                        : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (manualKeyInput.trim() && !isSavingManualKey) {
                      e.currentTarget.style.backgroundColor = "#5558dd";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (manualKeyInput.trim() && !isSavingManualKey) {
                      e.currentTarget.style.backgroundColor = "#6366f1";
                    }
                  }}
                >
                  {isSavingManualKey ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Key size={14} />
                      Save Deploy Key
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Dashboard Link */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Convex Dashboard
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              View and manage deploy keys in the Convex Dashboard
            </p>
            <a
              href={
                deployment.teamSlug &&
                deployment.projectSlug &&
                deployment.deployment?.name
                  ? `https://dashboard.convex.dev/t/${deployment.teamSlug}/${deployment.projectSlug}/${deploymentType === "prod" ? "production" : "development"}/settings/deploy-key`
                  : "https://dashboard.convex.dev"
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid var(--color-panel-border)",
                backgroundColor: "transparent",
                color: "var(--color-panel-text)",
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-panel-bg-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ExternalLink size={14} />
              Open Convex Dashboard
            </a>
          </div>

          {/* Messages */}
          {deployKeyMessage && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor:
                  deployKeyMessage.type === "success"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${
                  deployKeyMessage.type === "success"
                    ? "rgba(34, 197, 94, 0.3)"
                    : "rgba(239, 68, 68, 0.3)"
                }`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color:
                    deployKeyMessage.type === "success" ? "#22c55e" : "#ef4444",
                }}
              >
                {deployKeyMessage.text}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={handleDeleteKey}
        title="Delete Deploy Key"
        message={
          keyToDelete
            ? `Are you sure you want to delete "${keyToDelete.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
