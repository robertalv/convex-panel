import React, { useState, useEffect, useMemo } from 'react';
import { HealthCard } from './health-card';
import { BigMetric } from './big-metric';
import type { MetricHealth } from './big-metric';
import { fetchLatencyPercentiles } from '../../../utils/api/metrics';
import type { APIResponse } from '../types';
import { transformToChartData } from '../utils';

interface LatencyPercentilesCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

interface LatencyData {
  p50: number | null;
  p95: number | null;
  p99: number | null;
}

export const LatencyPercentilesCard: React.FC<LatencyPercentilesCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deploymentUrl || !authToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchLatencyPercentiles(deploymentUrl, authToken, useMockData);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch latency percentiles');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Refresh every 30 seconds for real-time tracking
    const interval = setInterval(fetchData, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deploymentUrl, authToken, useMockData]);

  // Extract current latency values from data
  const currentLatency = useMemo((): LatencyData => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { p50: null, p95: null, p99: null };
    }

    // The API returns data in format: Array<[number, TimeSeriesData]>
    // Where number is the percentile (50, 95, 99)
    const latencyData: LatencyData = { p50: null, p95: null, p99: null };

    data.forEach((item) => {
      const percentile = item[0];
      const timeSeries = item[1];
      
      if (!Array.isArray(timeSeries) || timeSeries.length === 0) {
        return;
      }

      // Get the most recent non-null value
      for (let i = timeSeries.length - 1; i >= 0; i--) {
        const [_, value] = timeSeries[i];
        if (value !== null && typeof value === 'number') {
          const percentileNum = typeof percentile === 'number' ? percentile : parseInt(String(percentile), 10);
          if (percentileNum === 50) {
            latencyData.p50 = value;
          } else if (percentileNum === 95) {
            latencyData.p95 = value;
          } else if (percentileNum === 99) {
            latencyData.p99 = value;
          }
          break;
        }
      }
    });

    return latencyData;
  }, [data]);

  // Calculate health status based on p95 latency
  const healthStatus = useMemo((): { health: MetricHealth; message: string } => {
    const p95 = currentLatency.p95;
    if (p95 === null) {
      return { health: 'healthy', message: 'No latency data available' };
    }

    // Thresholds: < 100ms healthy, 100-500ms warning, > 500ms error
    if (p95 < 100) {
      return { health: 'healthy', message: 'Latency is within normal range' };
    } else if (p95 < 500) {
      return { health: 'warning', message: 'Latency is elevated' };
    } else {
      return { health: 'error', message: 'Latency is high' };
    }
  }, [currentLatency]);

  // Format latency value for display
  const formatLatency = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <HealthCard
      title="Latency Percentiles"
      tip="The p50, p95, and p99 latency percentiles for all function executions, showing response time distribution."
      loading={loading}
      error={error}
    >
      {currentLatency.p50 !== null || currentLatency.p95 !== null || currentLatency.p99 !== null ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '8px',
            height: '100%',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>p50</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
                {formatLatency(currentLatency.p50)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>p95</div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color:
                    healthStatus.health === 'error'
                      ? 'var(--color-panel-error)'
                      : healthStatus.health === 'warning'
                      ? 'var(--color-panel-warning)'
                      : 'var(--color-panel-text)',
                }}
              >
                {formatLatency(currentLatency.p95)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>p99</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
                {formatLatency(currentLatency.p99)}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-panel-text-secondary)',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            {healthStatus.message}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-panel-text-muted)',
            fontSize: '12px',
          }}
        >
          No latency data available
        </div>
      )}
    </HealthCard>
  );
};
