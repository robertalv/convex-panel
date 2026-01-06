import React, { useState, useEffect } from 'react';
import { GitBranch, Loader2, TrendingUp } from 'lucide-react';
import { Card } from '../../../components/shared/card';
import { getDeploymentCorrelations, getRecentCorrelations, type DeploymentCorrelation } from '../../../utils/api/aiAnalysis';

export const DeploymentCorrelationCard: React.FC<{
  adminClient?: any;
  deploymentId?: string;
}> = ({ adminClient, deploymentId }) => {
  const [correlations, setCorrelations] = useState<DeploymentCorrelation[]>([]);
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
        const data = deploymentId
          ? await getDeploymentCorrelations(adminClient, deploymentId)
          : await getRecentCorrelations(adminClient, { limit: 5 });
        if (mounted) {
          setCorrelations(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch correlations');
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
  }, [adminClient, deploymentId]);

  if (!adminClient) {
    return null;
  }

  return (
    <Card
      title={deploymentId ? "Deployment Correlation" : "Recent Correlations"}
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
          AI Analysis
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', alignItems: 'center' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-panel-text-muted)' }} />
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>Analyzing correlations...</div>
          </div>
        )}
        {!loading && error && (
          <div style={{ padding: '16px', color: 'var(--color-panel-error)', fontSize: '12px' }}>
            {error}
          </div>
        )}
        {!loading && !error && correlations.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
            <GitBranch size={24} style={{ color: 'var(--color-panel-text-muted)', marginBottom: '8px' }} />
            <div style={{ fontSize: '12px', color: 'var(--color-panel-text-muted)' }}>No correlations found</div>
            <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', marginTop: '4px', textAlign: 'center' }}>
              {deploymentId
                ? 'This deployment has no correlated errors'
                : 'No deployment-error correlations available. Correlations are created when errors are analyzed.'}
            </div>
          </div>
        )}
        {!loading && !error && correlations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
            {correlations
              .sort((a, b) => b.correlationScore - a.correlationScore)
              .slice(0, 3)
              .map((correlation, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-panel-bg-tertiary)',
                    border: '1px solid var(--color-panel-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={14} style={{ color: 'var(--color-panel-accent)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-panel-text)' }}>
                        Correlation Score
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color:
                          correlation.correlationScore > 0.7
                            ? 'var(--color-panel-error)'
                            : correlation.correlationScore > 0.5
                            ? '#ff9800'
                            : 'var(--color-panel-text)',
                      }}
                    >
                      {Math.round(correlation.correlationScore * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', marginBottom: '6px' }}>
                    Reasoning:
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-panel-text-secondary)', marginBottom: '8px' }}>
                    {correlation.reasoning.length > 120 ? `${correlation.reasoning.substring(0, 120)}...` : correlation.reasoning}
                  </div>
                  {correlation.affectedFunctions.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-panel-border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-panel-text-muted)', marginBottom: '4px' }}>Affected Functions:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {correlation.affectedFunctions.slice(0, 3).map((fn, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-panel-bg-secondary)',
                              color: 'var(--color-panel-text-secondary)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {fn}
                          </span>
                        ))}
                        {correlation.affectedFunctions.length > 3 && (
                          <span style={{ fontSize: '10px', color: 'var(--color-panel-text-muted)' }}>
                            +{correlation.affectedFunctions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
};







