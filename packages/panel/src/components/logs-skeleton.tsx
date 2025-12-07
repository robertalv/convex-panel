import React from 'react';

export const LogSkeleton = React.memo(({ style }: { style: React.CSSProperties }) => {
  return (
    <div style={{ ...style, display: 'flex', padding: '4px 16px', boxSizing: 'border-box', alignItems: 'center' }}>
        {/* Timestamp skeleton */}
        <div style={{ width: '160px' }}>
          <div
            style={{
              height: '12px',
              width: '80px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              borderRadius: '4px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        {/* ID badge skeleton */}
        <div style={{ width: '80px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              height: '16px',
              width: '32px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              borderRadius: '4px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        {/* Status skeleton */}
        <div style={{ width: '128px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              height: '12px',
              width: '40px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              borderRadius: '4px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              height: '12px',
              width: '35px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              borderRadius: '4px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
        {/* Function skeleton */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              backgroundColor: 'var(--color-panel-bg-secondary)',
              borderRadius: '2px',
              animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <div
              style={{
                height: '12px',
                width: '180px',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                borderRadius: '4px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '250px',
                backgroundColor: 'var(--color-panel-bg-secondary)',
                borderRadius: '4px',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    );
  });