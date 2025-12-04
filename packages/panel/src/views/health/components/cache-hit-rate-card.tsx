import React, { useState, useEffect, useMemo } from 'react';
import { HealthCard } from './health-card';
import { FunctionRateChart } from './function-rate-chart';
import type { APIResponse } from '../types';
import { transformToChartData, getTimeRange } from '../utils';
import { fetchCacheHitRate } from '../../../utils/api/metrics';

interface CacheHitRateCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

export const CacheHitRateCard: React.FC<CacheHitRateCardProps> = ({
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
        const result = await fetchCacheHitRate(deploymentUrl, authToken, useMockData);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch cache hit rate');
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

  const chartData = useMemo(() => {
    return transformToChartData(data, 'cacheHitRate');
  }, [data]);

  const timeRange = useMemo(() => {
    return getTimeRange(data);
  }, [data]);

  return (
    <HealthCard
      title="Cache Hit Rate"
      tip="The cache hit rate of all your running query functions, bucketed by minute."
      loading={loading}
      error={error}
    >
      <FunctionRateChart chartData={chartData} timeRange={timeRange} kind="cacheHitRate" />
    </HealthCard>
  );
};

