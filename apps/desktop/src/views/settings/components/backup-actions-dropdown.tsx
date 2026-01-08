import React from 'react';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { DropdownShell, DropdownPanel } from '../../../components/dropdowns';
import { useThemeSafe } from '../../../hooks/useTheme';

export interface BackupActionsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export const BackupActionsDropdown: React.FC<BackupActionsDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onDownload,
  onRestore,
  onDelete,
}) => {
  const { theme } = useThemeSafe();

  const menuItems = [
    {
      icon: <Download size={14} />,
      label: 'Download',
      onClick: () => {
        onDownload();
        onClose();
      },
    },
    {
      icon: <RotateCcw size={14} />,
      label: 'Restore',
      onClick: () => {
        onRestore();
        onClose();
      },
    },
    {
      icon: <Trash2 size={14} />,
      label: 'Delete',
      onClick: () => {
        onDelete();
        onClose();
      },
      destructive: true,
    },
  ];

  return (
    <DropdownShell isOpen={isOpen} onOpenChange={onClose}>
      <DropdownPanel
        isOpen={isOpen}
        width={150}
        maxHeight={200}
        triggerRef={triggerRef}
        className={`cp-theme-${theme}`}
        style={{
          padding: '4px',
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.onClick();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: item.destructive
                ? 'var(--color-panel-error)'
                : 'var(--color-panel-text)',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </DropdownPanel>
    </DropdownShell>
  );
};
