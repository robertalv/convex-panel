import React, { useMemo } from "react";
import type { Insight, HourlyCount } from "../../../utils/api/types";

export interface ChartForInsightProps {
  insight: Insight;
  height?: number;
}

const formatHourLabel = (hour: string): string => {
  try {
    const date = new Date(hour);
    const hours = date.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}${ampm}`;
  } catch {
    return hour;
  }
};

const formatTooltipLabel = (hour: string): string => {
  try {
    const date = new Date(hour);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return hour;
  }
};

// Simple SVG-based chart as fallback (doesn't require recharts)
const SimpleAreaChart: React.FC<{
  data: Array<{ hour: string; count: number }>;
  height: number;
  color: string;
}> = ({ data, height, color }) => {
  if (data.length === 0) return null;

  const padding = 4;
  const chartHeight = height - padding * 2;

  // Calculate min/max for scaling
  const counts = data.map((d) => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || 1;

  // Calculate points
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (100 - padding * 2);
    const normalizedValue = (d.count - min) / range;
    const y =
      chartHeight - normalizedValue * (chartHeight - padding * 2) + padding;
    return { x, y };
  });

  // Create path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Create area path (close at bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  const gradientId = `chart-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line
        x1="0"
        y1={height * 0.25}
        x2="100"
        y2={height * 0.25}
        stroke="var(--color-panel-border)"
        strokeDasharray="2"
        opacity="0.3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1={height * 0.5}
        x2="100"
        y2={height * 0.5}
        stroke="var(--color-panel-border)"
        strokeDasharray="2"
        opacity="0.3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1={height * 0.75}
        x2="100"
        y2={height * 0.75}
        stroke="var(--color-panel-border)"
        strokeDasharray="2"
        opacity="0.3"
        vectorEffect="non-scaling-stroke"
      />

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChartForInsight: React.FC<ChartForInsightProps> = ({
  insight,
  height = 200,
}) => {
  // Extract hourly counts from insight details
  const hourlyCounts: HourlyCount[] =
    "details" in insight && insight.details.hourlyCounts
      ? insight.details.hourlyCounts
      : [];

  // Format data for chart
  const chartData = useMemo(() => {
    if (hourlyCounts.length === 0) return [];

    return hourlyCounts.map((h) => ({
      hour: h.hour,
      count: h.count,
      label: formatHourLabel(h.hour),
      tooltipLabel: formatTooltipLabel(h.hour),
    }));
  }, [hourlyCounts]);

  // Get insight color based on kind
  const getChartColor = (): string => {
    switch (insight.kind) {
      case "occFailedPermanently":
      case "bytesReadLimit":
      case "documentsReadLimit":
        return "#ef4444"; // Red - using hex for SVG compatibility
      case "occRetried":
      case "bytesReadThreshold":
      case "documentsReadThreshold":
        return "#f59e0b"; // Yellow/amber
      default:
        return "#3b82f6"; // Blue
    }
  };

  const chartColor = getChartColor();

  // If no data, show empty state
  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-panel-bg-tertiary)",
          border: "1px solid var(--color-panel-border)",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-panel-text-muted)",
          }}
        >
          No data available
        </span>
      </div>
    );
  }

  // Calculate the inner height accounting for padding
  const innerHeight = height - 32; // 16px padding top + 16px padding bottom

  // Get time labels for x-axis
  const firstLabel =
    chartData.length > 0 ? formatTooltipLabel(chartData[0].hour) : "";
  const lastLabel =
    chartData.length > 0
      ? formatTooltipLabel(chartData[chartData.length - 1].hour)
      : "";

  return (
    <div
      style={{
        backgroundColor: "var(--color-panel-bg-tertiary)",
        border: "1px solid var(--color-panel-border)",
        borderRadius: "6px",
        padding: "16px",
        width: "100%",
      }}
    >
      <SimpleAreaChart
        data={chartData}
        height={innerHeight}
        color={chartColor}
      />

      {/* X-axis labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px",
          fontSize: "10px",
          color: "var(--color-panel-text-muted)",
        }}
      >
        <span>{firstLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
};
