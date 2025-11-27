import React from 'react';
import { ExternalLink } from 'lucide-react';

export interface DeploymentDisplayProps {
  environment?: 'development' | 'production' | 'preview';
  deploymentName?: string;
  kind?: 'cloud' | 'local';
  teamSlug?: string;
  projectSlug?: string;
  onClick?: () => void;
}

export const DeploymentDisplay: React.FC<DeploymentDisplayProps> = ({
  environment = 'development',
  deploymentName = 'convex-panel',
  kind = 'cloud',
  teamSlug,
  projectSlug,
  onClick,
}) => {
  const environmentLabel = 
    environment === 'development' ? 'Development' : 
    environment === 'production' ? 'Production' : 
    'Preview';
  
  const kindLabel = kind === 'local' ? 'Local' : 'Cloud';

  const dashboardUrl = teamSlug && projectSlug && deploymentName
    ? `https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/${deploymentName}`
    : null;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else if (dashboardUrl) {
      e.preventDefault();
      window.open(dashboardUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isClickable = !!(onClick || dashboardUrl);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 12px',
        borderRadius: '9999px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        color: '#4ade80',
        fontSize: '10px',
        fontWeight: 500,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
        }
      }}
      title={dashboardUrl ? `Open ${deploymentName} in Convex Dashboard` : undefined}
    >
      <div style={{ width: '12px', height: '12px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </div>
      <span>
        {environmentLabel} ({kindLabel})
      </span>
      <span style={{ color: '#16a34a' }}>•</span>
      <span>{deploymentName}</span>
      {isClickable && (
        <ExternalLink size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
      )}
    </div>
  );
};

