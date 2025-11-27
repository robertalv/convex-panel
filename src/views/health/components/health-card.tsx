import React from 'react';
import { Info } from 'lucide-react';
import { Card } from '../../../components/shared/card';
import { TooltipAction } from '../../../components/shared/tooltip-action';

interface HealthCardProps {
  title: string;
  tip: string;
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const HealthCard: React.FC<HealthCardProps> = ({
  title,
  tip,
  loading,
  error,
  children,
  action,
  className,
  style,
}) => {
  return (
    <Card
      title={title}
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {action}
          <TooltipAction icon={<Info size={16} />} text={tip} />
        </div>
      }
      style={{ ...style, ...(className ? { className } : {}) }}
    >
      {loading ? (
        <div
          style={{
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-panel-text-muted)',
            fontSize: '12px',
          }}
        >
          Loading...
        </div>
      ) : error ? (
        <div
          style={{
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-panel-error)',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      ) : (
        children
      )}
    </Card>
  );
};

