import { useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, Calendar } from "lucide-react";
import { format, isValid } from "date-fns";

type TimeRange = "30m" | "1h" | "6h" | "24h" | "7d" | "30d" | "custom";

interface TimeRangeDisplayProps {
  /** Selected time range */
  range: TimeRange;
  /** Custom start time (for custom range) */
  startTime?: Date;
  /** Custom end time (for custom range) */
  endTime?: Date;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional CSS classes */
  className?: string;
}

const rangeLabels: Record<TimeRange, string> = {
  "30m": "Last 30 minutes",
  "1h": "Last hour",
  "6h": "Last 6 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  custom: "Custom range",
};

/**
 * Component to display the current time range for health metrics.
 * Styled with inline CSS variables to match the desktop app patterns.
 */
export function TimeRangeDisplay({
  range,
  startTime,
  endTime,
  showIcon = true,
  size = "md",
  className,
}: TimeRangeDisplayProps) {
  const label =
    range === "custom" && startTime && endTime && isValid(startTime) && isValid(endTime)
      ? `${format(startTime, "MMM d, HH:mm")} - ${format(endTime, "MMM d, HH:mm")}`
      : rangeLabels[range];

  const Icon = range === "custom" ? Calendar : Clock;
  const iconSize = size === "sm" ? 12 : 14;
  const fontSize = size === "sm" ? "12px" : "13px";

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
      {showIcon && <Icon size={iconSize} />}
      <span>{label}</span>
    </span>
  );
}

interface TimeRangeSelectorProps {
  /** Currently selected range */
  value: TimeRange;
  /** Callback when range changes */
  onChange: (range: TimeRange) => void;
  /** Available ranges to show */
  availableRanges?: TimeRange[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Selector component for choosing a time range.
 * Styled with inline CSS variables to match the desktop app patterns.
 */
export function TimeRangeSelector({
  value,
  onChange,
  availableRanges = ["30m", "1h", "6h", "24h"],
  className,
}: TimeRangeSelectorProps) {
  const [hoveredRange, setHoveredRange] = useState<TimeRange | null>(null);

  return (
    <div
      className={cn(className)}
      style={{
        display: "inline-flex",
        borderRadius: "8px",
        border: "1px solid var(--color-border-base)",
        overflow: "hidden",
      }}
    >
      {availableRanges.map((range, index) => {
        const isSelected = value === range;
        const isHovered = hoveredRange === range;

        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            onMouseEnter={() => setHoveredRange(range)}
            onMouseLeave={() => setHoveredRange(null)}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 500,
              border: "none",
              borderRight:
                index < availableRanges.length - 1
                  ? "1px solid var(--color-border-base)"
                  : "none",
              backgroundColor: isSelected
                ? "var(--color-brand-muted)"
                : isHovered
                  ? "var(--color-surface-raised)"
                  : "var(--color-surface-base)",
              color: isSelected
                ? "var(--color-brand-base)"
                : isHovered
                  ? "var(--color-text-base)"
                  : "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
