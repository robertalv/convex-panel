import React from 'react';
import type { Insight } from '../../../utils/api/types';

export const SparklineForInsight: React.FC<{ insight: Insight }> = ({ insight }) => {
  // Extract hourly counts from insight details
  const hourlyCounts = 'details' in insight && insight.details.hourlyCounts
    ? insight.details.hourlyCounts
    : [];

  // Map to array of numbers
  const data = hourlyCounts.map((h) => h.count);

  // If no data, show empty sparkline
  if (data.length === 0) {
    return (
      <div style={{ width: '240px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '60px',
            height: '20px',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'var(--color-panel-text-secondary)',
          }}
        >
          No data
        </div>
      </div>
    );
  }

  // Calculate min and max for scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Sparkline dimensions
  const width = 240;
  const height = 36;
  const padding = 4;

  // Calculate x and y coordinates for each point
  const points: Array<{ x: number; y: number }> = data.map((value, index) => {
    const x = padding + ((index / (data.length - 1 || 1)) * (width - padding * 2));
    // Invert y so higher values are at the top (SVG coordinates)
    const normalizedValue = (value - min) / range;
    const y = height - padding - (normalizedValue * (height - padding * 2));
    return { x, y };
  });

  // Create path string for the line
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div style={{ width: `${width}px`, height: `${height}px`, display: 'flex', alignItems: 'center' }}>
      <svg
        width={width}
        height={height}
        style={{ overflow: 'visible' }}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Optional: Add area fill under the line */}
        {data.length > 1 && (
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-panel-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-panel-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
        )}
        
        {/* Area fill */}
        {data.length > 1 && (
          <path
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#sparklineGradient)"
          />
        )}
        
        {/* Line */}
        <polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="var(--color-panel-accent, #3b82f6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Optional: Add dots at data points if there are few points */}
        {data.length <= 20 && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill="var(--color-panel-accent, #3b82f6)"
          />
        ))}
      </svg>
    </div>
  );
};
