import React from 'react';

type SkeletonCardVariant = 'chart' | 'simple' | 'insights';

interface SkeletonCardProps {
  title?: string;
  className?: string;
  height?: string;
  showAction?: boolean;
  showTooltip?: boolean;
  variant?: SkeletonCardVariant;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  title,
  className = '',
  height = '140px',
  showAction = false,
  showTooltip = true,
  variant = 'chart',
}) => {
  return (
    <div className={`cp-card cp-skeleton-card ${className}`} style={{ minHeight: height }}>
      {/* Header */}
      {(title || showAction || showTooltip) && (
        <div className="cp-card-header">
          {title ? (
            <h3 className="cp-card-title">
              <div
                style={{
                  height: '12px',
                  width: `${Math.max(title.length * 6 + 20, 96)}px`,
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  borderRadius: '4px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </h3>
          ) : (
            <h3 className="cp-card-title">
              <div
                style={{
                  height: '12px',
                  width: '96px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  borderRadius: '4px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </h3>
          )}
          <div className="cp-card-actions">
            {variant === 'insights' ? (
              <div
                style={{
                  height: '11px',
                  width: '120px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  borderRadius: '4px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            ) : (
              <>
                {showAction && (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                )}
                {showTooltip && (
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="cp-card-content">
        {variant === 'chart' && (
          <>
            {/* Chart Area Skeleton with Grid Lines */}
            <div
              style={{
                height: '100px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingTop: '4px',
                paddingBottom: '4px',
              }}
            >
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    borderTop: '1px dashed',
                    borderColor: 'var(--color-panel-border)',
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>

            {/* Legend & Time Labels Row Skeleton */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Desktop Layout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                {/* Start Time Placeholder */}
                <div className="cp-skeleton-time-desktop" style={{ width: '80px' }}>
                  <div
                    style={{
                      height: '10px',
                      width: '48px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      borderRadius: '4px',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }}
                  />
                </div>

                {/* Custom Legend Placeholders */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '16px 8px',
                    flex: 1,
                    paddingLeft: '8px',
                    paddingRight: '8px',
                  }}
                >
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Legend Color Bar Placeholder */}
                      <div
                        style={{
                          width: '12px',
                          height: '2px',
                          backgroundColor: 'var(--color-panel-bg-tertiary)',
                          borderRadius: '9999px',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                      {/* Legend Text Placeholder */}
                      <div
                        style={{
                          height: '10px',
                          width: '80px',
                          backgroundColor: 'var(--color-panel-bg-tertiary)',
                          borderRadius: '4px',
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* End Time Placeholder */}
                <div className="cp-skeleton-time-desktop" style={{ width: '80px' }}>
                  <div
                    style={{
                      height: '10px',
                      width: '48px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      borderRadius: '4px',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      marginLeft: 'auto',
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {variant === 'simple' && (
          <div
            style={{
              display: 'flex',
              height: '100%',
              width: '100%',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 8px 8px',
            }}
          >
            {/* Timestamp placeholder */}
            <div
              style={{
                height: '14px',
                width: '120px',
                backgroundColor: 'var(--color-panel-bg-tertiary)',
                borderRadius: '4px',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            {/* Version placeholder */}
            <div
              style={{
                display: 'flex',
                height: '32px',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  height: '20px',
                  width: '100px',
                  backgroundColor: 'var(--color-panel-bg-tertiary)',
                  borderRadius: '4px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </div>
          </div>
        )}

        {variant === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                minWidth: 'fit-content',
                gap: '8px',
                borderBottom: '1px solid var(--color-panel-border)',
                padding: '8px',
                fontSize: '12px',
                color: 'var(--color-panel-text-secondary)',
              }}
            >
              <div style={{ minWidth: '80px', height: '12px', backgroundColor: 'var(--color-panel-bg-tertiary)', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <div style={{ minWidth: '288px', height: '12px', backgroundColor: 'var(--color-panel-bg-tertiary)', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <div style={{ minWidth: '240px', height: '12px', backgroundColor: 'var(--color-panel-bg-tertiary)', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <div style={{ minWidth: '240px', height: '12px', backgroundColor: 'var(--color-panel-bg-tertiary)', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            </div>
            {/* Data rows */}
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid var(--color-panel-border)',
                  padding: '8px',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '24px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '288px',
                    height: '16px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '240px',
                    height: '36px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '240px',
                    height: '36px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
