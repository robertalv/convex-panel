import React from "react";
import { HelpCircle } from "lucide-react";
import type { Insight } from "../../../utils/api/types";
import { Tooltip } from "../../../components/shared/tooltip";

const formatNumberCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Constants from Convex reference
const documentsReadLimit = 32000;
const megabytesReadLimit = 16;

export interface ProblemForInsightProps {
  insight: Insight;
  /** Show expanded explanation (for breakdown sheet) */
  explain?: boolean;
}

export const ProblemForInsight: React.FC<ProblemForInsightProps> = ({
  insight,
  explain = false,
}) => {
  // Handle OCC insights
  if (
    insight.kind === "occRetried" ||
    insight.kind === "occFailedPermanently"
  ) {
    const isFailed = insight.kind === "occFailedPermanently";
    const occDetails = insight.details as {
      occCalls: number;
      occTableName?: string;
      hourlyCounts: any[];
      recentEvents: any[];
    };

    if (explain) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-panel-text)",
              lineHeight: "1.5",
            }}
          >
            {isFailed ? (
              <>
                This function <strong>failed permanently</strong> due to write
                conflicts. When multiple functions try to modify the same
                document simultaneously, Convex will retry them automatically.
                If a function exceeds the retry limit, it fails permanently with
                an OCC (Optimistic Concurrency Control) error.
              </>
            ) : (
              <>
                This function was <strong>retried</strong> due to write
                conflicts. When multiple functions try to modify the same
                document simultaneously, Convex automatically retries the
                conflicting function. While retries are handled transparently,
                frequent retries can impact performance.
              </>
            )}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            <strong>{formatNumberCompact(occDetails.occCalls || 0)}</strong>{" "}
            {isFailed ? "failure" : "retry"}
            {occDetails.occCalls === 1 ? "" : "s"} in{" "}
            {!occDetails.occTableName ? (
              "an unknown table"
            ) : (
              <>
                table <strong>{occDetails.occTableName}</strong>
              </>
            )}
          </div>
          <a
            href="https://docs.convex.dev/error#1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--color-panel-accent)",
              textDecoration: "none",
            }}
          >
            Learn more about write conflicts
          </a>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "4px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--color-panel-text)",
          }}
        >
          {isFailed ? "Failed" : "Retried"} due to write conflicts{" "}
          <Tooltip
            content={
              <>
                <a
                  href="https://docs.convex.dev/error#1"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  Learn more
                </a>{" "}
                about write conflicts.
              </>
            }
            position="right"
          >
            <HelpCircle
              size={12}
              style={{
                cursor: "help",
                color: "var(--color-panel-text-secondary)",
              }}
            />
          </Tooltip>
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-panel-text-secondary)",
            textAlign: "left",
          }}
        >
          {formatNumberCompact(occDetails.occCalls || 0)} time
          {occDetails.occCalls === 1 ? "" : "s"} in{" "}
          {!occDetails.occTableName ? (
            "an unknown table"
          ) : (
            <>
              table{" "}
              <span style={{ fontWeight: 600 }}>{occDetails.occTableName}</span>
            </>
          )}
        </span>
      </div>
    );
  }

  // Handle bytes read insights
  if (
    insight.kind === "bytesReadLimit" ||
    insight.kind === "bytesReadThreshold"
  ) {
    const bytesDetails = insight.details as {
      count: number;
      hourlyCounts: any[];
      recentEvents: any[];
    };

    if (explain) {
      const isLimit = insight.kind === "bytesReadLimit";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-panel-text)",
              lineHeight: "1.5",
            }}
          >
            {isLimit ? (
              <>
                This function has <strong>exceeded</strong> the Convex limit on
                bytes read. When a function reads more than {megabytesReadLimit}{" "}
                MB of data, it will fail. Consider optimizing your queries to
                read less data or paginating results.
              </>
            ) : (
              <>
                This function is <strong>approaching</strong> the Convex limit
                on bytes read. The limit is {megabytesReadLimit} MB per function
                call. Consider optimizing your queries before they start
                failing.
              </>
            )}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            <strong>{formatNumberCompact(bytesDetails.count || 0)}</strong>{" "}
            function call{(bytesDetails.count || 0) === 1 ? "" : "s"} affected
          </div>
          <a
            href="https://docs.convex.dev/production/state/limits"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--color-panel-accent)",
              textDecoration: "none",
            }}
          >
            Learn more about Convex limits
          </a>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "4px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--color-panel-text)",
          }}
        >
          Nearing bytes read limit
          <Tooltip
            content={`This function has been approaching or exceeding the Convex limit on bytes read. When a function exceeds the limit of ${megabytesReadLimit} MB, it will fail.`}
            position="right"
          >
            <HelpCircle
              size={12}
              style={{
                cursor: "help",
                color: "var(--color-panel-text-secondary)",
              }}
            />
          </Tooltip>
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-panel-text-secondary)",
          }}
        >
          {formatNumberCompact(bytesDetails.count || 0)} function call
          {(bytesDetails.count || 0) === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  // Handle documents read insights
  if (
    insight.kind === "documentsReadLimit" ||
    insight.kind === "documentsReadThreshold"
  ) {
    const docsDetails = insight.details as {
      count: number;
      hourlyCounts: any[];
      recentEvents: any[];
    };

    if (explain) {
      const isLimit = insight.kind === "documentsReadLimit";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "var(--color-panel-text)",
              lineHeight: "1.5",
            }}
          >
            {isLimit ? (
              <>
                This function has <strong>exceeded</strong> the Convex limit on
                documents read. When a function reads more than{" "}
                {documentsReadLimit.toLocaleString()} documents, it will fail.
                Consider adding indexes, filtering data, or paginating results.
              </>
            ) : (
              <>
                This function is <strong>approaching</strong> the Convex limit
                on documents read. The limit is{" "}
                {documentsReadLimit.toLocaleString()} documents per function
                call. Consider optimizing your queries before they start
                failing.
              </>
            )}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            <strong>{formatNumberCompact(docsDetails.count || 0)}</strong>{" "}
            function call{(docsDetails.count || 0) === 1 ? "" : "s"} affected
          </div>
          <a
            href="https://docs.convex.dev/production/state/limits"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--color-panel-accent)",
              textDecoration: "none",
            }}
          >
            Learn more about Convex limits
          </a>
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "4px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            color: "var(--color-panel-text)",
          }}
        >
          Nearing documents read limit
          <Tooltip
            content={`This function has been approaching or exceeding the Convex limit on documents read. When a function exceeds the limit of ${documentsReadLimit.toLocaleString()} documents, it will fail.`}
            position="right"
          >
            <HelpCircle
              size={12}
              style={{
                cursor: "help",
                color: "var(--color-panel-text-secondary)",
              }}
            />
          </Tooltip>
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-panel-text-secondary)",
          }}
        >
          {formatNumberCompact(docsDetails.count || 0)} function call
          {(docsDetails.count || 0) === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  // Fallback
  return (
    <span style={{ fontSize: "12px", color: "var(--color-panel-text)" }}>
      Unknown issue
    </span>
  );
};
