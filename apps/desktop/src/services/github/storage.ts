/**
 * GitHub Settings Storage
 *
 * Persists GitHub settings per Convex project (team/project slug).
 * Each Convex project can have its own GitHub repo and branch selection.
 *
 * Storage is keyed by team slug + project slug combination.
 */

import type { GitHubRepo } from "../github/types";

const STORAGE_KEY = "convex-panel-github-settings";
const STORAGE_VERSION = 3; // Bumped version to support storing full repo objects

export interface ProjectGitHubSettings {
  repoFullName: string | null;
  fullRepo: GitHubRepo | null; // Store full repo object for immediate restoration
  branch: string | null;
  lastUpdated: number;
}

/**
 * Convex project identifier for GitHub settings
 */
export interface ConvexProjectId {
  teamSlug: string;
  projectSlug: string;
}

interface GitHubSettingsStore {
  version: number;
  projects: {
    [projectKey: string]: ProjectGitHubSettings & {
      // Store the project identifier for debugging
      projectHint?: string;
    };
  };
}

/**
 * Create a storage key from Convex project identifiers
 */
function getProjectKey(project: ConvexProjectId): string {
  return `${project.teamSlug}/${project.projectSlug}`;
}

/**
 * Get the current storage, initializing if needed
 */
function getStore(): GitHubSettingsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: STORAGE_VERSION, projects: {} };
    }

    const parsed = JSON.parse(raw);

    // Handle version migration - clear old path-based storage
    if (!parsed.version || parsed.version < STORAGE_VERSION) {
      console.log(
        "[GitHubStorage] Migrating from version",
        parsed.version,
        "to",
        STORAGE_VERSION,
      );
      // For version 2->3 migration, we need to add fullRepo: null to existing settings
      if (parsed.version === 2) {
        const migratedProjects: { [projectKey: string]: any } = {};
        for (const [key, settings] of Object.entries(parsed.projects || {})) {
          const settingsObj = settings as any;
          migratedProjects[key] = {
            repoFullName: settingsObj.repoFullName ?? null,
            branch: settingsObj.branch ?? null,
            fullRepo: null, // Add new field, will be populated on next selection
            lastUpdated: settingsObj.lastUpdated ?? Date.now(),
          };
        }
        return { version: STORAGE_VERSION, projects: migratedProjects };
      }
      return { version: STORAGE_VERSION, projects: {} };
    }

    return parsed as GitHubSettingsStore;
  } catch {
    return { version: STORAGE_VERSION, projects: {} };
  }
}

/**
 * Save the storage
 */
function saveStore(store: GitHubSettingsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("[GitHubStorage] Failed to save settings:", e);
  }
}

/**
 * Get GitHub settings for a specific Convex project
 */
export function getProjectGitHubSettings(
  project: ConvexProjectId,
): ProjectGitHubSettings | null {
  const store = getStore();
  const key = getProjectKey(project);
  const settings = store.projects[key];

  if (!settings) {
    return null;
  }

  return {
    repoFullName: settings.repoFullName,
    fullRepo: settings.fullRepo,
    branch: settings.branch,
    lastUpdated: settings.lastUpdated,
  };
}

/**
 * Save GitHub settings for a specific Convex project
 */
export function saveProjectGitHubSettings(
  project: ConvexProjectId,
  settings: Partial<ProjectGitHubSettings>,
): void {
  const store = getStore();
  const key = getProjectKey(project);

  const existing = store.projects[key] || {
    repoFullName: null,
    fullRepo: null,
    branch: null,
    lastUpdated: 0,
  };

  store.projects[key] = {
    ...existing,
    ...settings,
    lastUpdated: Date.now(),
    projectHint: key,
  };

  saveStore(store);
}

/**
 * Clear GitHub settings for a specific Convex project
 */
export function clearProjectGitHubSettings(project: ConvexProjectId): void {
  const store = getStore();
  const key = getProjectKey(project);
  delete store.projects[key];
  saveStore(store);
}

/**
 * Clean up stale settings (older than 30 days)
 * Call this periodically to prevent localStorage bloat
 */
export function cleanupStaleSettings(): void {
  const store = getStore();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let changed = false;

  for (const key of Object.keys(store.projects)) {
    if (store.projects[key].lastUpdated < thirtyDaysAgo) {
      delete store.projects[key];
      changed = true;
    }
  }

  if (changed) {
    saveStore(store);
    console.log("[GitHubStorage] Cleaned up stale settings");
  }
}

/**
 * Check if a Convex project has GitHub settings configured
 */
export function hasProjectGitHubSettings(project: ConvexProjectId): boolean {
  const settings = getProjectGitHubSettings(project);
  return settings !== null && settings.repoFullName !== null;
}
