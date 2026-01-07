import { useState, useEffect } from "react";
import {
  Key,
  Loader2,
  RefreshCw,
  ExternalLink,
  Check,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useMcpOptional } from "../../../contexts/McpContext";
import { useDeployment } from "../../../contexts/DeploymentContext";
import {
  readDeployKeyFromEnvLocal,
  writeDeployKeyToEnvLocal,
  getKeyPreview,
} from "../../../lib/envFile";

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

export function DeployKeySettings() {
  const mcp = useMcpOptional();
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

  const deploymentType = getDeploymentType(deployment.deployment?.name);
  const isNonProd = deploymentType !== "prod";

  // Load .env.local key
  useEffect(() => {
    if (mcp?.projectPath) {
      readDeployKeyFromEnvLocal(mcp.projectPath)
        .then(setEnvLocalKey)
        .catch(() => setEnvLocalKey(null));
    }
  }, [mcp?.projectPath]);

  const handleWriteToEnvLocal = async () => {
    if (!mcp?.projectPath || !deployment.cliDeployKey) return;

    setIsWritingEnvLocal(true);
    setDeployKeyMessage(null);

    try {
      await writeDeployKeyToEnvLocal(mcp.projectPath, deployment.cliDeployKey);
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
          Deploy Key
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
        <div style={{ maxWidth: "600px" }}>
          {/* Current Key Status */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Current Deploy Key
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              Authentication for Convex CLI commands in the terminal
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
                              ? "Manual Key"
                              : "Authenticated"
                            : "No Key"}
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
                    onClick={deployment.regenerateDeployKey}
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
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(99, 102, 241, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(99, 102, 241, 0.1)";
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

          {/* .env.local Section */}
          {mcp?.projectPath && (
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

                {deployKeyMessage && (
                  <div
                    style={{
                      marginTop: "12px",
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
                          deployKeyMessage.type === "success"
                            ? "#22c55e"
                            : "#ef4444",
                      }}
                    >
                      {deployKeyMessage.text}
                    </p>
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
              If auto-generation fails, paste a deploy key from the Convex
              Dashboard
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
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Get Deploy Key from Dashboard
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              Create a deploy key directly from the Convex Dashboard
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
        </div>
      </div>
    </div>
  );
}
