/**
 * NPM API utilities for fetching package download and metadata
 */

import { NPM_API_DOMAIN, NPM_ROUTES } from "../../../utils/constants";

/* ────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────── */

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

export interface NpmPackageRegistryData {
  name: string;
  version: string;
  description?: string;
  maintainers?: Array<{
    name: string;
    email?: string;
  }>;
  publisher?: {
    name: string;
    email?: string;
  };
  repository?:
    | string
    | {
        type: string;
        url: string;
      };
  homepage?: string;
  "dist-tags"?: {
    latest: string;
  };
  versions?: {
    [version: string]: {
      maintainers?: Array<{
        name: string;
        email?: string;
      }>;
      _npmUser?: {
        name: string;
        email?: string;
      };
    };
  };
}

export interface NpmMaintainer {
  name: string;
  email?: string;
}

export interface NpmPackageExtendedInfo extends NpmPackageInfo {
  version?: string;
  description?: string;
  repository?: string;
  homepage?: string;
  maintainers?: NpmMaintainer[];
}

/* ────────────────────────────────────────────────────────────────
 * Fetch Weekly Downloads
 * ──────────────────────────────────────────────────────────────── */

export async function fetchNpmWeeklyDownloads(
  packageName: string
): Promise<NpmPackageInfo> {
  try {
    const url = `https://${NPM_API_DOMAIN}${NPM_ROUTES.DOWNLOADS.replace(
      "{packageName}",
      encodeURIComponent(packageName)
    )}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return {
        name: packageName,
        downloads: 0,
        weeklyDownloads: 0,
        error: response.status === 404 ? "Package not found" : response.statusText,
      };
    }

    const data: NpmPackageDownloads = await response.json();

    return {
      name: packageName,
      downloads: data.downloads,
      weeklyDownloads: data.downloads,
    };
  } catch (err) {
    return {
      name: packageName,
      downloads: 0,
      weeklyDownloads: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/* ────────────────────────────────────────────────────────────────
 * Fetch Package Metadata (version, maintainers, repo)
 * ──────────────────────────────────────────────────────────────── */

export async function fetchNpmPackageInfo(
  packageName: string
): Promise<NpmPackageExtendedInfo> {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return {
        name: packageName,
        downloads: 0,
        weeklyDownloads: 0,
        error: response.status === 404 ? "Package not found" : response.statusText,
      };
    }

    const data: NpmPackageRegistryData = await response.json();


    const latestVersion =
      data["dist-tags"]?.latest ?? data.version ?? undefined;

    // Try multiple sources for maintainers:
    // 1. Root-level maintainers (deprecated but still used)
    // 2. Publisher (who published the latest version)
    // 3. Latest version's maintainers
    // 4. Latest version's _npmUser
    let maintainers: NpmMaintainer[] = [];

    if (data.maintainers && data.maintainers.length > 0) {
      maintainers = data.maintainers;
    } else if (latestVersion && data.versions?.[latestVersion]) {
      const latestVersionData = data.versions[latestVersion];
      if (latestVersionData.maintainers && latestVersionData.maintainers.length > 0) {
        maintainers = latestVersionData.maintainers;
      } else if (latestVersionData._npmUser) {
        maintainers = [latestVersionData._npmUser];
      }
    }

    // If still no maintainers, try publisher
    if (maintainers.length === 0 && data.publisher) {
      maintainers = [data.publisher];
    }

    const repositoryUrl =
      typeof data.repository === "string"
        ? data.repository
        : data.repository?.url?.replace(/^git\+/, "").replace(/\.git$/, "");

    return {
      name: packageName,
      downloads: 0,
      weeklyDownloads: 0,
      version: latestVersion,
      description: data.description,
      repository: repositoryUrl,
      homepage: data.homepage,
      maintainers,
    };
  } catch (err) {
    console.error(`Failed to fetch npm package info for ${packageName}:`, err);
    return {
      name: packageName,
      downloads: 0,
      weeklyDownloads: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/* ────────────────────────────────────────────────────────────────
 * Fetch Multiple Downloads
 * ──────────────────────────────────────────────────────────────── */

export async function fetchMultipleNpmDownloads(
  packageNames: string[]
): Promise<Map<string, NpmPackageInfo>> {
  const promises = packageNames.map((pkg) =>
    fetchNpmWeeklyDownloads(pkg).then((info) => [pkg, info] as const)
  );

  const results = await Promise.allSettled(promises);
  const map = new Map<string, NpmPackageInfo>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      const [pkg, info] = result.value;
      map.set(pkg, info);
    }
  }

  return map;
}

/* ────────────────────────────────────────────────────────────────
 * Fetch Multiple Metadata Calls
 * ──────────────────────────────────────────────────────────────── */

export async function fetchMultipleNpmPackageInfo(
  packageNames: string[]
): Promise<Map<string, NpmPackageExtendedInfo>> {
  const promises = packageNames.map((pkg) =>
    fetchNpmPackageInfo(pkg).then((info) => [pkg, info] as const)
  );

  const results = await Promise.allSettled(promises);
  const map = new Map<string, NpmPackageExtendedInfo>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      const [pkg, info] = result.value;
      map.set(pkg, info);
    }
  }

  return map;
}

/* ────────────────────────────────────────────────────────────────
 * Fetch "Complete" package info (downloads + metadata)
 * ──────────────────────────────────────────────────────────────── */

export async function fetchMultipleNpmPackagesComplete(
  packageNames: string[]
): Promise<Map<string, NpmPackageExtendedInfo>> {
  const [downloadsMap, infoMap] = await Promise.all([
    fetchMultipleNpmDownloads(packageNames),
    fetchMultipleNpmPackageInfo(packageNames),
  ]);

  const combined = new Map<string, NpmPackageExtendedInfo>();

  for (const pkg of packageNames) {
    const downloads = downloadsMap.get(pkg);
    const info = infoMap.get(pkg);

    combined.set(pkg, {
      name: pkg,
      downloads: downloads?.downloads ?? 0,
      weeklyDownloads: downloads?.weeklyDownloads ?? 0,
      version: info?.version,
      description: info?.description,
      repository: info?.repository,
      homepage: info?.homepage,
      maintainers: info?.maintainers, // ← FIXED: Now includes maintainers
      error: downloads?.error || info?.error,
    });
  }

  return combined;
}
