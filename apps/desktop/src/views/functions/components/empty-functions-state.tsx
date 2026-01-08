import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { HealthCard } from '../../health/components/health-card';

export const EmptyFunctionsState: React.FC = () => {
  // Generate empty chart path (flat line)
  const emptyChartPath = 'M0 95 L 300 95';

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Background statistics grid - faded */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '16px',
          pointerEvents: 'none',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 30%, transparent 90%)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <HealthCard
            title="Function Calls"
            tip="The number of times this function has been called over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="var(--color-panel-warning)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path d={emptyChartPath} stroke="var(--color-panel-info)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" opacity="0.3" />
              </svg>
            </div>
          </HealthCard>

          <HealthCard
            title="Errors"
            tip="The number of errors this function has encountered over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="var(--color-panel-warning)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path d={emptyChartPath} stroke="var(--color-panel-error)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" opacity="0.3" />
              </svg>
            </div>
          </HealthCard>

          <HealthCard
            title="Execution Time"
            tip="The p50 (median) execution time of this function over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="var(--color-panel-warning)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path d={emptyChartPath} stroke="var(--color-panel-success)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" opacity="0.3" />
              </svg>
            </div>
          </HealthCard>

          <HealthCard
            title="Cache Hit Rate"
            tip="The percentage of queries served from cache vs executed fresh, over the last 30 minutes, bucketed by minute."
            loading={false}
            error={null}
          >
            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', position: 'relative', width: '100%' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 300 100">
                <line x1="0" y1="25" x2="300" y2="25" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line x1="0" y1="75" x2="300" y2="75" stroke="var(--color-panel-border)" strokeDasharray="4" opacity="0.3" />
                <line
                  x1={300}
                  y1="0"
                  x2={300}
                  y2="100"
                  stroke="var(--color-panel-warning)"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.3"
                />
                <path d={emptyChartPath} stroke="var(--color-panel-info)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" opacity="0.3" />
              </svg>
            </div>
          </HealthCard>
        </div>
      </div>

      {/* Centered message */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-panel-bg) 92%, transparent)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '24px',
            padding: '32px 40px',
            textAlign: 'center',
            color: 'var(--color-panel-text)',
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 25px 55px var(--color-panel-shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <ArrowLeft
            size={24}
            style={{
              color: 'var(--color-panel-text-muted)',
              flexShrink: 0,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--color-panel-text)',
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            Select a function in the expandable panel to the left to view its statistics, code, and logs.
          </p>
        </div>
      </div>
    </div>
  );
};

