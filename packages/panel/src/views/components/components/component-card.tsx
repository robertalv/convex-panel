import React from 'react';

export interface ComponentCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  weeklyDownloads?: string | number;
  developer?: string;
  imageUrl?: string;
  onClick?: () => void;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  description,
  icon,
  gradientFrom,
  gradientTo,
  weeklyDownloads,
  developer = 'get-convex',
  imageUrl,
  onClick,
}) => {
  return (
    <div
      className="cp-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Top section with gradient background */}
      <div
        style={{
          height: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: imageUrl 
            ? 'transparent' 
            : `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.currentTarget;
              target.style.display = 'none';
              const container = target.parentElement;
              if (container) {
                container.style.background = `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`;
              }
              const iconFallback = container?.querySelector('.cp-component-card-icon') as HTMLElement;
              if (iconFallback) {
                iconFallback.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          style={{
            display: imageUrl ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0, 0, 0, 0.7)',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          className="cp-component-card-icon"
        >
          {icon}
        </div>
      </div>

      {/* Content section */}
      <div className="cp-card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-panel-text)',
          margin: '0 0 8px 0',
        }}>
          {title}
        </h3>
        
        <p style={{
          fontSize: '12px',
          lineHeight: '1.5',
          color: 'var(--color-panel-text-secondary)',
          margin: '0 0 12px 0',
          flex: 1,
        }}>
          {description}
        </p>
        
        {(developer || weeklyDownloads !== undefined) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-panel-border)',
            fontSize: '11px',
          }}>
            {developer && (
              <span style={{
                color: 'var(--color-panel-text-muted)',
                fontWeight: 500,
              }}>
                {developer}
              </span>
            )}
            {weeklyDownloads !== undefined && (
              <span style={{
                color: 'var(--color-panel-text-muted)',
              }}>
                {typeof weeklyDownloads === 'number'
                  ? `${weeklyDownloads.toLocaleString()} weekly downloads`
                  : weeklyDownloads}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

