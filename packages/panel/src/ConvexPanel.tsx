import { useState, useEffect, useMemo, useCallback } from 'react';
import { ConvexReactClient, useConvex } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import { ToastProvider } from './components/toast';
import { useOAuth } from './hooks/useOAuth';
import type { UseOAuthReturn } from './hooks/useOAuth';
import { MainViews } from './components/main-view';
import { BottomSheet } from './components/bottom-sheet';
import { AuthPanel } from './components/auth-panel';
import { OAuthErrorPopup } from './components/oauth-error-popup';
import { getConvexUrl, getOAuthConfigFromEnv, isDevelopment } from './utils/env';
import { getTeamTokenFromEnv } from './utils/api/utils';
import type { Team, Project } from './types';
import { useActiveTab } from './hooks/useActiveTab';
import { ThemeProvider } from './hooks/useTheme';
import type { Theme } from './hooks/useTheme';
import { SheetProvider } from './contexts/sheet-context';
import { ConfirmDialogProvider } from './contexts/confirm-dialog-context';
import { PortalProvider } from './contexts/portal-context';
import { getStorageItem, setStorageItem } from './utils/storage';
import { STORAGE_KEYS } from './utils/constants';
import { setupGlobalErrorHandling } from './utils/error-handling';

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
  /** Force display the panel even if not in development mode (useful for testing) */
  forceDisplay?: boolean;
  teamSlug?: string;
  projectSlug?: string;
  team?: Team;
  project?: Project;
  /** Initial theme for the panel. Defaults to 'dark'. User's preference is persisted in localStorage. */
  defaultTheme?: Theme;
  /** Optional portal container for overlays rendered from within the panel */
  portalContainer?: Element | DocumentFragment | null;
  [key: string]: any;
}

