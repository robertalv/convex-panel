import React from 'react';

export const SparklineForInsight: React.FC = () => {
  // For now, render a simple placeholder sparkline
  // In the future, this could fetch and display actual sparkline data
  const width = 60;
  const height = 20;
  
  // Generate a simple placeholder line
  const points = Array.from({ length: 10 }, (_, i) => {
    const x = (i / 9) * width;
    const y = height / 2 + Math.sin(i * 0.5) * (height / 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: `${width}px`, height: `${height}px` }}>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-panel-text-secondary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

