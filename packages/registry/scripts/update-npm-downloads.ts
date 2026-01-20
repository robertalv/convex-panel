/**
 * Script to update weeklyDownloads in components.json with real NPM data
 * 
 * Usage: npx tsx scripts/update-npm-downloads.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { RegistryComponent } from "../src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const NPM_API_DOMAIN = "api.npmjs.org";
const NPM_DOWNLOADS_ENDPOINT = "/downloads/point/last-week";

interface NpmDownloadsResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

/**
 * Fetch weekly downloads for an NPM package
 */
async function fetchNpmWeeklyDownloads(
  packageName: string,
): Promise<number | null> {
  try {
    const url = `https://${NPM_API_DOMAIN}${NPM_DOWNLOADS_ENDPOINT}/${encodeURIComponent(packageName)}`;
    
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch downloads for ${packageName}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data: NpmDownloadsResponse = await response.json();
    return data.downloads;
  } catch (error) {
    console.error(`Error fetching downloads for ${packageName}:`, error);
    return null;
  }
}

/**
 * Update components.json with real NPM download data
 */
async function updateNpmDownloads() {
  const componentsPath = join(
    __dirname,
    "../src/data/components.json",
  );
  
  const componentsData = JSON.parse(
    readFileSync(componentsPath, "utf-8"),
  ) as {
    version: string;
    updatedAt: string;
    components: RegistryComponent[];
  };

  console.log(`Found ${componentsData.components.length} components`);
  console.log("Fetching NPM download data...\n");

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  // Fetch downloads for all components with npmPackage
  for (const component of componentsData.components) {
    if (!component.npmPackage) {
      skipped++;
      console.log(`⏭️  Skipping ${component.name} (no npmPackage)`);
      continue;
    }

    const oldDownloads = component.weeklyDownloads || 0;
    const newDownloads = await fetchNpmWeeklyDownloads(component.npmPackage);

    if (newDownloads === null) {
      failed++;
      console.log(
        `❌ Failed to fetch ${component.name} (${component.npmPackage})`,
      );
      continue;
    }

    if (oldDownloads !== newDownloads) {
      component.weeklyDownloads = newDownloads;
      updated++;
      console.log(
        `✅ ${component.name}: ${oldDownloads.toLocaleString()} → ${newDownloads.toLocaleString()}`,
      );
    } else {
      console.log(
        `✓  ${component.name}: ${newDownloads.toLocaleString()} (unchanged)`,
      );
    }

    // Rate limiting: wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Update the updatedAt timestamp
  componentsData.updatedAt = new Date().toISOString();

  // Write updated data back to file
  writeFileSync(
    componentsPath,
    JSON.stringify(componentsData, null, 2) + "\n",
  );

  console.log("\n" + "=".repeat(50));
  console.log(`Summary:`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📝 Total: ${componentsData.components.length}`);
  console.log(`\nUpdated components.json at ${componentsPath}`);
}

// Run the script
updateNpmDownloads().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
