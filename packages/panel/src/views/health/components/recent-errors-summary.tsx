import React, { useState, useEffect } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from '../../../components/shared/card';
import { fetchRecentErrors } from '../../../utils/api/metrics';

export const RecentErrorsSummary: React.FC<{
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}> = ({ deploymentUrl, authToken, useMockData = false }) => {
  const [errorData, setErrorData] = useState<{ count: number; topErrors: Array<{ message: string; count: number }> } | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deploymentUrl || !authToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRecentErrors(deploymentUrl, authToken, useMockData, 1);
        if (mounted) {
          setErrorData(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch recent errors');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, useMockData]);

  const hasErrors = errorData && errorData.count > 0;

  // Get time range for display (last hour)
  const getTimeRange = (): string => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const formatTime = (date: Date) => {
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };
    return `${formatTime(oneHourAgo)} – Now`;
  };

  if (!hasErrors && !loading && errorData !== undefined) {
    return (
      <Card
        title="Recent Errors"
        action={<div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>{getTimeRange()}</div>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'color-mix(in srgb, var(--color-panel-success) 10%, transparent)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-panel-success) 30%, transparent)',
            }}
          >
            <AlertCircle size={20} color="var(--color-panel-success)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '3px' }}>No errors!</h3>
          <p style={{ color: 'var(--color-panel-text-secondary)', marginBottom: '12px', fontSize: '12px' }}>
            No errors detected in the last hour.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Recent Errors"
      action={<div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>{getTimeRange()}</div>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: 'var(--color-panel-border)',
                  borderRadius: '4px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  marginBottom: '8px',
                }}
              />
            ))}
          </div>
        )}
        {!loading && errorData && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                borderBottom: '1px solid var(--color-panel-border)',
              }}
            >
              <AlertCircle size={16} color="var(--color-panel-error)" />
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-panel-text)' }}>
                {errorData.count} {errorData.count === 1 ? 'error' : 'errors'} in the last hour
              </span>
            </div>
            {errorData.topErrors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-panel-text-muted)',
                    marginBottom: '8px',
                    padding: '0 4px',
                  }}
                >
                  Most common errors:
                </div>
                {errorData.topErrors.map((errorItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-panel-bg-tertiary)',
                      marginBottom: '6px',
                      border: '1px solid var(--color-panel-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', fontWeight: 500 }}>
                        {errorItem.count}x
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-panel-text)',
                        wordBreak: 'break-word',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={errorItem.message}
                    >
                      {errorItem.message.length > 100 ? `${errorItem.message.substring(0, 100)}...` : errorItem.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                padding: '8px',
                borderTop: '1px solid var(--color-panel-border)',
                fontSize: '11px',
                color: 'var(--color-panel-text-muted)',
                textAlign: 'center',
              }}
            >
              View all logs in the Logs tab to see detailed error information
            </div>
          </>
        )}
        {error && (
          <div style={{ padding: '16px', color: 'var(--color-panel-error)', fontSize: '12px' }}>
            Error: {error}
          </div>
        )}
      </div>
    </Card>
  );
};
