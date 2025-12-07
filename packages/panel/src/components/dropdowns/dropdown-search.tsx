import React from 'react';
import { Search } from 'lucide-react';

export interface DropdownSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEscape?: () => void;
  autoFocus?: boolean;
}

export const DropdownSearch: React.FC<DropdownSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onEscape,
  autoFocus = true,
}) => {
  return (
    <div style={{ padding: '8px', borderBottom: '1px solid var(--color-panel-border)' }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <Search
          size={12}
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-panel-text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && onEscape) {
              onEscape();
            }
          }}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: 'var(--color-panel-bg-secondary)',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            height: '28px',
            paddingLeft: '28px',
            paddingRight: '8px',
            fontSize: '12px',
            color: 'var(--color-panel-text)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-panel-accent)';
            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-tertiary)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-panel-border)';
            e.currentTarget.style.backgroundColor = 'var(--color-panel-bg-secondary)';
          }}
        />
      </div>
    </div>
  );
};

