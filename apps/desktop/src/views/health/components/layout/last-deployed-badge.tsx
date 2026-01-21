import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { formatDistanceToNow, isValid } from "date-fns";
import { useState, useEffect } from "react";

interface LastDeployedBadgeProps {
  lastDeployed: Date | null;
  isLoading?: boolean;
  version?: string | null;
  versionLoading?: boolean;
  hasUpdate?: boolean;
  latestVersion?: string;
  showIcon?: boolean;
  size?: "sm" | "md";
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

  const [desktopVersion, setDesktopVersion] = useState<string | null>(null);
  const [desktopHasUpdate, setDesktopHasUpdate] = useState(false);
  const [desktopLatestVersion, setDesktopLatestVersion] = useState<string>();

  const currentDesktopVersion =
    typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null;

  useEffect(() => {
    if (!currentDesktopVersion) return;

    setDesktopVersion(currentDesktopVersion);

    let isMounted = true;

    async function checkDesktopVersion() {
      try {
        const REPO_OWNER = "robertalv";
        const REPO_NAME = "convex-panel";
        const response = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
        );
        if (!response.ok) return;

        const data = await response.json();
        if (!isMounted) return;

        const latestTag = data.tag_name || data.name || "";
        const latestVersion = latestTag.replace(/^v/, "");

        if (!latestVersion) return;

        setDesktopLatestVersion(latestVersion);

        if (currentDesktopVersion && latestVersion) {
          const currentParts = currentDesktopVersion.split(".").map(Number);
          const latestParts = latestVersion.split(".").map(Number);

          if (currentParts.length >= 2 && latestParts.length >= 2) {
            const isHigherMajor = latestParts[0] > currentParts[0];
            const isHigherMinor =
              latestParts[0] === currentParts[0] &&
              latestParts[1] > currentParts[1];
            const hasNewVersion = isHigherMajor || isHigherMinor;
            setDesktopHasUpdate(hasNewVersion);
          }
        }
      } catch {
        // Silently fail errors
      }
    }

    void checkDesktopVersion();

    return () => {
      isMounted = false;
    };
  }, [currentDesktopVersion]);

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

  const getDesktopUpdateType = (): string => {
    if (!desktopVersion || !desktopLatestVersion) return "";
    const currentMajor = desktopVersion.split(".")[0];
    const latestMajor = desktopLatestVersion.split(".")[0];
    const currentMinor = desktopVersion.split(".")[1];
    const latestMinor = desktopLatestVersion.split(".")[1];

    if (latestMajor !== currentMajor) return "major";
    if (latestMinor !== currentMinor) return "minor";
    return "patch";
  };

  const normalizedLastDeployed: Date | null = (() => {
    if (!lastDeployed) return null;
    if (lastDeployed instanceof Date) {
      return isValid(lastDeployed) ? lastDeployed : null;
    }
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
        <Icon name="clock" size={iconSize} style={{ opacity: 0.6 }} />
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
            <Icon name="checkmark-circle" size={iconSize} />
          ) : (
            <Icon name="rocket" size={iconSize} />
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
                  <Icon name="arrow-up" size={12} />
                </a>
              )}
            </>
          )}
        </div>
      )}

      {/* Desktop app version section */}
      {desktopVersion && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
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
            Panel v{desktopVersion}
          </span>
          {desktopHasUpdate && desktopLatestVersion && (
            <a
              href="https://github.com/robertalv/convex-panel/releases/latest"
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
              title={`A ${getDesktopUpdateType()} update is available (${desktopVersion} → ${desktopLatestVersion})`}
            >
              <Icon name="arrow-up" size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
