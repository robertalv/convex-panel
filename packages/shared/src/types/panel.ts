/**
 * Main panel types
 */

import type { FC } from 'react';

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: 'team' | 'project';
  tokenExchangeUrl?: string;
}

export type ProjectEnvVarConfig = {
  name: string;
  value: string;
  deploymentTypes: ("dev" | "preview" | "prod")[];
};

export interface ConvexPanelProps {
  accessToken: string;
  deployKey: string;
}

// Team and Project types are exported from application.ts

declare const ConvexPanel: FC<ConvexPanelProps>;

export default ConvexPanel;

