import React, { useState } from 'react';
import type { FunctionExecutionLog } from '../../../types';
import { Card } from '../../../components/shared/card';

interface FunctionExecutionDetailSheetProps {
  log: FunctionExecutionLog | null;
  isOpen: boolean;
  onClose: () => void;
}

type DetailTab = 'execution' | 'request' | 'functions';

const formatDateTime = (timestamp: number) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

const formatDuration = (ms: number) => {
  if (!ms || ms <= 0) return '0ms';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
};

export const FunctionExecutionDetailSheet: React.FC<FunctionExecutionDetailSheetProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('execution');

  if (!isOpen || !log) {
    return null;
  }

  const {
    executionId,
    functionIdentifier,
    udfType,
    startedAt,
    completedAt,
    durationMs,
    environment,
    usageStats,
    returnBytes,
    requestId,
    caller,
    identityType,
  } = log;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        borderLeft: '1px solid var(--color-panel-border)',
        backgroundColor: 'var(--color-panel-bg)',
        boxShadow: 'var(--color-panel-shadow)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--color-panel-border)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-panel-text)',
            }}
          >
            Execution details
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-panel-text-muted)',
              fontFamily: 'monospace',
            }}
          >
            {functionIdentifier}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--color-panel-text-muted)',
            cursor: 'pointer',
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          borderBottom: '1px solid var(--color-panel-border)',
          display: 'flex',
        }}
      >
        {(['execution', 'request', 'functions'] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 500,
              border: 'none',
              borderBottom:
                activeTab === tab
                  ? '2px solid var(--color-panel-accent)'
                  : '2px solid transparent',
              backgroundColor: 'transparent',
              color:
                activeTab === tab
                  ? 'var(--color-panel-text)'
                  : 'var(--color-panel-text-muted)',
              cursor: 'pointer',
            }}
          >
            {tab === 'execution'
              ? 'Execution'
              : tab === 'request'
              ? 'Request'
              : 'Functions Called'}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}
      >
        {activeTab === 'execution' && (
          <Card>
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  marginBottom: 12,
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  rowGap: 6,
                }}
              >
                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Execution ID
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 200,
                    display: 'inline-block',
                  }}
                  title={executionId}
                >
                  {executionId}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Function
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  {functionIdentifier}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Type
                </span>
                <span
                  style={{
                    textTransform: 'capitalize',
                    color: 'var(--color-panel-text-secondary)',
                  }}
                >
                  {udfType}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Started at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(startedAt)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Completed at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(completedAt)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Duration
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDuration(durationMs)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Environment
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {environment || 'Convex'}
                </span>
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--color-panel-text)',
                }}
              >
                Resources Used
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  rowGap: 8,
                  columnGap: 16,
                  fontSize: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    DB Bandwidth
                  </div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-secondary)',
                    }}
                  >
                    {`Read ${formatBytes(
                      usageStats?.database_read_bytes,
                    )}, wrote ${formatBytes(
                      usageStats?.database_write_bytes,
                    )}`}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    File Bandwidth
                  </div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-secondary)',
                    }}
                  >
                    {`Read ${formatBytes(
                      usageStats?.storage_read_bytes,
                    )}, wrote ${formatBytes(
                      usageStats?.storage_write_bytes,
                    )}`}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    Vector Bandwidth
                  </div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-secondary)',
                    }}
                  >
                    {`Read ${formatBytes(
                      usageStats?.vector_index_read_bytes,
                    )}, wrote ${formatBytes(
                      usageStats?.vector_index_write_bytes,
                    )}`}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-muted)',
                      marginBottom: 2,
                    }}
                  >
                    Return Size
                  </div>
                  <div
                    style={{
                      color: 'var(--color-panel-text-secondary)',
                    }}
                  >
                    {formatBytes(returnBytes)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'request' && (
          <Card>
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  rowGap: 6,
                  marginBottom: 12,
                }}
              >
                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Request ID
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-panel-text-secondary)',
                    // Truncate the requestId with ellipsis if too long
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 200,
                    display: 'inline-block',
                  }}
                  title={requestId}
                >
                  {requestId}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Started at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(startedAt)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Completed at
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDateTime(completedAt)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Duration
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {formatDuration(durationMs)}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Identity
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {identityType || 'Unknown'}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Caller
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {caller || 'Unknown'}
                </span>

                <span style={{ color: 'var(--color-panel-text-muted)' }}>
                  Environment
                </span>
                <span style={{ color: 'var(--color-panel-text-secondary)' }}>
                  {environment || 'Convex'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'functions' && (
          <Card>
            <div style={{ fontSize: 12 }}>
              <div
                style={{
                  marginBottom: 8,
                  color: 'var(--color-panel-text)',
                  fontWeight: 600,
                }}
              >
                Functions Called
              </div>
              <div
                style={{
                  color: 'var(--color-panel-text-secondary)',
                  fontSize: 12,
                }}
              >
                Detailed call graphs are not yet available from the public
                logging endpoints. This panel will show a function outline once
                that data is exposed.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};


