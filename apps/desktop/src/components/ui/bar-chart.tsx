import { useState, useRef, useMemo } from "react";

export interface BarDataPoint {
  label: string;
  value: number;
  secondary?: number; // Used for stacked charts like Tables vs Indexes
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  stacked?: boolean;
  formatValue?: (v: number) => string;
  colors?: string[];
  labels?: string[];
}

export function BarChart({
  data,
  height = 200,
  stacked = false,
  formatValue = (v) => v.toString(),
  colors = ["var(--color-info-base)", "var(--color-warning-base)"],
  labels = ["Primary", "Secondary"],
}: BarChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = 1000;
  const padding = { top: 10, right: 10, bottom: 25, left: 70 };

  const maxValue = useMemo(() => {
    const max = Math.max(
      ...data.map((d) => (stacked ? d.value + (d.secondary || 0) : d.value)),
      1,
    );
    return max * 1.1;
  }, [data, stacked]);

  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  const getY = (v: number) =>
    height - padding.bottom - (v / maxValue) * chartHeight;

  const barWidth = (chartWidth / data.length) * 0.75;
  const gap = (chartWidth / data.length) * 0.25;

  // Generate 5 y-axis ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= 4; i++) {
      ticks.push((maxValue / 4) * i);
    }
    return ticks;
  }, [maxValue]);

  return (
    <div
      className="relative w-full group"
      style={{ height }}
      ref={containerRef}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Y Axis Grid Lines and Labels */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={getY(tick)}
              x2={width - padding.right}
              y2={getY(tick)}
              stroke="var(--color-border-base)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4 4"}
              opacity={0.5}
            />
            <text
              x={padding.left - 8}
              y={getY(tick)}
              fill="var(--color-text-muted)"
              fontSize="11"
              textAnchor="end"
              alignmentBaseline="middle"
              className="font-mono"
            >
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padding.left + i * (barWidth + gap) + gap / 2;
          const primaryHeight = (d.value / maxValue) * chartHeight;
          const secondaryHeight = stacked
            ? ((d.secondary || 0) / maxValue) * chartHeight
            : 0;

          const isActive = activeIdx === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
              className="cursor-pointer"
            >
              {/* Invisible hit area */}
              <rect
                x={x - gap / 2}
                y={padding.top}
                width={barWidth + gap}
                height={chartHeight}
                fill="transparent"
              />

              {/* Primary Bar (bottom) */}
              <rect
                x={x}
                y={getY(d.value)}
                width={barWidth}
                height={Math.max(primaryHeight, 2)}
                fill={colors[0]}
                opacity={isActive ? 1 : 0.85}
                rx={stacked ? 0 : 2}
                className="transition-opacity duration-150"
              />

              {/* Secondary/Stacked Bar (top) */}
              {stacked && d.secondary !== undefined && d.secondary > 0 && (
                <rect
                  x={x}
                  y={getY(d.value + d.secondary)}
                  width={barWidth}
                  height={Math.max(secondaryHeight, 2)}
                  fill={colors[1]}
                  opacity={isActive ? 1 : 0.85}
                  rx={0}
                  className="transition-opacity duration-150"
                />
              )}

              {/* Top rounded corner for stacked */}
              {stacked && d.secondary !== undefined && d.secondary > 0 && (
                <rect
                  x={x}
                  y={getY(d.value + d.secondary)}
                  width={barWidth}
                  height={4}
                  fill={colors[1]}
                  opacity={isActive ? 1 : 0.85}
                  rx={2}
                  className="transition-opacity duration-150"
                />
              )}

              {/* X Axis Label - show every other label */}
              {i % 2 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  fill="var(--color-text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono uppercase"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {activeIdx !== null && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg border border-border bg-surface-raised px-3 py-2 shadow-lg"
          style={{
            left: `${((padding.left + activeIdx * (barWidth + gap) + gap / 2 + barWidth / 2) / width) * 100}%`,
            top: "10px",
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1">
            {data[activeIdx].label}
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors[0] }}
                />
                <span className="text-[10px] text-muted">{labels[0]}</span>
              </div>
              <span className="font-mono text-[11px] font-medium text-foreground">
                {formatValue(data[activeIdx].value)}
              </span>
            </div>
            {stacked && data[activeIdx].secondary !== undefined && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colors[1] }}
                  />
                  <span className="text-[10px] text-muted">{labels[1]}</span>
                </div>
                <span className="font-mono text-[11px] font-medium text-foreground">
                  {formatValue(data[activeIdx].secondary || 0)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
