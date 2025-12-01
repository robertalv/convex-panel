import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ConvexReactClient, useConvex } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import { Toaster } from 'sonner';
import { useOAuth, UseOAuthReturn } from './hooks/useOAuth';
import { MainViews } from './components/main-view';
import { BottomSheet } from './components/bottom-sheet';
import { AuthPanel } from './components/auth-panel';
import { getConvexUrl, getOAuthConfigFromEnv, isDevelopment } from './utils/env';
import { extractProjectName, getTeamTokenFromEnv } from './utils/api';
import { Team, Project } from './types';
import { useActiveTab } from './hooks/useActiveTab';
import { ThemeProvider, Theme, useTheme } from './hooks/useTheme';
import { SheetProvider } from './contexts/sheet-context';
import { ConfirmDialogProvider } from './contexts/confirm-dialog-context';
import { getStorageItem, setStorageItem } from './utils/storage';
import { STORAGE_KEYS } from './utils/constants';

const ThemedToaster: React.FC = () => {
  const { theme } = useTheme();
  return (
    <div className={`cp-theme-${theme}`}>
      <Toaster position="bottom-right" />
    </div>
  );
};
export interface ConvexPanelProps {
  convex?: ConvexReactClient | any;
  accessToken?: string;
  teamAccessToken?: string;
  deployUrl?: string;
  deployKey?: string;
  oauthConfig?: {
    clientId: string;
    redirectUri: string;
    scope?: 'team' | 'project';
    tokenExchangeUrl?: string;
  };
  /** Optional custom authentication implementation. If provided, internal OAuth logic is skipped. */
  auth?: UseOAuthReturn;
  useMockData?: boolean;
  mockup?: boolean;
  teamSlug?: string;
  projectSlug?: string;
  team?: Team;
  project?: Project;
  /** Initial theme for the panel. Defaults to 'dark'. User's preference is persisted in localStorage. */
  defaultTheme?: Theme;
  [key: string]: any;
}

const ConvexPanel: React.FC<ConvexPanelProps> = ({
  convex: providedConvex,
  accessToken: providedAccessToken,
  teamAccessToken: providedTeamAccessToken,
  deployUrl: providedDeployUrl,
  deployKey: providedDeployKey,
  oauthConfig: providedOAuthConfig,
  auth: providedAuth,
  useMockData = false,
  mockup = false,
  teamSlug,
  projectSlug,
  team,
  project,
  defaultTheme = 'dark',
  onError,
  theme,
  mergedTheme,
  settings,
  ...restProps
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<boolean>(STORAGE_KEYS.BOTTOM_SHEET_EXPANDED, true);
    }
    return true;
  });
  const [activeTab, setActiveTab] = useActiveTab();

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

  // Automatically get teamAccessToken from environment if not provided
  const envTeamAccessToken = useMemo(() => {
    if (providedTeamAccessToken) return providedTeamAccessToken;
    return getTeamTokenFromEnv() || undefined;
  }, [providedTeamAccessToken]);

  // OAuth authentication (skip if mockup mode or auth provided)
  const internalAuth = useOAuth(mockup || providedAuth ? null : (oauthConfig || null));
  const oauth = providedAuth || internalAuth;

  // Determine which token to use (OAuth or manual)
  // In mockup mode, skip authentication
  const effectiveAccessToken = mockup ? undefined : (oauth.token?.access_token || providedAccessToken || undefined);
  const isAuthenticated = mockup ? true : (oauth.isAuthenticated || !!providedAccessToken);

  // Set mounted state and inject analytics script
  useEffect(() => {
    setIsMounted(true);

    // Inject visitors.now analytics script
    if (typeof document !== 'undefined') {
      const scriptId = 'visitors-now-script';
      // Check if script already exists
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.visitors.now/v.js';
        script.setAttribute('data-token', 'f306f3ae-cc04-42bd-8d48-66531197290d');
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  // Persist bottom sheet expanded state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStorageItem(STORAGE_KEYS.BOTTOM_SHEET_EXPANDED, isOpen);
    }
  }, [isOpen]);

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

  // Don't render during SSR
  if (typeof window === 'undefined') {
    return null;
  }

  if (!isDevelopment()) {
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
    <ThemeProvider defaultTheme={defaultTheme}>
      <SheetProvider>
        <ConfirmDialogProvider>
          <ThemedToaster />
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
                teamAccessToken: envTeamAccessToken,
                deployUrl: deployUrl,
                baseUrl: deployUrl,
                adminClient: adminClient,
                useMockData: mockup || useMockData || !effectiveAccessToken,
                onError,
                theme,
                mergedTheme,
                settings,
                teamSlug,
                projectSlug,
                // Allow any other props that might be needed by child components
                ...restProps
              }}
            />
          )}
        </BottomSheet>
        </ConfirmDialogProvider>
      </SheetProvider>
    </ThemeProvider>
  );
};

export default ConvexPanel;
