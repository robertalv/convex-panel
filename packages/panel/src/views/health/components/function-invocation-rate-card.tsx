import React, { useState, useEffect, useMemo } from 'react';
import { HealthCard } from './health-card';
import { FunctionRateChart } from './function-rate-chart';
import type { APIResponse } from '../types';
import { transformToChartData, getTimeRange } from '../utils';
import { fetchUdfRate } from '../../../utils/api/metrics';

interface FunctionInvocationRateCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

export const FunctionInvocationRateCard: React.FC<FunctionInvocationRateCardProps> = ({
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
        const result = await fetchUdfRate(deploymentUrl, authToken, useMockData);
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch function invocation rate');
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
    // Transform data to chart format
    // UDF rate data comes in APIResponse format: Array<[string, TimeSeriesData]>
    if (!data) {
      return { timestamps: [], functionData: new Map() };
    }

    // If data is already in APIResponse format (Array<[string, TimeSeriesData]>)
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0].length === 2) {
      // Check if it's the correct format
      const firstItem = data[0];
      if (typeof firstItem[0] === 'string' && Array.isArray(firstItem[1])) {
        return transformToChartData(data as APIResponse, 'failureRate');
      }
    }

    return { timestamps: [], functionData: new Map() };
  }, [data]);

  const timeRange = useMemo(() => {
    return getTimeRange(data);
  }, [data]);

  return (
    <HealthCard
      title="Function Invocation Rate"
      tip="The number of function invocations per minute across all functions, showing overall system activity."
      loading={loading}
      error={error}
    >
      <FunctionRateChart chartData={chartData} timeRange={timeRange} kind="failureRate" />
    </HealthCard>
  );
};







