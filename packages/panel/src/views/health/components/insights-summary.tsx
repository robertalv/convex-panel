import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Card } from "../../../components/shared/card";
import { fetchInsights } from "../../../utils/api/health";
import type { Insight } from "../../../utils/api/types";
import { InsightsSummaryListItem } from "./insights-summary-list-item";
import { InsightBreakdownSheet } from "./insight-breakdown-sheet";
import { useInsightsPeriod } from "../../../utils/api/insights";
import { getTeamTokenFromEnv } from "../../../utils/api/utils";
import { getTokenDetails } from "../../../utils/api/teams";

export const InsightsSummary: React.FC<{
  deploymentUrl?: string;
  authToken: string;
  teamAccessToken?: string;
  useMockData?: boolean;
  container?: HTMLElement | null;
}> = ({
  deploymentUrl,
  authToken,
  teamAccessToken,
  useMockData = false,
  container,
}) => {
  const [insights, setInsights] = useState<Insight[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deploymentUrl || !authToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the same token fallback logic as backup-restore:
        // 1. teamAccessToken prop
        // 2. getTeamTokenFromEnv() (environment variable)
        // 3. authToken (fallback, might be project token)
        let token = teamAccessToken;
        if (!token) {
          const envToken = getTeamTokenFromEnv();
          if (envToken) {
            token = envToken;
          }
        }
        if (!token) {
          token = authToken;
        }

        if (!token) {
          setError(
            "No access token available. Please provide a team access token for insights.",
          );
          setLoading(false);
          return;
        }

        // Check token type BEFORE making insights calls (same as backup-restore)
        // If it's a project token, we need a team token for Big Brain API
        let isProjectToken = false;
        try {
          const tokenDetails = await getTokenDetails(token);
          isProjectToken = tokenDetails?.type === "projectToken";

          if (isProjectToken) {
            // Try to get team token from env one more time (in case it's available)
            const envTeamToken = getTeamTokenFromEnv();
            if (envTeamToken && envTeamToken !== token) {
              try {
                const envTokenDetails = await getTokenDetails(envTeamToken);
                if (
                  envTokenDetails?.type !== "projectToken" &&
                  envTokenDetails?.teamId
                ) {
                  token = envTeamToken;
                  isProjectToken = false;
                }
              } catch {
                // Environment token also failed, continue with error message
              }
            }

            // If still a project token, show error immediately with helpful instructions
            if (isProjectToken) {
              const envToken = getTeamTokenFromEnv();
              const envTokenAvailable = !!envToken;
              const isNext =
                typeof window !== "undefined" && (window as any).__NEXT_DATA__;
              const errorMsg = envTokenAvailable
                ? "Insights require a team access token. A project token was detected. " +
                  "The team token from CONVEX_ACCESS_TOKEN was found in the environment, but it may be a project token instead of a team token. " +
                  `Please ensure CONVEX_ACCESS_TOKEN in your .env file is a team access token (not a project token), or pass a team token via the \`teamAccessToken\` prop to ConvexPanel.`
                : "Insights require a team access token, but a project token is being used. " +
                  `Please provide a team access token by either: (1) Setting CONVEX_ACCESS_TOKEN in your .env file (for ${isNext ? "Next.js" : "Vite"} apps), or (2) Passing it via the \`teamAccessToken\` prop to ConvexPanel. ` +
                  "Note: CONVEX_ACCESS_TOKEN must be a team access token (not a project token).";
              setError(errorMsg);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          // Continue anyway - we'll see the error from the Big Brain API
        }

        const data = await fetchInsights(deploymentUrl, token, useMockData);
        if (mounted) {
          setInsights(data);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch insights";
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, teamAccessToken, useMockData]);

  const hasAnyInsights = insights && insights.length > 0;
  const period = useInsightsPeriod();

  // Get time range for display (last 72 hours)
  const getTimeRange = (): string => {
    const fromDate = new Date(period.from);
    const formatTime = (date: Date) => {
      return date.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: undefined,
        hour12: true,
      });
    };
    return `${formatTime(fromDate)} – Now`;
  };

  // Show error message if present
  if (error && !loading) {
    return (
      <Card
        title="Insights"
        action={
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-panel-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {getTimeRange()}
          </div>
        }
      >
        <div
          style={{
            padding: "16px",
            color: "var(--color-panel-error)",
            fontSize: "11px",
            lineHeight: "1.5",
          }}
        >
          {error}
        </div>
      </Card>
    );
  }

  if (!hasAnyInsights && !loading && insights !== undefined) {
    return (
      <Card
        title="Insights"
        action={
          <div
            style={{
              fontSize: "10px",
              color: "var(--color-panel-text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {getTimeRange()}
          </div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 16px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              backgroundColor:
                "color-mix(in srgb, var(--color-panel-success) 10%, transparent)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "10px",
              boxShadow:
                "0 0 0 1px color-mix(in srgb, var(--color-panel-success) 30%, transparent)",
            }}
          >
            <CheckCircle2 size={18} color="var(--color-panel-success)" />
          </div>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-panel-text)",
              marginBottom: "3px",
            }}
          >
            All clear!
          </h3>
          <p
            style={{
              color: "var(--color-panel-text-secondary)",
              marginBottom: "10px",
              fontSize: "11px",
              textAlign: "center",
            }}
          >
            There are no issues here to address.
          </p>
          <a
            href="https://docs.convex.dev/dashboard/deployments/health#insights"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-panel-accent)",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 500,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-panel-accent-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-panel-accent)";
            }}
          >
            <ExternalLink size={11} /> Learn more about Insights
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Insights"
      action={
        <div
          style={{
            fontSize: "10px",
            color: "var(--color-panel-text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {getTimeRange()}
        </div>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            minWidth: "fit-content",
            gap: "8px",
            borderBottom: "1px solid var(--color-panel-border)",
            padding: "6px",
            fontSize: "10px",
            color: "var(--color-panel-text-secondary)",
          }}
        >
          <p style={{ minWidth: "60px" }}>Severity</p>
          <p style={{ minWidth: "180px", flex: 1 }}>Function</p>
          <p style={{ minWidth: "160px", flex: 1 }}>Problem</p>
          <p style={{ minWidth: "140px" }}>Chart</p>
        </div>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: "8px",
                  borderBottom: "1px solid var(--color-panel-border)",
                  padding: "6px",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "20px",
                    backgroundColor: "var(--color-panel-border)",
                    borderRadius: "4px",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                <div
                  style={{
                    minWidth: "180px",
                    flex: 1,
                    height: "14px",
                    backgroundColor: "var(--color-panel-border)",
                    borderRadius: "4px",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                <div
                  style={{
                    minWidth: "160px",
                    flex: 1,
                    height: "28px",
                    backgroundColor: "var(--color-panel-border)",
                    borderRadius: "4px",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
                <div
                  style={{
                    minWidth: "140px",
                    height: "28px",
                    backgroundColor: "var(--color-panel-border)",
                    borderRadius: "4px",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {!loading && insights && (
          <div
            style={{ display: "flex", width: "100%", flexDirection: "column" }}
          >
            {insights.map((insight, idx) => (
              <InsightsSummaryListItem
                key={idx}
                insight={insight}
                onSelect={setSelectedInsight}
              />
            ))}
          </div>
        )}
      </div>

      {/* Breakdown Sheet */}
      <InsightBreakdownSheet
        isOpen={selectedInsight !== null}
        onClose={() => setSelectedInsight(null)}
        insight={selectedInsight}
        container={container || containerRef.current}
      />
    </Card>
  );
};
