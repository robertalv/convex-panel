import { useNetworkTestsOptional } from "../../../contexts/NetworkTestContext";
import {
  Wifi,
  Globe,
  Radio,
  Server,
  RefreshCw,
  Check,
  X,
  Loader2,
  Clock,
  ExternalLink,
} from "lucide-react";
import type {
  TestResult,
  TestStatus,
} from "../../../contexts/NetworkTestContext";

// Network test endpoints (for display)
const ENDPOINTS = {
  websocket: "wss://warmhearted-reindeer-937.convex.cloud/api/1.27.3/sync",
  http: "https://warmhearted-reindeer-937.convex.site/ping",
  sse: "https://warmhearted-reindeer-937.convex.site/sse",
  proxiedWebsocket: "https://sse-ws-proxy-production.up.railway.app/messages",
} as const;

function StatusBadge({ status }: { status: TestStatus }) {
  const config = {
    pending: {
      bg: "var(--color-surface-raised)",
      text: "var(--color-text-muted)",
      label: "Pending",
    },
    running: {
      bg: "rgba(var(--color-brand-rgb), 0.1)",
      text: "var(--color-brand-base)",
      label: "Testing...",
    },
    success: {
      bg: "rgba(34, 197, 94, 0.1)",
      text: "#22c55e",
      label: "Connected",
    },
    error: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", label: "Failed" },
  }[status];

  const Icon = {
    pending: Clock,
    running: Loader2,
    success: Check,
    error: X,
  }[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "6px",
        backgroundColor: config.bg,
        fontSize: "11px",
        fontWeight: 500,
        color: config.text,
      }}
    >
      <Icon size={12} className={status === "running" ? "animate-spin" : ""} />
      {config.label}
    </div>
  );
}

interface TestCardProps {
  name: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
  result: TestResult;
  onRerun: () => void;
}

function TestCard({
  name,
  description,
  endpoint,
  icon,
  result,
  onRerun,
}: TestCardProps) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid var(--color-panel-border)",
        backgroundColor: "var(--color-panel-bg-secondary)",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "var(--color-panel-bg-tertiary)",
              color: "var(--color-panel-accent)",
            }}
          >
            {icon}
          </div>
          <div>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "2px",
              }}
            >
              {name}
            </h4>
            <p
              style={{
                fontSize: "11px",
                color: "var(--color-panel-text-secondary)",
              }}
            >
              {description}
            </p>
          </div>
        </div>
        <StatusBadge status={result.status} />
      </div>

      {/* Endpoint URL */}
      <div
        style={{
          marginTop: "12px",
          padding: "8px 10px",
          borderRadius: "6px",
          backgroundColor: "var(--color-panel-bg-tertiary)",
          fontSize: "10px",
          fontFamily: "monospace",
          color: "var(--color-panel-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {endpoint}
      </div>

      {/* Result Details */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {result.latency !== undefined && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-panel-text-muted)",
              }}
            >
              Latency:{" "}
              <strong style={{ color: "var(--color-panel-text)" }}>
                {result.latency}ms
              </strong>
            </span>
          )}
          {result.messagesReceived !== undefined && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-panel-text-muted)",
              }}
            >
              Messages:{" "}
              <strong style={{ color: "var(--color-panel-text)" }}>
                {result.messagesReceived}
              </strong>
            </span>
          )}
          {result.error && (
            <span style={{ fontSize: "11px", color: "#ef4444" }}>
              {result.error}
            </span>
          )}
          {result.lastRun && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-panel-text-muted)",
              }}
            >
              Last: {result.lastRun.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={onRerun}
          disabled={result.status === "running"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "var(--color-panel-bg-tertiary)",
            color:
              result.status === "running"
                ? "var(--color-panel-text-muted)"
                : "var(--color-panel-text)",
            fontSize: "11px",
            fontWeight: 500,
            cursor: result.status === "running" ? "not-allowed" : "pointer",
            opacity: result.status === "running" ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (result.status !== "running") {
              e.currentTarget.style.backgroundColor = "var(--color-panel-bg)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              "var(--color-panel-bg-tertiary)";
          }}
        >
          <RefreshCw
            size={12}
            className={result.status === "running" ? "animate-spin" : ""}
          />
          Re-test
        </button>
      </div>
    </div>
  );
}

export function NetworkSettings() {
  const networkTests = useNetworkTestsOptional();

  if (!networkTests) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-panel-text-muted)",
          fontSize: "13px",
        }}
      >
        Network testing is not available
      </div>
    );
  }

  const { tests, runAllTests, runTest, isRunning, overallStatus } =
    networkTests;

  const overallStatusConfig = {
    success: { color: "#22c55e", text: "All network tests passed" },
    error: { color: "#ef4444", text: "Network connectivity issues detected" },
    partial: { color: "#f59e0b", text: "Some network tests failed" },
    running: {
      color: "var(--color-brand-base)",
      text: "Running network tests...",
    },
    pending: {
      color: "var(--color-text-muted)",
      text: "Network tests pending",
    },
  }[overallStatus];

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
          padding: "0 16px",
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
          Network / Connectivity
        </h2>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "var(--color-brand-base)",
            color: "white",
            fontSize: "12px",
            fontWeight: 500,
            cursor: isRunning ? "not-allowed" : "pointer",
            opacity: isRunning ? 0.7 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.opacity = "0.9";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = isRunning ? "0.7" : "1";
          }}
        >
          <RefreshCw size={14} className={isRunning ? "animate-spin" : ""} />
          Run All Tests
        </button>
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
          {/* Overall Status Card */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${overallStatusConfig.color}20`,
              backgroundColor: `${overallStatusConfig.color}08`,
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: overallStatusConfig.color,
              }}
            />
            <div>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                  marginBottom: "2px",
                }}
              >
                {overallStatusConfig.text}
              </h3>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--color-panel-text-muted)",
                }}
              >
                Testing connectivity to Convex services using multiple protocols
              </p>
            </div>
          </div>

          {/* Test Cards */}
          <TestCard
            name="WebSocket (WSS)"
            description="Real-time bidirectional communication for sync"
            endpoint={ENDPOINTS.websocket}
            icon={<Wifi size={20} />}
            result={tests.websocket}
            onRerun={() => runTest("websocket")}
          />

          <TestCard
            name="HTTP/HTTPS"
            description="Standard HTTP requests for API calls"
            endpoint={ENDPOINTS.http}
            icon={<Globe size={20} />}
            result={tests.http}
            onRerun={() => runTest("http")}
          />

          <TestCard
            name="Server-Sent Events (SSE)"
            description="One-way real-time updates from server"
            endpoint={ENDPOINTS.sse}
            icon={<Radio size={20} />}
            result={tests.sse}
            onRerun={() => runTest("sse")}
          />

          <TestCard
            name="Proxied WebSocket"
            description="WebSocket connections through proxy server"
            endpoint={ENDPOINTS.proxiedWebsocket}
            icon={<Server size={20} />}
            result={tests.proxiedWebsocket}
            onRerun={() => runTest("proxiedWebsocket")}
          />

          {/* Help Link */}
          <div style={{ marginTop: "24px" }}>
            <a
              href="https://docs.convex.dev/production/hosting/troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--color-panel-accent)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Troubleshooting network issues
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