const ConvexPanel = ({
  convex: providedConvex,
  accessToken: providedAccessToken,
  teamAccessToken: providedTeamAccessToken,
  deployUrl: providedDeployUrl,
  deployKey: providedDeployKey,
  oauthConfig: providedOAuthConfig,
  auth: providedAuth,
  useMockData = false,
  mockup = false,
  forceDisplay = false,
  teamSlug,
  projectSlug,
  team,
  project,
  defaultTheme = 'dark',
  onError,
  theme,
  mergedTheme,
  settings,
  portalContainer,
  ...restProps
}: ConvexPanelProps) => {
  // Set up global error handling on mount
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<boolean>(STORAGE_KEYS.BOTTOM_SHEET_EXPANDED, true);
    }
    return true;
  });
  const [activeTab, setActiveTab] = useActiveTab();

  let convexFromContext: any;
  let convexError: Error | null = null;
  try {
    convexFromContext = useConvex();
  } catch (e) {
    convexError = e instanceof Error ? e : new Error(String(e));
    convexFromContext = undefined;
    if (typeof window !== 'undefined' && isDevelopment()) {
      console.warn('[ConvexPanel] useConvex() failed:', convexError.message);
    }
  }

  const convex = providedConvex || convexFromContext;
  
  const deployUrlFromClient = useMemo(() => {
    if (convex) {
      const url = 
        (convex as any).address || 
        (convex as any)._baseUrl || 
        (convex as any).baseUrl ||
        (convex as any).url ||
        (convex as any)?._client?.address ||
        (convex as any)?._client?._baseUrl ||
        (convex as any)?._client?.baseUrl ||
        (convex as any)?._client?.url ||
        (convex as any)?._httpClient?.baseURL ||
        (convex as any)?._client?._httpClient?.baseURL;
      
      return url || null;
    }
    return null;
  }, [convex]);
  
  const deployUrlFromEnv = useMemo(() => {
    const envUrl = getConvexUrl();
    if (envUrl) return envUrl;
    
    if (typeof window !== 'undefined') {
      try {
        // Check Next.js __NEXT_DATA__
        const nextData = (window as any).__NEXT_DATA__;
        if (nextData?.env) {
          const nextUrl = nextData.env.NEXT_PUBLIC_CONVEX_URL || nextData.env.VITE_CONVEX_URL;
          if (nextUrl) {
            return nextUrl;
          }
        }
              } catch (e) {
        // Ignore
      }
    }
    return undefined;
  }, []);
  
  const deployUrl = providedDeployUrl || deployUrlFromClient || deployUrlFromEnv;

  // Memoize OAuth config to prevent infinite loops (new object on every render)
  // Environment variables don't change during runtime, so we can safely memoize
  const envOAuthConfig = useMemo(() => {
    if (mockup) return undefined;
    const config = getOAuthConfigFromEnv();
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

  // Determine which token to use (OAuth, provided, or from environment)
  // In mockup mode, skip authentication
  // Priority: OAuth token > provided accessToken > envTeamAccessToken
  const effectiveAccessToken = mockup 
    ? undefined 
    : (oauth.token?.access_token || providedAccessToken || envTeamAccessToken || undefined);
  const isAuthenticated = mockup 
    ? true 
    : (oauth.isAuthenticated || !!providedAccessToken || !!envTeamAccessToken);

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

  // Create admin client - use OAuth token, deployKey, or envTeamAccessToken
  const adminClient = useMemo(() => {
    if (!isMounted) return null;
    // Create adminClient if we have a URL and either deployKey, OAuth token, or env token
    if (deployUrl && (providedDeployKey || effectiveAccessToken || envTeamAccessToken)) {
      return new ConvexClient(deployUrl);
    }
    return null;
  }, [deployUrl, providedDeployKey, effectiveAccessToken, envTeamAccessToken, isMounted]);

  // Set admin auth - prefer deployKey, fall back to OAuth token, then envTeamAccessToken
  useEffect(() => {
    if (!isMounted || !adminClient) return;

    // Use deployKey if available, otherwise use OAuth token, then envTeamAccessToken
    const authToken = providedDeployKey || effectiveAccessToken || envTeamAccessToken;
    if (authToken) {
      (adminClient as any).setAdminAuth(authToken);
    }
  }, [adminClient, providedDeployKey, effectiveAccessToken, envTeamAccessToken, isMounted]);

  // Don't render during SSR
  if (typeof window === 'undefined') {
    return null;
  }

  // Check development mode (allow override with forceDisplay prop)
  const isDevMode = isDevelopment();

  if (!isDevMode && !forceDisplay) {
    return null;
  }

  const toggleOpen = useCallback(() => {
    // Always allow expansion - users can see instructions even when not authenticated
    setIsOpen(prev => !prev);
  }, []);

  const [validationError, setValidationError] = useState<{
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!oauthConfig) {
      setValidationError({
        errors: ['OAuth configuration is missing. Please provide oauthConfig with at least a clientId.'],
        warnings: [],
      });
      setShowErrorPopup(true);
      return;
    }
    if (!oauth.authenticate) {
      return;
    }

    // Validate configuration and endpoint before connecting
    // Skip endpoint check in development to avoid CORS issues
    try {
      const { validateOAuthSetup } = await import('./utils/oauthValidation');
      const isDev = isDevelopment();
      const validation = await validateOAuthSetup(oauthConfig, { 
        checkEndpoint: !isDev // Only check endpoint in production
      });
      
      // Only block on actual configuration errors, not endpoint reachability issues
      if (!validation.isValid || validation.errors.length > 0) {
        setValidationError({
          errors: validation.errors,
          warnings: validation.warnings,
        });
        setShowErrorPopup(true);
        return;
      }
      
      // Show warnings but don't block
      if (validation.warnings.length > 0) {
        console.warn('[ConvexPanel] OAuth setup warnings:', validation.warnings);
      }

      // If there are only warnings, show them but allow continuation
      if (validation.warnings.length > 0) {
        setValidationError({
          errors: [],
          warnings: validation.warnings,
        });
        setShowErrorPopup(true);
        // User can click "Continue" to proceed
        return;
      }

      // Proceed with authentication
      await oauth.authenticate();
    } catch (error) {
      console.error('[ConvexPanel] Validation error:', error);
      setValidationError({
        errors: [error instanceof Error ? error.message : 'Failed to validate OAuth configuration'],
        warnings: [],
      });
      setShowErrorPopup(true);
    }
  }, [oauthConfig, oauth]);

  // Handle continuing after warnings
  const handleContinueAfterWarnings = useCallback(async () => {
    setShowErrorPopup(false);
    if (oauthConfig && oauth.authenticate) {
      try {
        await oauth.authenticate();
      } catch (error) {
        console.error('[ConvexPanel] Authentication error:', error);
      }
    }
  }, [oauthConfig, oauth]);

  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear OAuth token if using OAuth
    if (oauth.logout) {
      oauth.logout();
    }
    // Reset panel state
    setIsOpen(false);
    // Clear any stored authentication state
    if (typeof window !== 'undefined') {
      // Clear any other auth-related storage if needed
      localStorage.removeItem(STORAGE_KEYS.OAUTH_TOKEN);
    }
    // Force a page reload to reset all state
    window.location.reload();
  }, [oauth]);

  // Root container with scoped styles - no CSS imports
  return (
    <PortalProvider value={portalContainer ?? null}>
    <ThemeProvider defaultTheme={defaultTheme}>
      <SheetProvider>
        <ConfirmDialogProvider>
          <ToastProvider position="bottom-right">
          <BottomSheet
          isOpen={isOpen}
          onClose={toggleOpen}
          projectName={deployUrl ? undefined : ''}
          deploymentUrl={deployUrl}
          environment="development"
          isAuthenticated={isAuthenticated}
          oauthConfig={oauthConfig}
          onConnect={handleConnect}
          onLogout={handleLogout}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          adminClient={adminClient}
          accessToken={effectiveAccessToken}
          isOAuthToken={!!oauth.token?.access_token}
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
              deploymentUrl={deployUrl}
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              accessToken={effectiveAccessToken}
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
          </ToastProvider>
          {showErrorPopup && validationError && (
            <OAuthErrorPopup
              isOpen={showErrorPopup}
              onClose={() => {
                setShowErrorPopup(false);
              }}
              onContinue={
                validationError.errors.length === 0 && validationError.warnings.length > 0
                  ? () => {
                      setShowErrorPopup(false);
                      handleContinueAfterWarnings();
                    }
                  : undefined
              }
              errors={validationError.errors}
              warnings={validationError.warnings}
            />
          )}
        </ConfirmDialogProvider>
      </SheetProvider>
    </ThemeProvider>
    </PortalProvider>
  );
};

export default ConvexPanel;
