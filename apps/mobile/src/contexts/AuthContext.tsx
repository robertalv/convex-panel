/**
 * Authentication Context
 *
 * Manages authentication state and provides login/logout functionality
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { DashboardSession } from "../types";
import * as authService from "../services/auth";
import * as storage from "../services/storage";
import { createUserInConvex } from "../services/convexUser";

interface AuthContextValue {
  session: DashboardSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (session: DashboardSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedSession = await storage.loadSession<DashboardSession>();

      if (storedSession) {
        // Check if token is expired
        if (authService.isTokenExpired(storedSession.expiresAt)) {
          // Token expired, clear it
          await storage.clearAllSession();
          setSession(null);
        } else {
          setSession(storedSession);
        }
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (newSession: DashboardSession) => {
    try {
      // Save to secure storage
      await storage.saveSession(newSession);
      await storage.saveAccessToken(newSession.accessToken);

      setSession(newSession);

      // Create/update user in Convex database
      if (newSession.profile?.email) {
        try {
          await createUserInConvex(
            newSession.profile.email,
            newSession.profile.name,
          );
          console.log("[AuthContext] User created/updated in Convex");
        } catch (convexError) {
          // Log but don't fail login if Convex user creation fails
          console.error(
            "[AuthContext] Failed to create user in Convex:",
            convexError,
          );
        }
      }
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await storage.clearAllSession();
      setSession(null);
    } catch (error) {
      console.error("Failed to clear session:", error);
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) return;

    try {
      // Check if we need to refresh
      if (!authService.isTokenExpired(session.expiresAt)) {
        return; // Still valid
      }

      // Try to get a refresh token
      const refreshToken = await storage.loadRefreshToken();

      if (refreshToken) {
        const tokenResponse =
          await authService.refreshAccessToken(refreshToken);
        const dashboardSession = await authService.exchangeForDashboardToken(
          tokenResponse.id_token || tokenResponse.access_token,
        );

        await login(dashboardSession);
      } else {
        // No refresh token, user needs to log in again
        await logout();
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      // On refresh failure, log out
      await logout();
    }
  }, [session, login, logout]);

  const value: AuthContextValue = {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
