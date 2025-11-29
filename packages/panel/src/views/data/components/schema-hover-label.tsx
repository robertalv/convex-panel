import React, { useRef, useState } from 'react';
import { ColumnMeta } from './data-table-utils';

export interface SchemaHoverLabelProps {
  column: string;
  meta?: ColumnMeta;
}

export const SchemaHoverLabel: React.FC<SchemaHoverLabelProps> = ({ column, meta }) => {
  const [showPanel, setShowPanel] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      setShowPanel(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    clearTimer();
    setShowPanel(false);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{column}</span>
      {showPanel && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 200,
            padding: '8px 12px',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px var(--color-panel-shadow)',
            zIndex: 30,
            color: 'var(--color-panel-text)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-panel-text-secondary)', marginBottom: 6 }}>
            Schema
          </div>
          <div style={{ marginBottom: 4 }}>
            Type:{' '}
            <span style={{ color: 'var(--color-panel-text)' }}>
              {meta?.typeLabel ?? 'unknown'}
            </span>
          </div>
          <div style={{ marginBottom: 4 }}>
            Optional:{' '}
            <span style={{ color: meta?.optional ? 'var(--color-panel-warning)' : 'var(--color-panel-success)' }}>
              {meta?.optional ? 'Yes' : 'No'}
            </span>
          </div>
          {meta?.linkTable && (
            <div>
              References:{' '}
              <span style={{ color: 'var(--color-panel-accent)' }}>{meta.linkTable}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

