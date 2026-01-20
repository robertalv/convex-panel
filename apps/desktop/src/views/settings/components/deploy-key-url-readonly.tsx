import { useState } from "react";
import { Copy, Check, Info } from "lucide-react";
import { useDeployment } from "../../../contexts/deployment-context";
import { getHttpActionsUrl } from "../../../lib/deployKeyAuth";

/**
 * Read-only view of deployment URL and HTTP Actions URL for deploy key mode
 * This is a simplified version of UrlDeployKey that doesn't show deploy key management
 */
export function DeployKeyUrlReadOnly() {
  const deployment = useDeployment();
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const deploymentUrl = deployment.deploymentUrl || "";
  const httpActionsUrl = deploymentUrl
    ? getHttpActionsUrl(deploymentUrl)
    : "";

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(identifier);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Header */}
      <div className="flex h-[49px] items-center justify-between border-b border-border-base bg-background-base px-2">
        <h2 className="m-0 text-sm font-bold text-text-base">
          Deployment Settings
        </h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="flex w-full max-w-[600px] flex-col gap-6">
          {/* Info Notice */}
          <div className="flex items-start gap-3 rounded-lg border border-brand-base/30 bg-brand-base/5 p-4">
            <Info size={20} className="mt-0.5 shrink-0 text-brand-base" />
            <div>
              <p className="m-0 mb-1 text-[13px] font-semibold text-brand-base">
                Deploy Key Mode
              </p>
              <p className="m-0 text-xs text-text-muted">
                You&apos;re connected via deploy key. This view shows read-only
                deployment information. Sign in with Convex for full access to
                all settings.
              </p>
            </div>
          </div>

          {/* Deployment URL Section */}
          <div className="rounded-xl border border-border-base bg-surface-raised p-4">
            <div className="flex flex-col gap-2">
              <h3 className="m-0 text-sm font-semibold text-text-base">
                Deployment URL
              </h3>
              <p className="m-0 text-[13px] text-text-muted">
                This Convex deployment is hosted at the following URL. Configure
                a production Convex client with this URL.
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
          </div>

          {/* HTTP Actions URL Section */}
          {httpActionsUrl && (
            <div className="rounded-xl border border-border-base bg-surface-raised p-4">
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-sm font-semibold text-text-base">
                  HTTP Actions URL
                </h3>
                <p className="m-0 text-[13px] text-text-muted">
                  This Convex deployment hosts{" "}
                  <a
                    href="https://docs.convex.dev/functions/http-actions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-base no-underline hover:underline"
                  >
                    HTTP Actions
                  </a>{" "}
                  at the following URL. In Convex functions, this is available
                  as <code className="text-xs">process.env.CONVEX_SITE_URL</code>.
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
            </div>
          )}

          {/* Connected Deployment Info */}
          <div className="rounded-xl border border-border-base bg-surface-raised p-4">
            <h3 className="m-0 mb-3 text-sm font-semibold text-text-base">
              Connected Deployment
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Deployment Name</span>
                <span className="font-mono text-xs text-text-base">
                  {deployment.deployment?.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Auth Mode</span>
                <span className="rounded bg-surface-overlay px-2 py-0.5 text-xs font-medium text-text-muted">
                  Deploy Key
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
