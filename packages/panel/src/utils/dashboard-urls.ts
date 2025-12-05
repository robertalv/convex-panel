import { extractDeploymentName } from './api/utils';
import { parseAccessToken } from './api/utils';

/**
 * Build a Convex dashboard URL for environment variables settings
 * @param deploymentUrl - The deployment URL
 * @param teamSlug - Optional team slug
 * @param projectSlug - Optional project slug
 * @param accessToken - Optional access token (used to extract team/project slugs)
 * @returns The dashboard URL or null if insufficient information
 */
export function buildEnvironmentVariablesUrl(
  deploymentUrl?: string,
  teamSlug?: string,
  projectSlug?: string,
  accessToken?: string
): string | null {
  // Try to extract team/project slugs from access token if not provided
  let effectiveTeamSlug = teamSlug;
  let effectiveProjectSlug = projectSlug;
  
  if ((!effectiveTeamSlug || !effectiveProjectSlug) && accessToken) {
    const tokenInfo = parseAccessToken(accessToken);
    effectiveTeamSlug = effectiveTeamSlug || tokenInfo.teamSlug;
    effectiveProjectSlug = effectiveProjectSlug || tokenInfo.projectSlug;
  }

  const deploymentName = extractDeploymentName(deploymentUrl);

  // If we have all required info, build the specific URL
  if (effectiveTeamSlug && effectiveProjectSlug && deploymentName) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}/${effectiveProjectSlug}/${deploymentName}/settings/environment-variables`;
  }

  // Fallback: generic dashboard link
  if (effectiveTeamSlug && effectiveProjectSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}/${effectiveProjectSlug}`;
  }

  // Last resort: just the dashboard
  return 'https://dashboard.convex.dev';
}

/**
 * Build a Convex dashboard URL for OAuth applications
 * @param teamSlug - Optional team slug
 * @param projectSlug - Optional project slug
 * @param accessToken - Optional access token (used to extract team/project slugs)
 * @returns The dashboard URL or null if insufficient information
 */
export function buildOAuthApplicationsUrl(
  teamSlug?: string,
  projectSlug?: string,
  accessToken?: string
): string | null {
  // Try to extract team/project slugs from access token if not provided
  let effectiveTeamSlug = teamSlug;
  let effectiveProjectSlug = projectSlug;
  
  if ((!effectiveTeamSlug || !effectiveProjectSlug) && accessToken) {
    const tokenInfo = parseAccessToken(accessToken);
    effectiveTeamSlug = effectiveTeamSlug || tokenInfo.teamSlug;
    effectiveProjectSlug = effectiveProjectSlug || tokenInfo.projectSlug;
  }

  // If we have team and project, build the specific URL
  if (effectiveTeamSlug && effectiveProjectSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}/${effectiveProjectSlug}/settings/oauth-applications`;
  }

  // Fallback: generic dashboard link
  if (effectiveTeamSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}`;
  }

  // Last resort: just the dashboard
  return 'https://dashboard.convex.dev';
}

/**
 * Build a Convex dashboard URL for access tokens
 * @param teamSlug - Optional team slug
 * @param projectSlug - Optional project slug
 * @param accessToken - Optional access token (used to extract team/project slugs)
 * @returns The dashboard URL or null if insufficient information
 */
export function buildAccessTokensUrl(
  teamSlug?: string,
  projectSlug?: string,
  accessToken?: string
): string | null {
  // Try to extract team/project slugs from access token if not provided
  let effectiveTeamSlug = teamSlug;
  let effectiveProjectSlug = projectSlug;
  
  if ((!effectiveTeamSlug || !effectiveProjectSlug) && accessToken) {
    const tokenInfo = parseAccessToken(accessToken);
    effectiveTeamSlug = effectiveTeamSlug || tokenInfo.teamSlug;
    effectiveProjectSlug = effectiveProjectSlug || tokenInfo.projectSlug;
  }

  // If we have team and project, build the specific URL
  if (effectiveTeamSlug && effectiveProjectSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}/${effectiveProjectSlug}/settings/access-tokens`;
  }

  // Fallback: generic dashboard link
  if (effectiveTeamSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}`;
  }

  // Last resort: just the dashboard
  return 'https://dashboard.convex.dev';
}

/**
 * Build a generic Convex dashboard URL
 * @param teamSlug - Optional team slug
 * @param projectSlug - Optional project slug
 * @param accessToken - Optional access token (used to extract team/project slugs)
 * @returns The dashboard URL
 */
export function buildDashboardUrl(
  teamSlug?: string,
  projectSlug?: string,
  accessToken?: string
): string {
  // Try to extract team/project slugs from access token if not provided
  let effectiveTeamSlug = teamSlug;
  let effectiveProjectSlug = projectSlug;
  
  if ((!effectiveTeamSlug || !effectiveProjectSlug) && accessToken) {
    const tokenInfo = parseAccessToken(accessToken);
    effectiveTeamSlug = effectiveTeamSlug || tokenInfo.teamSlug;
    effectiveProjectSlug = effectiveProjectSlug || tokenInfo.projectSlug;
  }

  // Build the most specific URL possible
  if (effectiveTeamSlug && effectiveProjectSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}/${effectiveProjectSlug}`;
  }

  if (effectiveTeamSlug) {
    return `https://dashboard.convex.dev/t/${effectiveTeamSlug}`;
  }

  return 'https://dashboard.convex.dev';
}

