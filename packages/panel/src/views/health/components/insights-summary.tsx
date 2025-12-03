import React, { useState, useEffect } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Card } from '../../../components/shared/card';
import { fetchInsights } from '../../../utils/api/health';
import type { Insight } from '../../../utils/api/types';
import { InsightsSummaryListItem } from './insights-summary-list-item';

export const InsightsSummary: React.FC<{
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}> = ({ deploymentUrl, authToken, useMockData = false }) => {
  const [insights, setInsights] = useState<Insight[] | undefined>(undefined);
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
        const data = await fetchInsights(deploymentUrl, authToken, useMockData);
        if (mounted) {
          setInsights(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch insights');
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

  const hasAnyInsights = insights && insights.length > 0;

  // Get time range for display (last 30 minutes)
  const getTimeRange = (): string => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
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
    return `${formatTime(thirtyMinutesAgo)} – Now`;
  };

  if (!hasAnyInsights && !loading && insights !== undefined) {
    return (
      <Card
        title="Insights"
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
            <CheckCircle2 size={20} color="var(--color-panel-success)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-panel-text)', marginBottom: '3px' }}>All clear!</h3>
          <p style={{ color: 'var(--color-panel-text-secondary)', marginBottom: '12px', fontSize: '12px' }}>
            There are no issues here to address.
          </p>
          <a
            href="https://docs.convex.dev/dashboard/deployments/health#insights"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-panel-accent)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-panel-accent)';
            }}
          >
            <ExternalLink size={12} /> Learn more about Insights
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Insights"
      action={<div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>{getTimeRange()}</div>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            minWidth: 'fit-content',
            gap: '8px',
            borderBottom: '1px solid var(--color-panel-border)',
            padding: '8px',
            fontSize: '12px',
            color: 'var(--color-panel-text-secondary)',
          }}
        >
          <p style={{ minWidth: '80px' }}>Severity</p>
          <p style={{ minWidth: '288px' }}>Function</p>
          <p style={{ minWidth: '240px' }}>Problem</p>
          <p style={{ minWidth: '240px' }}>Chart</p>
        </div>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid var(--color-panel-border)',
                  padding: '8px',
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '24px',
                    backgroundColor: 'var(--color-panel-border)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '288px',
                    height: '16px',
                    backgroundColor: 'var(--color-panel-border)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '240px',
                    height: '36px',
                    backgroundColor: 'var(--color-panel-border)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
                <div
                  style={{
                    width: '240px',
                    height: '36px',
                    backgroundColor: 'var(--color-panel-border)',
                    borderRadius: '4px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {!loading && insights && (
          <div style={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
            {insights.map((insight, idx) => (
              <InsightsSummaryListItem key={idx} insight={insight} />
            ))}
          </div>
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

