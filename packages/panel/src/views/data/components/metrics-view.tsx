import React, { useState, useEffect, useMemo } from 'react';
import { fetchTableRate } from '../../../utils/api/metrics';
import type { TimeseriesBucket } from '../../../utils/api/types';
import { Card } from '../../../components/shared/card';

export interface MetricsViewProps {
  tableName: string;
  deploymentUrl?: string;
  accessToken?: string;
  componentId?: string | null;
}

export const MetricsView: React.FC<MetricsViewProps> = ({
  tableName,
  deploymentUrl,
  accessToken,
  componentId,
}) => {
  const [readsData, setReadsData] = useState<TimeseriesBucket[]>([]);
  const [writesData, setWritesData] = useState<TimeseriesBucket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!deploymentUrl || !accessToken || !tableName) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch metrics for the last hour with 30 buckets (2-minute intervals)
        const end = new Date();
        const start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour ago
        const numBuckets = 30;

        const [reads, writes] = await Promise.all([
          fetchTableRate(deploymentUrl, tableName, 'rowsRead', start, end, numBuckets, accessToken),
          fetchTableRate(deploymentUrl, tableName, 'rowsWritten', start, end, numBuckets, accessToken),
        ]);

        setReadsData(reads);
        setWritesData(writes);
        setLastUpdated(new Date());
      } catch (err: any) {
        console.error('Error fetching table metrics:', err);
        setError(err?.message || 'Failed to fetch metrics');
        setReadsData([]);
        setWritesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [tableName, deploymentUrl, accessToken, componentId]);

  // Format time for display
  const formatTime = (date: Date): string => {
    const hour12 = date.getHours() % 12 || 12;
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${hour12}:${mins} ${ampm}`;
  };

  // Calculate max value for Y-axis scaling
  // const maxValue = useMemo(() => {
  //   const allValues = [
  //     ...readsData.map(d => d.metric || 0),
  //     ...writesData.map(d => d.metric || 0),
  //   ];
  //   if (allValues.length === 0) return 4;
  //   const max = Math.max(...allValues);
  //   // Round up to nearest nice number
  //   if (max === 0) return 4;
  //   const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  //   return Math.ceil(max / magnitude) * magnitude;
  // }, [readsData, writesData]);

  // const graphHeight = 200;
  // const graphWidth = 600;

  // Generate time labels from data
  // const timeLabels = useMemo(() => {
  //   const times = readsData.length > 0 
  //     ? readsData.map(d => d.time)
  //     : writesData.length > 0
  //       ? writesData.map(d => d.time)
  //       : [];
    
  //   // Sample every nth label to avoid crowding
  //   const sampleRate = Math.max(1, Math.floor(times.length / 7));
  //   return times
  //     .filter((_, i) => i % sampleRate === 0 || i === times.length - 1)
  //     .map(formatTime);
  // }, [readsData, writesData]);

  // Render data line for a graph
  // const renderDataLine = (data: TimeseriesBucket[], color: string) => {
  //   if (data.length === 0 || maxValue === 0) return null;

  //   const points = data
  //     .map((bucket, index) => {
  //       const x = (index / (data.length - 1)) * graphWidth;
  //       const y = graphHeight - ((bucket.metric || 0) / maxValue) * graphHeight;
  //       return `${x},${y}`;
  //     })
  //     .join(' ');

  //   const areaPoints = `${points} ${graphWidth},${graphHeight} 0,${graphHeight}`;

  //   return (
  //     <>
  //       <polygon
  //         points={areaPoints}
  //         fill={`color-mix(in srgb, ${color} 18%, transparent)`}
  //         stroke="none"
  //       />
  //       <polyline
  //         points={points}
  //         fill="none"
  //         stroke={color}
  //         strokeWidth={2}
  //         strokeLinecap="round"
  //         strokeLinejoin="round"
  //       />
  //     </>
  //   );
  // };

  const formatNumber = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toFixed(value >= 10 ? 0 : 1);
  };

  const readsTotal = useMemo(
    () => readsData.reduce((sum, bucket) => sum + (bucket.metric || 0), 0),
    [readsData],
  );

  const writesTotal = useMemo(
    () => writesData.reduce((sum, bucket) => sum + (bucket.metric || 0), 0),
    [writesData],
  );

  const peakValue = useMemo(() => {
    const combined = [...readsData, ...writesData].map(b => b.metric || 0);
    return combined.length ? Math.max(...combined) : 0;
  }, [readsData, writesData]);

  const latestReads = readsData.length ? readsData[readsData.length - 1].metric || 0 : 0;
  const latestWrites = writesData.length ? writesData[writesData.length - 1].metric || 0 : 0;
  const avgReads = readsData.length ? readsTotal / readsData.length : 0;
  const avgWrites = writesData.length ? writesTotal / writesData.length : 0;

  const getTrendPercent = (data: TimeseriesBucket[]) => {
    if (data.length < 2) return 0;
    const first = data[0].metric || 0;
    const last = data[data.length - 1].metric || 0;
    if (first === 0) {
      return last === 0 ? 0 : 100;
    }
    return ((last - first) / Math.abs(first)) * 100;
  };

  const readsTrend = getTrendPercent(readsData);
  const writesTrend = getTrendPercent(writesData);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--color-panel-bg-secondary)',
        padding: '20px',
        overflow: 'auto',
      }}
    >
      <Card
        title="Table metrics"
        style={{ maxWidth: '100%', overflow: 'auto' }}
        action={
          <span style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
            Table{' '}
            <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>{tableName}</code>
          </span>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-panel-text-secondary)' }}>
            Reads and writes over the last hour. Values are aggregated into fixed time buckets.
          </p>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)' }}>
              Updated {formatTime(lastUpdated)} • Auto‑refreshing every 30s
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <StatsCard label="Total reads (1h)" value={formatNumber(readsTotal)} color="var(--color-panel-accent)" />
          <StatsCard label="Total writes (1h)" value={formatNumber(writesTotal)} color="var(--color-panel-warning)" />
          <StatsCard label="Peak throughput" value={formatNumber(peakValue)} color="var(--color-panel-text)" />
        </div>

        <div
          style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          <MetricDetailCard
            title="Reads overview"
            latestLabel="Current interval"
            latestValue={formatNumber(latestReads)}
            averageValue={formatNumber(avgReads)}
            trend={readsTrend}
            color="var(--color-panel-accent)"
          />
          <MetricDetailCard
            title="Writes overview"
            latestLabel="Current interval"
            latestValue={formatNumber(latestWrites)}
            averageValue={formatNumber(avgWrites)}
            trend={writesTrend}
            color="var(--color-panel-warning)"
          />
        </div>

        <div
          style={{
            marginTop: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          <MetricChartCard
            title="Reads"
            description="Rows read per interval"
            data={readsData}
            color="var(--color-panel-accent)"
            loading={isLoading}
            error={error}
          />
          <MetricChartCard
            title="Writes"
            description="Rows written per interval"
            data={writesData}
            color="var(--color-panel-warning)"
            loading={isLoading}
            error={error}
          />
        </div>
      </Card>
    </div>
  );
};

const StatsCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div
    style={{
      backgroundColor: 'var(--color-panel-bg)',
      border: '1px solid var(--color-panel-border)',
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    }}
  >
    <span style={{ fontSize: 11, color: 'var(--color-panel-text-muted)' }}>{label}</span>
    <span style={{ fontSize: 18, fontWeight: 600, color }}>{value}</span>
  </div>
);

const MetricDetailCard = ({
  title,
  latestLabel,
  latestValue,
  averageValue,
  trend,
  color,
}: {
  title: string;
  latestLabel: string;
  latestValue: string;
  averageValue: string;
  trend: number;
  color: string;
}) => (
  <div
    style={{
      backgroundColor: 'var(--color-panel-bg)',
      border: '1px solid var(--color-panel-border)',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '13px', color: 'var(--color-panel-text)' }}>{title}</div>
      <span
        style={{
          fontSize: '11px',
          padding: '2px 8px',
          borderRadius: '999px',
          backgroundColor: 'var(--color-panel-bg-secondary)',
          color: 'var(--color-panel-text-muted)',
        }}
      >
        Last hour
      </span>
    </div>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)', marginBottom: '4px' }}>
        {latestLabel}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, color }}>{latestValue}</div>
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--color-panel-text-muted)',
      }}
    >
      <span>
        Avg per interval{' '}
        <strong style={{ color: 'var(--color-panel-text)' }}>{averageValue}</strong>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            color: trend >= 0 ? color : 'var(--color-panel-error)',
            fontWeight: 600,
          }}
        >
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </span>
        <span>vs start</span>
      </span>
    </div>
  </div>
);

interface MetricChartCardProps {
  title: string;
  description: string;
  data: TimeseriesBucket[];
  color: string;
  loading: boolean;
  error: string | null;
}

const formatAxisLabel = (date: Date | undefined) =>
  date
    ? date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const MetricChartCard: React.FC<MetricChartCardProps> = ({
  title,
  description,
  data,
  color,
  loading,
  error,
}) => {
  const sanitized = useMemo(() => data.filter((bucket) => typeof bucket.metric === 'number'), [data]);
  const maxValue = useMemo(() => {
    const values = sanitized.map((bucket) => bucket.metric || 0);
    return values.length ? Math.max(...values, 1) : 1;
  }, [sanitized]);

  const chartWidth = 320;
  const chartHeight = 140;
  const padding = 8;

  const chartPath = useMemo(() => {
    if (sanitized.length === 0) return '';
    return sanitized
      .map((bucket, index) => {
        const x =
          sanitized.length === 1
            ? chartWidth
            : (index / (sanitized.length - 1)) * chartWidth;
        const value = bucket.metric || 0;
        const normalized = maxValue === 0 ? 0 : value / maxValue;
        const y = chartHeight - normalized * (chartHeight - padding) + padding / 2;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [sanitized, maxValue]);

  const gradientId = useMemo(
    () => `table-metric-${title.toLowerCase().replace(/\s+/g, '-')}`,
    [title]
  );

  const renderBody = () => {
    if (loading) {
      return (
        <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
          Loading chart…
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ fontSize: '12px', color: 'var(--color-panel-error)' }}>
          {error}
        </div>
      );
    }

    if (sanitized.length === 0 || !chartPath) {
      return (
        <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
          No data available.
        </div>
      );
    }

    const areaPath = `${chartPath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    const startLabel = formatAxisLabel(sanitized[0]?.time);
    const endLabel = formatAxisLabel(sanitized[sanitized.length - 1]?.time);

    return (
      <>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: 180 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke="var(--color-panel-border)"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.4"
            />
          ))}
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path
            d={chartPath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--color-panel-text-muted)',
            marginTop: '4px',
          }}
        >
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </>
    );
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-panel-bg)',
        border: '1px solid var(--color-panel-border)',
        borderRadius: 12,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 20px 35px rgba(0, 0, 0, 0.25)',
        overflow: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-panel-text)' }}>
            {title}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>
            {description}
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: 'var(--color-panel-bg-secondary)',
            color: 'var(--color-panel-text-muted)',
          }}
        >
          Last hour
        </span>
      </div>
      {renderBody()}
    </div>
  );
};

