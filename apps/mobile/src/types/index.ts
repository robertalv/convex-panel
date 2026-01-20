export interface Team {
  id: number;
  name: string;
  slug: string;
  creator?: number;
  suspended?: boolean;
  referralCode?: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  teamId: number;
  creator?: number;
  isDemo?: boolean;
}

export interface Deployment {
  id: number;
  name: string;
  projectId: number;
  deploymentType: "dev" | "prod" | "preview";
  kind: "cloud" | "local";
  creator?: number;
  previewIdentifier?: string | null;
  url?: string;
}

export interface UserProfile {
  id?: number;
  name?: string;
  email?: string;
  profilePictureUrl?: string;
}

export interface TeamSubscription {
  plan: {
    id: string;
    name: string;
    planType: string | null;
    description?: string;
    status?: string;
  };
}

export interface Referral {
  id: number;
  referrerTeamId: number;
  refereeTeamId: number;
  createdAt: string;
}

export interface ReferralState {
  referrals: Referral[];
  referralCode: string;
}

export interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface DashboardSession {
  accessToken: string;
  expiresAt?: number;
  profile?: UserProfile;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  DeviceAuth: { authResponse: DeviceAuthResponse };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Data: undefined;
  Logs: undefined;
  Account: undefined;
  Subscription: undefined;
  Team: undefined;
  TeamBilling: undefined;
};

export type DashboardStackParamList = {
  DashboardOverview: undefined;
  FunctionDetails: { functionName: string };
  ErrorDetails: { errorId: string };
};

export type AlertsStackParamList = {
  AlertsList: undefined;
  AlertDetail: { alertId: string };
  NotificationSettings: undefined;
};

export interface HealthMetrics {
  status: "healthy" | "degraded" | "critical";
  activeUsers: number;
  errorCount: number;
  requestRate: number;
  avgLatency: number;
  cacheHitRate: number;
}

export interface FunctionActivity {
  name: string;
  type: "query" | "mutation" | "action";
  callCount: number;
  avgDuration: number;
  errorRate: number;
}

export interface RecentError {
  id: string;
  message: string;
  functionName: string;
  timestamp: string;
  count: number;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  deploymentName: string;
  functionName?: string;
  read: boolean;
  dismissed: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  onCallMode: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  severityFilter: Array<"critical" | "warning" | "info">;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
    accent: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

export type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;
