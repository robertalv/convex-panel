import { cn } from "@/lib/utils";
import { Rocket, Clock, CheckCircle2, ArrowUp } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";

interface LastDeployedBadgeProps {
  /** Last deployment date */
  lastDeployed: Date | null;
  /** Whether deployment data is loading */
  isLoading?: boolean;
  /** Convex server version */
  version?: string | null;
  /** Whether version data is loading */
  versionLoading?: boolean;
  /** Whether an update is available */
  hasUpdate?: boolean;
  /** Latest available version */
  latestVersion?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge showing the last deployment time and version info.
 * Styled with inline CSS variables to match the desktop app patterns.
 */
export function LastDeployedBadge({
  lastDeployed,
  isLoading = false,
  version,
  versionLoading = false,
  hasUpdate = false,
  latestVersion,
  showIcon = true,
  size = "md",
  className,
}: LastDeployedBadgeProps) {
  const iconSize = size === "sm" ? 12 : 14;
  const fontSize = size === "sm" ? "12px" : "13px";

  const getUpdateType = (): string => {
    if (!version || !latestVersion) return "";
    const currentMajor = version.split(".")[0];
    const latestMajor = latestVersion.split(".")[0];
    const currentMinor = version.split(".")[1];
    const latestMinor = latestVersion.split(".")[1];

    if (latestMajor !== currentMajor) return "major";
    if (latestMinor !== currentMinor) return "minor";
    return "patch";
  };

  // Normalize lastDeployed into a safe Date instance (or null)
  const normalizedLastDeployed: Date | null = (() => {
    if (!lastDeployed) return null;
    // Already a Date and valid
    if (lastDeployed instanceof Date) {
      return isValid(lastDeployed) ? lastDeployed : null;
    }
    // Handle unexpected runtime types (e.g. string or number)
    const candidate = new Date(lastDeployed as any);
    return isValid(candidate) ? candidate : null;
  })();

  if (isLoading) {
    return (
      <span
        className={cn(className)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize,
          color: "var(--color-text-muted)",
        }}
      >
        <Clock size={iconSize} style={{ opacity: 0.6 }} />
        <span style={{ opacity: 0.6 }}>Loading...</span>
      </span>
    );
  }

  const timeAgo = normalizedLastDeployed
    ? formatDistanceToNow(normalizedLastDeployed, { addSuffix: true })
    : null;
  const isRecent = normalizedLastDeployed
    ? Date.now() - normalizedLastDeployed.getTime() < 60 * 60 * 1000
    : false; // Less than 1 hour

  return (
    <div
      className={cn(className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Deployment time section */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize,
          color: isRecent
            ? "var(--color-success-base)"
            : "var(--color-text-muted)",
        }}
        title={
          normalizedLastDeployed
            ? `Last deployed: ${normalizedLastDeployed.toLocaleString()}`
            : ""
        }
      >
        {showIcon &&
          (isRecent ? (
            <CheckCircle2 size={iconSize} />
          ) : (
            <Rocket size={iconSize} />
          ))}
        {normalizedLastDeployed ? (
          <span>Deployed {timeAgo}</span>
        ) : (
          <span>No deployments</span>
        )}
      </span>

      {/* Version section */}
      {(version || versionLoading) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {versionLoading ? (
            <span
              style={{
                fontSize: size === "sm" ? "11px" : "12px",
                color: "var(--color-text-muted)",
                opacity: 0.6,
              }}
            >
              ...
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: size === "sm" ? "11px" : "12px",
                  color: "var(--color-text-secondary)",
                  fontFamily: "monospace",
                  backgroundColor: "var(--color-surface-raised)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                v{version}
              </span>
              {hasUpdate && latestVersion && (
                <a
                  href="https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md#changelog"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "20px",
                    height: "20px",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    borderRadius: "4px",
                    color: "#10B981",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  title={`A ${getUpdateType()} update is available (${version} → ${latestVersion})`}
                >
                  <ArrowUp size={12} />
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
