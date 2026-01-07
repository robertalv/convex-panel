/**
 * GitHub Service Types
 */

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  default_branch: string;
  installation_id?: number;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    type: "User" | "Organization";
    avatar_url: string;
  };
  repository_selection: "all" | "selected";
  created_at: string;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface TokenPollResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?:
    | "authorization_pending"
    | "slow_down"
    | "expired_token"
    | "access_denied";
  error_description?: string;
  interval?: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
}

export interface SchemaUpdateEvent {
  type: "schema_update";
  repo: string;
  branch: string;
  file: string;
  commit: {
    id: string;
    message: string;
    author: string;
    timestamp: string;
  };
  timestamp: string;
}

export interface SSEEvent {
  type: "connected" | "schema_update" | "heartbeat";
  repos?: string[];
  device_id?: string;
  timestamp: string;
  // For schema_update
  repo?: string;
  branch?: string;
  file?: string;
  commit?: {
    id: string;
    message: string;
    author: string;
    timestamp: string;
  };
}

export interface GitHubAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GitHubUser | null;
  error: string | null;
}

export type AuthStatus =
  | "idle"
  | "loading"
  | "awaiting_user" // Device flow: user needs to enter code
  | "polling" // Device flow: polling for token
  | "authenticated"
  | "error";
