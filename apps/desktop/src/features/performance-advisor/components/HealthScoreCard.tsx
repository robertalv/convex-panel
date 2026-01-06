/**
 * HealthScoreCard Component
 * Displays the overall health score with visual indicator
 */

import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SchemaHealth } from "../../schema-visualizer/types";

interface HealthScoreCardProps {
  health: SchemaHealth;
  previousScore?: number;
}

export function HealthScoreCard({
  health,
  previousScore,
}: HealthScoreCardProps) {
  const { score, warnings, tableCount, relationshipCount, indexCount } = health;

  const scoreColor =
    score >= 80
      ? "var(--color-success-base)"
      : score >= 60
        ? "var(--color-warning-base)"
        : "var(--color-error-base)";

  const warningCount = warnings.filter((w) => w.severity === "warning").length;
  const errorCount = warnings.filter((w) => w.severity === "error").length;
  const infoCount = warnings.filter((w) => w.severity === "info").length;

  const scoreDiff =
    previousScore !== undefined ? score - previousScore : undefined;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "24px",
        padding: "20px",
        backgroundColor: "var(--color-surface-base)",
        borderRadius: "12px",
        border: "1px solid var(--color-border-base)",
      }}
    >
      {/* Score Circle */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100px",
            height: "100px",
          }}
        >
          {/* Background circle */}
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--color-border-base)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 283} 283`}
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          {/* Score text */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                marginTop: "2px",
              }}
            >
              / 100
            </span>
          </div>
        </div>

        {/* Score trend */}
        {scoreDiff !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color:
                scoreDiff > 0
                  ? "var(--color-success-base)"
                  : scoreDiff < 0
                    ? "var(--color-error-base)"
                    : "var(--color-text-muted)",
            }}
          >
            {scoreDiff > 0 ? (
              <TrendingUp size={14} />
            ) : scoreDiff < 0 ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>
              {scoreDiff > 0 ? "+" : ""}
              {scoreDiff} pts
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-text-base)",
              marginBottom: "4px",
            }}
          >
            Schema Health Score
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            {score >= 80
              ? "Your schema is well-optimized."
              : score >= 60
                ? "Some improvements recommended."
                : "Several issues need attention."}
          </p>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          <MetricBadge label="Tables" value={tableCount} />
          <MetricBadge label="Indexes" value={indexCount} />
          <MetricBadge label="Relationships" value={relationshipCount} />
        </div>

        {/* Warning Summary */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {errorCount > 0 && (
            <WarningBadge count={errorCount} severity="error" label="Errors" />
          )}
          {warningCount > 0 && (
            <WarningBadge
              count={warningCount}
              severity="warning"
              label="Warnings"
            />
          )}
          {infoCount > 0 && (
            <WarningBadge
              count={infoCount}
              severity="info"
              label="Suggestions"
            />
          )}
          {warnings.length === 0 && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--color-success-base)",
              }}
            >
              <Activity size={14} />
              No issues found
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        backgroundColor: "var(--color-surface-secondary)",
        borderRadius: "6px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--color-text-base)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginTop: "2px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function WarningBadge({
  count,
  severity,
  label,
}: {
  count: number;
  severity: "error" | "warning" | "info";
  label: string;
}) {
  const colors = {
    error: {
      bg: "var(--color-error-bg)",
      text: "var(--color-error-base)",
    },
    warning: {
      bg: "var(--color-warning-bg)",
      text: "var(--color-warning-base)",
    },
    info: {
      bg: "var(--color-info-bg)",
      text: "var(--color-info-base)",
    },
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        backgroundColor: colors[severity].bg,
        borderRadius: "12px",
        fontSize: "12px",
        color: colors[severity].text,
        fontWeight: 500,
      }}
    >
      <span>{count}</span>
      <span>{label}</span>
    </div>
  );
}
