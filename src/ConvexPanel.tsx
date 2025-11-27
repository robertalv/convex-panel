import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConvexReactClient, useConvex } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import { Toaster } from 'sonner';
import { useOAuth } from './hooks/useOAuth';
import { MainViews } from './components/main-view';
import { BottomSheet } from './components/bottom-sheet';
import { AuthPanel } from './components/auth-panel';
import { getConvexUrl, getOAuthConfigFromEnv } from './utils/env';
import { extractProjectName } from './utils/api';
import { getStorageItem, setStorageItem } from './utils/storage';
import { STORAGE_KEYS } from './utils/constants';
import { TabId } from './types/tabs';
import { Team, Project } from './types';

export interface ConvexPanelProps {
  convex?: ConvexReactClient | any;
  accessToken?: string;
  deployUrl?: string;
  deployKey?: string;
  oauthConfig?: {
    clientId: string;
    redirectUri: string;
    scope?: 'team' | 'project';
    tokenExchangeUrl?: string;
  };
  useMockData?: boolean;
  mockup?: boolean;
  teamSlug?: string;
  projectSlug?: string;
  team?: Team;
  project?: Project;
  [key: string]: any;
}

const ConvexPanel: React.FC<ConvexPanelProps> = ({
  convex: providedConvex,
  accessToken: providedAccessToken,
  deployUrl: providedDeployUrl,
  deployKey: providedDeployKey,
  oauthConfig: providedOAuthConfig,
  useMockData = false,
  mockup = false,
  teamSlug,
  projectSlug,
  team,
  project,
  ...props
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<TabId>(
        STORAGE_KEYS.ACTIVE_TAB, 
        'health'
      );
    }
    return 'health';
  });

  let convexFromContext: any;
  try {
    convexFromContext = useConvex();
  } catch (e) {
    convexFromContext = undefined;
  }

  const convex = providedConvex || convexFromContext;
  const deployUrl = providedDeployUrl || getConvexUrl();
  
  // Memoize OAuth config to prevent infinite loops (new object on every render)
  // Environment variables don't change during runtime, so we can safely memoize
  const envOAuthConfig = useMemo(() => {
    if (mockup) return undefined;
    const config = getOAuthConfigFromEnv();
    // Return undefined if no config, otherwise return a stable object
    return config || undefined;
  }, [mockup]); // Only recalculate if mockup changes
  
  const oauthConfig = providedOAuthConfig || envOAuthConfig;

  // OAuth authentication (skip if mockup mode)
  const oauth = useOAuth(mockup ? null : (oauthConfig || null));
  
  // Determine which token to use (OAuth or manual)
  // In mockup mode, skip authentication
  const effectiveAccessToken = mockup ? undefined : (oauth.token?.access_token || providedAccessToken || undefined);
  const isAuthenticated = mockup ? true : (oauth.isAuthenticated || !!providedAccessToken);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create admin client - use OAuth token or deployKey
  const adminClient = useMemo(() => {
    if (!isMounted) return null;
    // Create adminClient if we have a URL and either deployKey or OAuth token
    if (deployUrl && (providedDeployKey || effectiveAccessToken)) {
      return new ConvexClient(deployUrl);
    }
    return null;
  }, [deployUrl, providedDeployKey, effectiveAccessToken, isMounted]);

  // Set admin auth - prefer deployKey, fall back to OAuth token
  useEffect(() => {
    if (!isMounted || !adminClient) return;
    
    // Use deployKey if available, otherwise use OAuth token
    const authToken = providedDeployKey || effectiveAccessToken;
    if (authToken) {
      (adminClient as any).setAdminAuth(authToken);
    }
  }, [adminClient, providedDeployKey, effectiveAccessToken, isMounted]);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    if (activeTab) {
      setStorageItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }
  }, [activeTab]);

  // Don't render during SSR
  if (typeof window === 'undefined') {
    return null;
  }

  const toggleOpen = useCallback(() => {
    // Don't allow expansion if not authenticated
    if (!isAuthenticated) return;
    setIsOpen(prev => !prev);
  }, [isAuthenticated]);

  const handleConnect = useCallback(async () => {
    if (!oauthConfig) {
      return;
    }
    if (!oauth.authenticate) {
      return;
    }
    try {
      await oauth.authenticate();
    } catch (error) {
      console.error('[ConvexPanel] Authentication error:', error);
    }
  }, [oauthConfig, oauth]);

  // Root container with scoped styles - no CSS imports
  return (
    <>
      <Toaster position="bottom-right" />
      <BottomSheet 
        isOpen={isAuthenticated ? isOpen : false} 
        onClose={toggleOpen}
        projectName={deployUrl ? extractProjectName(deployUrl) : undefined}
        deploymentUrl={deployUrl}
        environment="development"
        isAuthenticated={isAuthenticated}
        oauthConfig={oauthConfig}
        onConnect={handleConnect}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        adminClient={adminClient}
        accessToken={effectiveAccessToken}
        teamSlug={teamSlug}
        projectSlug={projectSlug}
        team={team}
        project={project}
      >
        {!isAuthenticated ? (
          <AuthPanel
            oauthConfig={oauthConfig}
            onConnect={handleConnect}
            error={oauth.error}
            isLoading={oauth.isLoading}
          />
        ) : (
          <MainViews
            activeTab={activeTab}
            containerProps={{
              convex: convex,
              accessToken: effectiveAccessToken || '',
              deployUrl: deployUrl,
              baseUrl: deployUrl,
              adminClient: adminClient,
              useMockData: mockup || useMockData || !effectiveAccessToken,
              ...props
            }}
          />
        )}
      </BottomSheet>
    </>
  );
};

export default ConvexPanel;
