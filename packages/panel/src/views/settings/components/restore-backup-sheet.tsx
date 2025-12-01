import React, { useState } from 'react';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { CloudBackupResponse } from '../../../utils/api';

export interface RestoreBackupSheetProps {
  backup: CloudBackupResponse;
  deploymentName: string;
  deploymentId: number;
  onRestore: (backupId: number, targetDeploymentId: number) => void | Promise<void>;
  onClose: () => void;
}

export const RestoreBackupSheet: React.FC<RestoreBackupSheetProps> = ({
  backup,
  deploymentName,
  deploymentId,
  onRestore,
  onClose,
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
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

  const handleRestore = async (e: React.MouseEvent) => {
    // Always prevent default behavior to prevent page reload
    e.preventDefault();
    e.stopPropagation();
    
    // Don't proceed if already restoring
    if (isRestoring) return;
    
    setIsRestoring(true);
    setError(null);
    
    try {
      // onRestore already closes the sheet, so we don't need to call onClose here
      const result = onRestore(backup.id, deploymentId);
      // If onRestore returns a promise, handle it (but don't await to prevent blocking)
      if (result && typeof result.then === 'function') {
        result.catch((err: any) => {
          // Error is already handled in onRestore, but set it here too for UI feedback
          setError(err?.message || 'Failed to restore backup');
          // Don't re-throw to prevent page reload
        });
      }
      // Sheet is already closed by onRestore, so we don't call onClose again
    } catch (err: any) {
      // Error is already handled in onRestore, but set it here too for UI feedback
      setError(err?.message || 'Failed to restore backup');
      // Don't re-throw to prevent page reload
    } finally {
      setIsRestoring(false);
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
      {/* Backup and Deployment Flow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'var(--color-panel-bg)',
          borderRadius: '8px',
          border: '1px solid var(--color-panel-border)',
        }}
      >
        {/* Backup */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-panel-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
            }}
          >
            {formatDate(backup.requestedTime)}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-panel-text-muted)',
              fontFamily: 'monospace',
            }}
          >
            ({formatRelativeTime(backup.requestedTime)})
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-panel-text-secondary)',
            }}
          >
            {backup.includeStorage ? 'Tables & Storage' : 'Tables only'}
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight size={16} style={{ color: 'var(--color-panel-text-muted)', flexShrink: 0 }} />

        {/* Deployment */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-panel-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Deployment
          </div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-panel-text)',
              fontFamily: 'monospace',
            }}
          >
            {deploymentName}
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'color-mix(in srgb, var(--color-panel-warning) 10%, transparent)',
          borderRadius: '6px',
          border: '1px solid color-mix(in srgb, var(--color-panel-warning) 20%, transparent)',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
        }}
      >
        <AlertCircle size={16} style={{ color: 'var(--color-panel-warning)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-panel-text)',
              lineHeight: '1.5',
              marginBottom: '4px',
            }}
          >
            Tables will be replaced
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--color-panel-text-secondary)',
              lineHeight: '1.5',
            }}
          >
            The tables in {deploymentName} will be replaced by the contents of the backup. Code, environment variables, scheduled functions, and files will not be changed.
          </div>
        </div>
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
          disabled={isRestoring}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: 'transparent',
            border: '1px solid var(--color-panel-border)',
            borderRadius: '8px',
            color: 'var(--color-panel-text)',
            cursor: isRestoring ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isRestoring) {
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
          type="button"
          onClick={handleRestore}
          disabled={isRestoring}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: isRestoring
              ? 'var(--color-panel-accent-disabled)'
              : 'var(--color-panel-accent)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--color-panel-text-on-accent)',
            cursor: isRestoring ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isRestoring) {
              e.currentTarget.style.backgroundColor = 'var(--color-panel-accent-hover)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isRestoring
              ? 'var(--color-panel-accent-disabled)'
              : 'var(--color-panel-accent)';
          }}
        >
          {isRestoring && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
          Restore
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
