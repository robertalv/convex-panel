import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Card } from '../../../components/shared/card';
import { getLogSummary, type LogSummary } from '../../../utils/api/aiAnalysis';

export const AILogSummaryCard: React.FC<{
  adminClient?: any;
}> = ({ adminClient }) => {
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminClient) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get summary for last 24 hours
        const end = Date.now();
        const start = end - 24 * 60 * 60 * 1000;
        const data = await getLogSummary(adminClient, { start, end });
        if (mounted) {
          setSummary(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch log summary');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [adminClient]);

  if (!adminClient) {
    return null;
  }

  return (
    <Card
      title="AI Log Summary"
      action={
        <div
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '11px', 
            color: 'var(--color-panel-text-muted)',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            borderRadius: '8px',
            padding: '2px 6px',
          }}
        >
          Last 24h
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', alignItems: 'center' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-panel-text-muted)' }} />
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>Generating summary...</div>
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '16px', color: 'var(--color-panel-error)', fontSize: '12px' }}>
            {error}
          </div>
        )}
        {!loading && !error && !summary && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
            <FileText size={24} style={{ color: 'var(--color-panel-text-muted)', marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)', textAlign: 'center', marginBottom: '8px' }}>No summary available</div>
            <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '4px' }}>Log summaries are generated automatically daily.</div>
              <div>To analyze specific logs, use the <strong>"Analyze with AI"</strong> button in the Logs view.</div>
            </div>
          </div>
        )}
        {!loading && !error && summary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '6px' }}>Summary</div>
              <div style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)', lineHeight: '1.5' }}>
                {summary.summary.length > 200 ? `${summary.summary.substring(0, 200)}...` : summary.summary}
              </div>
            </div>

            {summary.keyEvents.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '6px' }}>Key Events</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--color-panel-text-secondary)' }}>
                  {summary.keyEvents.slice(0, 3).map((event, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {event.length > 100 ? `${event.substring(0, 100)}...` : event}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--color-panel-border)' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>Errors</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: summary.errorCount > 0 ? 'var(--color-panel-error)' : 'var(--color-panel-text)' }}>
                  {summary.errorCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>Functions</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
                  {summary.functionCount}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
