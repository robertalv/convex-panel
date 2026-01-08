import React from "react";

export type MetricHealth = "healthy" | "warning" | "error";

interface BigMetricProps {
  health?: MetricHealth;
  metric: string;
  children?: React.ReactNode;
}

export const BigMetric: React.FC<BigMetricProps> = ({
  health,
  metric,
  children,
}) => {
  const getHealthColor = () => {
    switch (health) {
      case "healthy":
        return "var(--color-panel-success)";
      case "warning":
        return "var(--color-panel-warning)";
      case "error":
        return "var(--color-panel-error)";
      default:
        return "var(--color-panel-text)";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: "100px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px",
      }}
    >
      <div
        style={{
          fontSize: "clamp(24px, 6vw, 36px)",
          fontWeight: 600,
          color: getHealthColor(),
          textAlign: "center",
        }}
      >
        {metric}
      </div>
      <div
        style={{
          maxHeight: "36px",
          minHeight: "20px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
          color: "var(--color-panel-text-secondary)",
          fontSize: "11px",
          lineHeight: "1.4",
        }}
      >
        {children}
      </div>
    </div>
  );
};
