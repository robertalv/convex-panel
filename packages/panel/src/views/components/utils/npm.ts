/**
 * NPM API utilities for fetching package download statistics
 */

import { NPM_API_DOMAIN, NPM_ROUTES } from "../../../utils/constants";

export interface NpmPackageDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface NpmPackageInfo {
  name: string;
  downloads: number;
  weeklyDownloads?: number;
  error?: string;
}

/**
 * Fetch weekly downloads for an npm package
 * @param packageName - The npm package name (e.g., '@convex-dev/agent')
 * @returns Object with package name and weekly downloads count
 */
export async function fetchNpmWeeklyDownloads(
  packageName: string
): Promise<NpmPackageInfo> {
  try {
    const url = `https://${NPM_API_DOMAIN}${NPM_ROUTES.DOWNLOADS.replace('{packageName}', encodeURIComponent(packageName))}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          name: packageName,
          downloads: 0,
          weeklyDownloads: 0,
          error: 'Package not found',
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: NpmPackageDownloads = await response.json();
    
    return {
      name: packageName,
      downloads: data.downloads || 0,
      weeklyDownloads: data.downloads || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch npm downloads for ${packageName}:`, error);
    return {
      name: packageName,
      downloads: 0,
      weeklyDownloads: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch downloads for multiple npm packages in parallel
 * @param packageNames - Array of npm package names
 * @returns Map of package name to download info
 */
export async function fetchMultipleNpmDownloads(
  packageNames: string[]
): Promise<Map<string, NpmPackageInfo>> {
  const downloadPromises = packageNames.map((pkg) =>
    fetchNpmWeeklyDownloads(pkg).then((info) => [pkg, info] as const)
  );

  const results = await Promise.allSettled(downloadPromises);
  const downloadsMap = new Map<string, NpmPackageInfo>();

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const [packageName, info] = result.value;
      downloadsMap.set(packageName, info);
    } else {
      console.error('Failed to fetch npm download:', result.reason);
    }
  });

  return downloadsMap;
}
