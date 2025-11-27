import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConvexReactClient, useConvex } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import { Toaster } from 'sonner';
import { useOAuth } from './hooks/useOAuth';
import { MainViews } from './components/main-view';
import { BottomSheet } from './components/bottom-sheet';
import { AuthPanel } from './components/auth-panel';
import { getConvexUrl, getOAuthConfigFromEnv, getEnvVar } from './utils/env';
import { extractProjectName } from './utils/api';
import { getStorageItem, setStorageItem } from './utils/storage';
import { STORAGE_KEYS } from './utils/constants';

export interface Team {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  teamId: string;
}

export interface ConvexPanelProps {
  convex?: ConvexReactClient | any; // Use 'any' to avoid ESM/CJS type conflicts
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
  mockup?: boolean; // Show panel with mock data without authentication
  teamSlug?: string; // Team slug for dashboard link (e.g., 'idylcode')
  projectSlug?: string; // Project slug for dashboard link (e.g., 'deskforge')
  team?: Team; // Current team
  project?: Project; // Current project
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
  const [isOpen, setIsOpen] = useState(true); // Start open by default
  // Load active tab from localStorage on initialization
  const [activeTab, setActiveTab] = useState<'health' | 'data' | 'functions' | 'files' | 'schedules' | 'logs' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<'health' | 'data' | 'functions' | 'files' | 'schedules' | 'logs' | 'settings'>(
        STORAGE_KEYS.ACTIVE_TAB, 
        'health'
      );
    }
    return 'health';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Try to get Convex client from context if not provided
  // Always call useConvex (rules of hooks), but handle if not in provider
  let convexFromContext: any;
  try {
    convexFromContext = useConvex();
  } catch (e) {
    // Not in ConvexProvider context, that's okay
    convexFromContext = undefined;
  }

  // Auto-detect configuration from environment variables if not provided
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
  
  // Debug logging (only once on mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && !mockup && !providedOAuthConfig && envOAuthConfig) {
    }
  }, []); // Only run once on mount
  const accessToken = providedAccessToken || getEnvVar('NEXT_PUBLIC_CONVEX_ACCESS_TOKEN') || getEnvVar('VITE_CONVEX_ACCESS_TOKEN');
  const deployKey = providedDeployKey || getEnvVar('NEXT_PUBLIC_CONVEX_DEPLOY_KEY') || getEnvVar('VITE_CONVEX_DEPLOY_KEY');

  // OAuth authentication (skip if mockup mode)
  const oauth = useOAuth(mockup ? null : (oauthConfig || null));
  
  // Determine which token to use (OAuth or manual)
  // In mockup mode, skip authentication
  const effectiveAccessToken = mockup ? undefined : (oauth.token?.access_token || accessToken || undefined);
  const hasAuth = mockup ? true : (oauth.isAuthenticated || !!accessToken);

  // Update authenticated state when auth status changes
  useEffect(() => {
    setIsAuthenticated(hasAuth);
  }, [hasAuth]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create admin client - use OAuth token or deployKey
  const convexUrl = deployUrl;
  const adminClient = useMemo(() => {
    if (!isMounted) return null;
    // Create adminClient if we have a URL and either deployKey or OAuth token
    if (convexUrl && (deployKey || effectiveAccessToken)) {
      return new ConvexClient(convexUrl);
    }
    return null;
  }, [convexUrl, deployKey, effectiveAccessToken, isMounted]);

  // Set admin auth - prefer deployKey, fall back to OAuth token
  useEffect(() => {
    if (!isMounted || !adminClient) return;
    
    // Use deployKey if available, otherwise use OAuth token
    const authToken = deployKey || effectiveAccessToken;
    if (authToken) {
      (adminClient as any).setAdminAuth(authToken);
    }
  }, [adminClient, deployKey, effectiveAccessToken, isMounted]);

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
    if (!hasAuth) return;
    setIsOpen(prev => !prev);
  }, [hasAuth]);

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
        projectName={convexUrl ? extractProjectName(convexUrl) : undefined}
        deploymentUrl={convexUrl}
        environment="development"
        isAuthenticated={isAuthenticated}
        oauthConfig={oauthConfig || undefined}
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
                baseUrl: convexUrl,
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
