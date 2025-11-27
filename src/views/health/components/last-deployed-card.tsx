import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { HealthCard } from './health-card';
import { TimestampDistance } from './timestamp-distance';
import { fetchLastPushEvent, fetchServerVersion } from '../../../utils/api';

interface LastDeployedCardProps {
  deploymentUrl?: string;
  authToken: string;
  useMockData?: boolean;
}

export const LastDeployedCard: React.FC<LastDeployedCardProps> = ({
  deploymentUrl,
  authToken,
  useMockData = false,
}) => {
  const [lastDeployed, setLastDeployed] = useState<Date | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>();

  // Fetch last deployed time and version
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

        // Fetch both in parallel
        const [pushEvent, serverVersion] = await Promise.all([
          fetchLastPushEvent(deploymentUrl, authToken, useMockData),
          fetchServerVersion(deploymentUrl, authToken, useMockData),
        ]);

        if (!mounted) return;

        if (pushEvent && pushEvent._creationTime) {
          setLastDeployed(new Date(pushEvent._creationTime));
        } else {
          setLastDeployed(null);
        }

        setVersion(serverVersion);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch deployment info');
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

  // Check for Convex version updates
  useEffect(() => {
    if (!version) return;

    let isMounted = true;

    async function checkVersion() {
      try {
        const response = await fetch('https://registry.npmjs.org/convex/latest');
        if (!response.ok) return;

        const data = await response.json();
        if (!isMounted) return;

        setLatestVersion(data.version);

        if (version && data.version) {
          // Simple version comparison without semver
          const currentParts = version.split('.').map(Number);
          const latestParts = data.version.split('.').map(Number);
          
          if (currentParts.length === 3 && latestParts.length === 3) {
            const isHigherMajor = latestParts[0] > currentParts[0];
            const isHigherMinor = 
              latestParts[0] === currentParts[0] && 
              latestParts[1] > currentParts[1];
            const hasNewVersion = isHigherMajor || isHigherMinor;
            setHasUpdate(hasNewVersion);
          }
        }
      } catch (e) {
        // Swallow any errors and don't show update notice
      }
    }

    void checkVersion();

    return () => {
      isMounted = false;
    };
  }, [version]);

  const getUpdateType = (): string => {
    if (!version || !latestVersion) return '';
    const currentMajor = version.split('.')[0];
    const latestMajor = latestVersion.split('.')[0];
    const currentMinor = version.split('.')[1];
    const latestMinor = latestVersion.split('.')[1];

    if (latestMajor !== currentMajor) return 'major';
    if (latestMinor !== currentMinor) return 'minor';
    return 'patch';
  };

  return (
    <HealthCard
      title="Last Deployed"
      tip="The last time functions were deployed."
      loading={loading}
      error={error}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px 8px',
        }}
      >
        {loading ? (
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Loading...</span>
        ) : !lastDeployed ? (
          <span
            style={{
              fontSize: '14px',
              color: '#9ca3af',
            }}
          >
            Never
          </span>
        ) : (
          <TimestampDistance date={lastDeployed} live />
        )}

        {version && (
          <div
            style={{
              display: 'flex',
              height: '32px',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#9ca3af',
                fontFamily: 'monospace',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '3px 6px',
                borderRadius: '4px',
              }}
            >
              Convex v{version}
            </span>
            {hasUpdate && latestVersion && (
              <a
                href="https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md#changelog"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#9ca3af',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                title={`A ${getUpdateType()} update is available for Convex (${version} → ${latestVersion})`}
              >
                <ArrowUp size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </HealthCard>
  );
};

