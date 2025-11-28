import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexHttpClient, ConnectionState } from 'convex/browser';
import { ConvexClient } from 'convex/browser';

export interface DeploymentInfo {
  deploymentUrl: string;
  adminKey: string;
  adminClient: ConvexReactClient | ConvexClient | null;
  httpClient: ConvexHttpClient | null;
  isConnected: boolean;
  connectionState: ConnectionState | null;
}

interface DeploymentContextValue {
  deployment: DeploymentInfo;
  isDisconnected: boolean;
  refreshConnection: () => void;
}

const DeploymentContext = createContext<DeploymentContextValue | null>(null);

interface DeploymentProviderProps {
  children: React.ReactNode;
  deploymentUrl?: string;
  adminKey?: string;
  accessToken?: string;
  deployKey?: string;
}

const CONNECTION_STATE_CHECK_INTERVAL_MS = 2500;

export function DeploymentProvider({
  children,
  deploymentUrl: propDeploymentUrl,
  adminKey: propAdminKey,
  accessToken,
  deployKey,
}: DeploymentProviderProps) {
  const [deployment, setDeployment] = useState<DeploymentInfo>({
    deploymentUrl: propDeploymentUrl || '',
    adminKey: propAdminKey || deployKey || '',
    adminClient: null,
    httpClient: null,
    isConnected: false,
    connectionState: null,
  });

  const [isDisconnected, setIsDisconnected] = useState(false);
  const [lastObservedConnectionState, setLastObservedConnectionState] = useState<{
    state: ConnectionState;
    time: Date;
  } | null>(null);

  // Get admin key from localStorage if not provided
  useEffect(() => {
    const getAdminKey = () => {
      if (propAdminKey || deployKey) {
        return propAdminKey || deployKey;
      }
      
      // Try to get from localStorage
      try {
        const oauthToken = localStorage.getItem('convex-panel-oauth-token');
        if (oauthToken) {
          const parsed = JSON.parse(oauthToken);
          return parsed.accessToken || parsed.adminKey;
        }
      } catch (err) {
        console.warn('Error reading admin key from localStorage:', err);
      }
      
      return '';
    };

    const adminKey = getAdminKey();
    if (adminKey && propDeploymentUrl) {
      setDeployment(prev => ({
        ...prev,
        adminKey,
        deploymentUrl: propDeploymentUrl,
      }));
    }
  }, [propDeploymentUrl, propAdminKey, deployKey, accessToken]);

  // Create admin client
  useEffect(() => {
    if (!deployment.deploymentUrl || !deployment.adminKey) {
      return;
    }

    let client: ConvexReactClient | ConvexClient;
    
    try {
      // Try ConvexReactClient first
      client = new ConvexReactClient(deployment.deploymentUrl, {
        reportDebugInfoToConvex: true,
      });
      
      // Set admin auth
      if (client && typeof (client as any).setAdminAuth === 'function') {
        (client as any).setAdminAuth(deployment.adminKey);
      }
    } catch (err) {
      // Fallback to ConvexClient
      try {
        client = new ConvexClient(deployment.deploymentUrl);
        if (client && typeof (client as any).setAdminAuth === 'function') {
          (client as any).setAdminAuth(deployment.adminKey);
        }
      } catch (fallbackErr) {
        console.error('Error creating Convex client:', fallbackErr);
        return;
      }
    }

    // Create HTTP client
    const httpClient = new ConvexHttpClient(deployment.deploymentUrl);
    if (httpClient && typeof (httpClient as any).setAdminAuth === 'function') {
      (httpClient as any).setAdminAuth(deployment.adminKey);
    }

    setDeployment(prev => ({
      ...prev,
      adminClient: client,
      httpClient,
    }));

    return () => {
      if (client && typeof (client as any).close === 'function') {
        (client as any).close();
      }
    };
  }, [deployment.deploymentUrl, deployment.adminKey]);

  // Monitor connection state
  useEffect(() => {
    if (!deployment.adminClient) return;

    const checkConnection = setInterval(() => {
      try {
        const connectionState = (deployment.adminClient as any).connectionState?.();
        
        if (connectionState) {
          setDeployment(prev => ({
            ...prev,
            connectionState,
            isConnected: connectionState.isWebSocketConnected === true,
          }));

          // Check if disconnected
          if (lastObservedConnectionState) {
            const timeSinceLastState = Date.now() - lastObservedConnectionState.time.getTime();
            
            if (
              connectionState.isWebSocketConnected === false &&
              lastObservedConnectionState.state.isWebSocketConnected === false &&
              timeSinceLastState < CONNECTION_STATE_CHECK_INTERVAL_MS * 2
            ) {
              setIsDisconnected(true);
            } else if (connectionState.isWebSocketConnected === true) {
              setIsDisconnected(false);
            }
          }

          setLastObservedConnectionState({
            state: connectionState,
            time: new Date(),
          });
        }
      } catch (err) {
        // Connection state might not be available
        console.warn('Error checking connection state:', err);
      }
    }, CONNECTION_STATE_CHECK_INTERVAL_MS);

    return () => clearInterval(checkConnection);
  }, [deployment.adminClient, lastObservedConnectionState]);

  const refreshConnection = useCallback(() => {
    // Force re-creation of clients
    setDeployment(prev => ({
      ...prev,
      adminClient: null,
      httpClient: null,
    }));
  }, []);

  const value = useMemo(
    () => ({
      deployment,
      isDisconnected,
      refreshConnection,
    }),
    [deployment, isDisconnected, refreshConnection]
  );

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment(): DeploymentContextValue {
  const context = useContext(DeploymentContext);
  if (!context) {
    throw new Error('useDeployment must be used within a DeploymentProvider');
  }
  return context;
}

export function useDeploymentUrl(): string {
  const { deployment } = useDeployment();
  return deployment.deploymentUrl;
}

export function useAdminKey(): string {
  const { deployment } = useDeployment();
  return deployment.adminKey;
}

export function useAdminClient(): ConvexReactClient | ConvexClient | null {
  const { deployment } = useDeployment();
  return deployment.adminClient;
}

export function useHttpClient(): ConvexHttpClient | null {
  const { deployment } = useDeployment();
  return deployment.httpClient;
}

export function useDeploymentIsDisconnected(): boolean {
  const { isDisconnected } = useDeployment();
  return isDisconnected;
}

export function useDeploymentConnectionState(): ConnectionState | null {
  const { deployment } = useDeployment();
  return deployment.connectionState;
}

