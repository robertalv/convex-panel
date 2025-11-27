import React from 'react';

export type MetricHealth = 'healthy' | 'warning' | 'error';

interface BigMetricProps {
  health?: MetricHealth;
  metric: string;
  children?: React.ReactNode;
}

export const BigMetric: React.FC<BigMetricProps> = ({ health, metric, children }) => {
  const getHealthColor = () => {
    switch (health) {
      case 'healthy':
        return 'var(--color-panel-success)';
      case 'warning':
        return 'var(--color-panel-warning)';
      case 'error':
        return 'var(--color-panel-error)';
      default:
        return 'var(--color-panel-text)';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '208px', // h-52 equivalent
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '0 8px 8px',
      }}
    >
      <div
        style={{
          fontSize: '36px', // text-4xl
          fontWeight: 600, // font-semibold
          color: getHealthColor(),
        }}
      >
        {metric}
      </div>
      <div
        style={{
          maxHeight: '40px',
          minHeight: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          color: 'var(--color-panel-text-secondary)',
          fontSize: '12px',
        }}
      >
        {children}
      </div>
    </div>
  );
};

