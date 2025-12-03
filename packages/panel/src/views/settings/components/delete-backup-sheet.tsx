import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import type { CloudBackupResponse } from '../../../utils/api/types';

export interface DeleteBackupSheetProps {
  backup: CloudBackupResponse;
  deploymentName?: string;
  onDelete: (backupId: number) => Promise<void>;
  onClose: () => void;
}

export const DeleteBackupSheet: React.FC<DeleteBackupSheetProps> = ({
  backup,
  deploymentName,
  onDelete,
  onClose,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      await onDelete(backup.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete backup');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 24px',
      }}
    >
      {/* Warning Message */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
          borderRadius: '6px',
          border: '1px solid color-mix(in srgb, var(--color-panel-error) 20%, transparent)',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <AlertCircle size={16} style={{ color: 'var(--color-panel-error)', flexShrink: 0, marginTop: '2px' }} />
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-panel-error)',
            lineHeight: '1.5',
          }}
        >
          This action cannot be undone.
        </div>
      </div>

      {/* Backup Info */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--color-panel-bg)',
          borderRadius: '8px',
          border: '1px solid var(--color-panel-border)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-panel-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          Backup
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-panel-text)',
            fontFamily: 'monospace',
            marginBottom: '4px',
          }}
        >
          {formatDate(backup.requestedTime)}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-panel-text-muted)',
            fontFamily: 'monospace',
            marginBottom: '8px',
          }}
        >
          ({formatRelativeTime(backup.requestedTime)})
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-panel-text-secondary)',
            marginBottom: '4px',
          }}
        >
          {backup.includeStorage ? 'Tables & Storage' : 'Tables only'}
        </div>
        {deploymentName && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-panel-text-muted)',
              fontFamily: 'monospace',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--color-panel-border)',
            }}
          >
            {deploymentName}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'color-mix(in srgb, var(--color-panel-error) 10%, transparent)',
            borderRadius: '6px',
            border: '1px solid color-mix(in srgb, var(--color-panel-error) 20%, transparent)',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <AlertCircle size={16} style={{ color: 'var(--color-panel-error)', flexShrink: 0, marginTop: '2px' }} />
          <div
            style={{
              fontSize: '13px',
              color: 'var(--color-panel-error)',
              lineHeight: '1.5',
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: 'auto',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-panel-border)',
        }}
      >
        <button
          onClick={onClose}
          disabled={isDeleting}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'transparent',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            color: 'var(--color-panel-text)',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-hover)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: isDeleting
              ? 'color-mix(in srgb, var(--color-panel-error) 50%, transparent)'
              : 'var(--color-panel-error)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--color-panel-text-on-error)',
            cursor: isDeleting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isDeleting) {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-panel-error) 90%, black)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDeleting
              ? 'color-mix(in srgb, var(--color-panel-error) 50%, transparent)'
              : 'var(--color-panel-error)';
          }}
        >
          {isDeleting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          Delete Backup
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

