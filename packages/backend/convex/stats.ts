import { components } from "./_generated/api";
import { OssStats } from "@erquhart/convex-oss-stats";

// Configure OSS stats for the Convex Panel project itself.
// This keeps GitHub and npm data in your Convex deployment.
export const ossStats = new OssStats(components.ossStats, {
  // GitHub
  githubOwners: ["robertalv"],
  githubRepos: ["robertalv/convex-panel"],
  // npm
  npmPackages: ["convex-panel"],
});

export const {
  sync,
  clearAndSync,
  getGithubOwner,
  getNpmOrg,
  getGithubRepo,
  getGithubRepos,
  getNpmPackage,
  getNpmPackages,
} = ossStats.api();


