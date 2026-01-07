import { useState, useEffect } from "react";
import {
  Key,
  ExternalLink,
  AlertCircle,
  Check,
  RefreshCw,
  FileText,
  Download,
} from "lucide-react";
import {
  listCachedDeploymentKeys,
  loadDeploymentKey,
} from "../lib/secureStorage";
import {
  readDeployKeyFromEnvLocal,
  writeDeployKeyToEnvLocal,
  getKeyPreview,
} from "../lib/envFile";

interface CachedKey {
  deploymentName: string;
  keyPreview: string;
}

interface DeployKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => Promise<void>;
  onRetryAutoGenerate?: () => Promise<void>;
  deploymentName?: string;
  teamSlug?: string | null;
  projectSlug?: string | null;
  /** Current cached key for this deployment (if any) */
  currentKey?: string | null;
  /** Project path for .env.local operations */
  projectPath?: string | null;
}

/**
 * Dialog for managing deploy keys.
 * Shows cached keys and allows manual entry as fallback.
 */
export function DeployKeyDialog({
  isOpen,
  onClose,
  onSave,
  onRetryAutoGenerate,
  deploymentName,
  teamSlug,
  projectSlug,
  currentKey,
  projectPath,
}: DeployKeyDialogProps) {
  const [manualKey, setManualKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedKeys, setCachedKeys] = useState<CachedKey[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [envLocalKey, setEnvLocalKey] = useState<string | null>(null);
  const [isWritingEnvLocal, setIsWritingEnvLocal] = useState(false);

  // Load cached keys and .env.local key when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCachedKeys();
      loadEnvLocalKey();
      setManualKey("");
      setError(null);
      setSuccessMessage(null);
      setShowManualEntry(false);
    }
  }, [isOpen, projectPath]);

  const loadCachedKeys = async () => {
    const keys = await listCachedDeploymentKeys();
    setCachedKeys(keys);
  };

  const loadEnvLocalKey = async () => {
    if (!projectPath) {
      setEnvLocalKey(null);
      return;
    }
    try {
      const key = await readDeployKeyFromEnvLocal(projectPath);
      setEnvLocalKey(key);
    } catch {
      setEnvLocalKey(null);
    }
  };

  if (!isOpen) return null;

  // Build dashboard URL for deploy key creation
  const getDashboardUrl = () => {
    if (teamSlug && projectSlug && deploymentName) {
      // Determine if dev or prod from deployment name pattern
      const isProd =
        deploymentName.includes("-prod-") ||
        deploymentName.endsWith("-prod") ||
        (!deploymentName.includes("-dev-") && !deploymentName.endsWith("-dev"));
      const deploymentType = isProd ? "production" : "development";
      return `https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/${deploymentType}/settings/deploy-key`;
    }
    return "https://dashboard.convex.dev";
  };

  const handleUseCachedKey = async (cachedDeploymentName: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const key = await loadDeploymentKey(cachedDeploymentName);
      if (key) {
        await onSave(key);
        onClose();
      } else {
        setError("Cached key not found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load cached key",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryAutoGenerate = async () => {
    if (!onRetryAutoGenerate) return;

    setIsRetrying(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await onRetryAutoGenerate();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to auto-generate deploy key",
      );
    } finally {
      setIsRetrying(false);
    }
  };

  const handleWriteToEnvLocal = async () => {
    if (!projectPath || !currentKey) {
      setError("No project path or deploy key available");
      return;
    }

    setIsWritingEnvLocal(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await writeDeployKeyToEnvLocal(projectPath, currentKey);
      setEnvLocalKey(currentKey);
      setSuccessMessage("Deploy key written to .env.local");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to write deploy key to .env.local",
      );
    } finally {
      setIsWritingEnvLocal(false);
    }
  };

  const handleUseEnvLocalKey = async () => {
    if (!envLocalKey) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await onSave(envLocalKey);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to use .env.local key",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManualKey = async () => {
    const trimmedKey = manualKey.trim();

    // Basic validation
    if (!trimmedKey) {
      setError("Please enter a deploy key");
      return;
    }

    // Deploy keys should match pattern: (dev|prod|preview):name|... or project:...|...
    if (
      !trimmedKey.includes("|") ||
      !/^(dev|prod|preview|project):/.test(trimmedKey)
    ) {
      setError(
        "Invalid deploy key format. Keys should start with dev:, prod:, preview:, or project: and contain a | character.",
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(trimmedKey);
      setManualKey("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save deploy key",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && showManualEntry) {
      e.preventDefault();
      handleSaveManualKey();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Filter cached keys to show the current deployment first, then others
  const currentDeploymentKey = cachedKeys.find(
    (k) => k.deploymentName === deploymentName,
  );
  const otherCachedKeys = cachedKeys.filter(
    (k) => k.deploymentName !== deploymentName,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-base border border-border-base rounded-xl shadow-2xl w-[500px] max-h-[600px] overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          data-tauri-drag-region
          className="h-10 bg-surface-raised flex items-center px-4 relative border-b border-border-base"
        >
          <div className="absolute left-2 flex gap-1.5">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              aria-label="Close"
            />
            <div className="w-3 h-3 rounded-full bg-surface-overlay" />
            <div className="w-3 h-3 rounded-full bg-surface-overlay" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            <Key size={14} className="text-text-muted" />
            <span className="text-sm font-medium text-text-base">
              Deploy Key
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Retry auto-generate option */}
          {onRetryAutoGenerate && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-base">
                Auto-generate Key
              </h3>
              <p className="text-xs text-text-muted">
                Try to automatically generate a deploy key using your OAuth
                credentials.
              </p>
              <button
                onClick={handleRetryAutoGenerate}
                disabled={isRetrying || isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-base text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Retry Auto-Generate
                  </>
                )}
              </button>
            </div>
          )}

          {/* Divider */}
          {onRetryAutoGenerate && (cachedKeys.length > 0 || true) && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-base" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border-base" />
            </div>
          )}

          {/* Cached keys for current deployment */}
          {currentDeploymentKey && currentKey && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-base">
                Current Cached Key
              </h3>
              <button
                onClick={() =>
                  handleUseCachedKey(currentDeploymentKey.deploymentName)
                }
                disabled={isSaving || isRetrying}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border-base bg-surface-raised hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
              >
                <Key size={16} className="text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-base truncate">
                    {currentDeploymentKey.deploymentName}
                  </div>
                  <div className="text-xs text-text-muted font-mono truncate">
                    {currentDeploymentKey.keyPreview}
                  </div>
                </div>
                <Check size={14} className="text-green-400 shrink-0" />
              </button>
            </div>
          )}

          {/* Other cached keys */}
          {otherCachedKeys.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-base">
                Other Cached Keys
              </h3>
              <p className="text-xs text-text-muted">
                Select a key from another deployment to use.
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {otherCachedKeys.map((cached) => (
                  <button
                    key={cached.deploymentName}
                    onClick={() => handleUseCachedKey(cached.deploymentName)}
                    disabled={isSaving || isRetrying}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-border-base bg-surface-raised hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
                  >
                    <Key size={14} className="text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-text-base truncate">
                        {cached.deploymentName}
                      </div>
                      <div className="text-xs text-text-muted font-mono truncate">
                        {cached.keyPreview}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* .env.local section */}
          {projectPath && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-text-base flex items-center gap-2">
                <FileText size={14} />
                Project .env.local
              </h3>

              {/* Show current key in .env.local */}
              {envLocalKey && (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted">
                    Found CONVEX_DEPLOY_KEY in your project's .env.local:
                  </p>
                  <button
                    onClick={handleUseEnvLocalKey}
                    disabled={isSaving || isRetrying}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border-base bg-surface-raised hover:bg-surface-overlay transition-colors text-left disabled:opacity-50"
                  >
                    <FileText size={16} className="text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-base">
                        Use key from .env.local
                      </div>
                      <div className="text-xs text-text-muted font-mono truncate">
                        {getKeyPreview(envLocalKey)}
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Write current key to .env.local */}
              {currentKey && (
                <div className="space-y-2">
                  {!envLocalKey ? (
                    <p className="text-xs text-text-muted">
                      Save the deploy key to your project for CLI tools:
                    </p>
                  ) : currentKey !== envLocalKey ? (
                    <p className="text-xs text-yellow-400">
                      Current key differs from .env.local. Update it:
                    </p>
                  ) : null}

                  {(!envLocalKey || currentKey !== envLocalKey) && (
                    <button
                      onClick={handleWriteToEnvLocal}
                      disabled={isWritingEnvLocal || isSaving || isRetrying}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg border border-border-base bg-surface-raised hover:bg-surface-overlay disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isWritingEnvLocal ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Writing...
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          {envLocalKey ? "Update" : "Write to"} .env.local
                        </>
                      )}
                    </button>
                  )}

                  {envLocalKey && currentKey === envLocalKey && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <Check size={12} />
                      .env.local is up to date
                    </p>
                  )}
                </div>
              )}

              {!envLocalKey && !currentKey && (
                <p className="text-xs text-text-muted">
                  No deploy key found in .env.local
                </p>
              )}
            </div>
          )}

          {/* Manual entry toggle */}
          {!showManualEntry ? (
            <button
              onClick={() => setShowManualEntry(true)}
              className="w-full text-sm text-brand-base hover:text-brand-hover transition-colors py-2"
            >
              Enter a deploy key manually
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-base">
                  Manual Entry
                </h3>
                <a
                  href={getDashboardUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-base hover:text-brand-hover transition-colors"
                >
                  <ExternalLink size={10} />
                  Get key from Dashboard
                </a>
              </div>
              <textarea
                id="deploy-key"
                value={manualKey}
                onChange={(e) => {
                  setManualKey(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="dev:my-deployment-123|ey..."
                className="w-full h-20 px-3 py-2 text-sm font-mono bg-surface-raised border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-base focus:border-transparent resize-none"
                autoFocus
              />
              <p className="text-xs text-text-muted">
                The deploy key starts with <code>dev:</code>, <code>prod:</code>
                , or <code>project:</code> and contains a <code>|</code>{" "}
                separator.
              </p>
              <button
                onClick={handleSaveManualKey}
                disabled={isSaving || isRetrying || !manualKey.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-base text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">...</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Save Key
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
              <span className="text-sm text-green-400">{successMessage}</span>
            </div>
          )}

          {/* Cancel button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border-base text-text-muted hover:text-text-base hover:bg-surface-raised transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeployKeyDialog;
