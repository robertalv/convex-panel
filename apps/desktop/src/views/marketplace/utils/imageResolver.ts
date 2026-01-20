/**
 * Image Resolver Utility
 * 
 * Resolves component image URLs from various sources:
 * 1. Full URLs (http/https) - used as-is
 * 2. Relative paths - resolved from NPM packages or GitHub
 * 3. Local static assets - fallback
 */

import type { RegistryComponent } from "@convex-panel/registry";

/**
 * Extract package name and version from npm package string
 * Examples:
 * - "@convex-dev/workos-authkit" -> { name: "@convex-dev/workos-authkit", version: "latest" }
 * - "@convex-dev/workos-authkit@1.2.3" -> { name: "@convex-dev/workos-authkit", version: "1.2.3" }
 */
function parseNpmPackage(npmPackage: string): { name: string; version: string } {
  const parts = npmPackage.split("@");
  if (parts.length === 3) {
    // Scoped package with version: @scope/name@version
    return {
      name: `@${parts[1]}`,
      version: parts[2],
    };
  } else if (parts.length === 2 && parts[0] === "") {
    // Scoped package without version: @scope/name
    return {
      name: npmPackage,
      version: "latest",
    };
  } else if (parts.length === 2) {
    // Unscoped package with version: name@version
    return {
      name: parts[0],
      version: parts[1],
    };
  }
  // Unscoped package without version: name
  return {
    name: npmPackage,
    version: "latest",
  };
}

/**
 * Extract GitHub owner and repo from repo URL
 * Examples:
 * - "https://github.com/get-convex/workos-authkit" -> { owner: "get-convex", repo: "workos-authkit" }
 * - "https://github.com/get-convex/workos-authkit.git" -> { owner: "get-convex", repo: "workos-authkit" }
 */
function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== "github.com") {
      return null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, ""),
      };
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Generate potential image URLs from NPM package
 */
function generateNpmImageUrls(
  npmPackage: string,
  imagePath: string,
): string[] {
  const { name, version } = parseNpmPackage(npmPackage);
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  
  // Common image locations in NPM packages
  const paths = [
    cleanPath, // Direct path
    `assets/${cleanPath}`, // assets/ folder
    `images/${cleanPath}`, // images/ folder
    `public/${cleanPath}`, // public/ folder
    `docs/${cleanPath}`, // docs/ folder
  ];

  const urls: string[] = [];
  
  // Try unpkg.com (faster, more reliable)
  for (const path of paths) {
    urls.push(`https://unpkg.com/${name}@${version}/${path}`);
  }
  
  // Try jsdelivr.com (alternative CDN)
  for (const path of paths) {
    urls.push(`https://cdn.jsdelivr.net/npm/${name}@${version}/${path}`);
  }

  return urls;
}

/**
 * Generate potential image URLs from GitHub
 */
function generateGitHubImageUrls(
  repoUrl: string,
  imagePath: string,
): string[] {
  const github = parseGitHubUrl(repoUrl);
  if (!github) {
    return [];
  }

  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  
  // Common branches and image locations
  const branches = ["main", "master", "latest"];
  const paths = [
    cleanPath, // Root
    `assets/${cleanPath}`, // assets/ folder
    `images/${cleanPath}`, // images/ folder
    `public/${cleanPath}`, // public/ folder
    `docs/${cleanPath}`, // docs/ folder
  ];

  const urls: string[] = [];
  
  for (const branch of branches) {
    for (const path of paths) {
      urls.push(
        `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${branch}/${path}`,
      );
    }
  }

  return urls;
}

/**
 * Resolve component image URL
 * 
 * Priority:
 * 1. If src is already a full URL, use it
 * 2. Try NPM package CDN (unpkg/jsdelivr)
 * 3. Try GitHub raw content
 * 4. Fallback to local static asset
 */
export function resolveComponentImageUrl(
  component: RegistryComponent,
): string {
  const imageSrc = component.image?.src;
  if (!imageSrc) {
    return "";
  }

  // If it's already a full URL, use it as-is
  if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
    return imageSrc;
  }

  // Generate potential URLs from NPM and GitHub
  const npmUrls = component.npmPackage
    ? generateNpmImageUrls(component.npmPackage, imageSrc)
    : [];
  
  const githubUrls = component.repoUrl
    ? generateGitHubImageUrls(component.repoUrl, imageSrc)
    : [];

  // For now, prioritize NPM CDN URLs
  // In a production app, you might want to test these URLs and use the first one that works
  // For simplicity, we'll use the first NPM URL, then fallback to local
  if (npmUrls.length > 0) {
    // Prefer unpkg.com (first half of the array)
    return npmUrls[0];
  }

  if (githubUrls.length > 0) {
    // Prefer main branch (first few URLs)
    return githubUrls[0];
  }

  // Fallback to local static asset (current behavior)
  return imageSrc;
}

/**
 * Get all potential image URLs for testing/fallback
 */
export function getAllPotentialImageUrls(
  component: RegistryComponent,
): string[] {
  const imageSrc = component.image?.src;
  if (!imageSrc) {
    return [];
  }

  // If it's already a full URL, return it
  if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
    return [imageSrc];
  }

  const urls: string[] = [];
  
  // Prioritize local images first (paths starting with /)
  // These are stored in packages/registry/public/ and should be served locally
  if (imageSrc.startsWith("/")) {
    urls.push(imageSrc);
  }
  
  // Add NPM URLs as fallback
  if (component.npmPackage) {
    urls.push(...generateNpmImageUrls(component.npmPackage, imageSrc));
  }
  
  // Add GitHub URLs as fallback
  if (component.repoUrl) {
    urls.push(...generateGitHubImageUrls(component.repoUrl, imageSrc));
  }
  
  // Add local fallback if not already added
  if (!imageSrc.startsWith("/")) {
    urls.push(imageSrc);
  }

  return urls;
}
