import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const TableFooter: React.FC = () => {
  return (
    <div
      style={{
        height: '40px',
        borderTop: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-panel-text-muted)',
          fontSize: '12px',
          border: '1px solid var(--color-panel-border)',
          borderRadius: '4px',
          padding: '6px 12px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-panel-text)';
          e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-panel-text-muted)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <SettingsIcon size={12} />
        Schema
      </button>
    </div>
  );
};

