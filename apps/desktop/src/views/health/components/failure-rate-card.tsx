import React, { useState, useEffect, useMemo } from 'react';
import { HealthCard } from './health-card';
import { FunctionRateChart } from './function-rate-chart';
import type { APIResponse } from "@convex-panel/shared";
import { transformToChartData, getTimeRange } from '../utils';
import { fetchFailureRate } from '../../../utils/api/metrics';

interface FailureRateCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

export const FailureRateCard: React.FC<FailureRateCardProps> = ({
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
        const result = await fetchFailureRate(deploymentUrl, authToken, useMockData);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch failure rate');
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
    return transformToChartData(data, 'failureRate');
  }, [data]);

  const timeRange = useMemo(() => {
    return getTimeRange(data);
  }, [data]);

  return (
    <HealthCard
      title="Failure Rate"
      tip="The failure rate of all your running functions, bucketed by minute."
      loading={loading}
      error={error}
    >
      <FunctionRateChart chartData={chartData} timeRange={timeRange} kind="failureRate" />
    </HealthCard>
  );
};

