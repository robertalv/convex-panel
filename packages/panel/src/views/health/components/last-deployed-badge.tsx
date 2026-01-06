import React, { useState, useEffect } from "react";
import { ArrowUp, Rocket } from "lucide-react";
import { TimestampDistance } from "./timestamp-distance";
import {
  fetchLastPushEvent,
  fetchServerVersion,
} from "../../../utils/api/health";

interface LastDeployedBadgeProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

export const LastDeployedBadge: React.FC<LastDeployedBadgeProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [lastDeployed, setLastDeployed] = useState<Date | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>();

  useEffect(() => {
    if (!deploymentUrl || !authToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [pushEvent, serverVersion] = await Promise.all([
          fetchLastPushEvent(deploymentUrl, authToken, useMockData),
          fetchServerVersion(deploymentUrl, authToken, useMockData),
        ]);

        if (!mounted) return;

        if (pushEvent && pushEvent._creationTime) {
          setLastDeployed(new Date(pushEvent._creationTime));
        } else {
          setLastDeployed(null);
        }

        setVersion(serverVersion);
      } catch {
        // Silently fail for header badge
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, useMockData]);

  useEffect(() => {
    if (!version) return;

    let isMounted = true;

    async function checkVersion() {
      try {
        const response = await fetch(
          "https://registry.npmjs.org/convex/latest",
        );
        if (!response.ok) return;

        const data = await response.json();
        if (!isMounted) return;

        setLatestVersion(data.version);

        if (version && data.version) {
          const currentParts = version.split(".").map(Number);
          const latestParts = data.version.split(".").map(Number);

          if (currentParts.length === 3 && latestParts.length === 3) {
            const isHigherMajor = latestParts[0] > currentParts[0];
            const isHigherMinor =
              latestParts[0] === currentParts[0] &&
              latestParts[1] > currentParts[1];
            const hasNewVersion = isHigherMajor || isHigherMinor;
            setHasUpdate(hasNewVersion);
          }
        }
      } catch {
        // Swallow errors
      }
    }

    void checkVersion();

    return () => {
      isMounted = false;
    };
  }, [version]);

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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          color: "var(--color-panel-text-muted)",
        }}
      >
        <Rocket size={14} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--color-panel-text-secondary)",
        }}
      >
        <Rocket size={14} style={{ color: "var(--color-panel-text-muted)" }} />
        <span style={{ color: "var(--color-panel-text-muted)" }}>Deployed</span>
        {lastDeployed ? (
          <TimestampDistance date={lastDeployed} live compact />
        ) : (
          <span>Never</span>
        )}
      </div>

      {version && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-panel-text-secondary)",
              fontFamily: "monospace",
              backgroundColor: "var(--color-panel-bg-tertiary)",
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
        </div>
      )}
    </div>
  );
};
