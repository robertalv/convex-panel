#!/usr/bin/env node

/**
 * Setup script to help users configure environment variables for Convex Panel.
 *
 * It will:
 * - Detect or create a .env file in the current working directory
 *   (preferring .env.local, then .env).
 * - Prompt for:
 *   - Convex deployment URL (VITE_CONVEX_URL)
 *   - Convex OAuth client ID (VITE_OAUTH_CLIENT_ID)
 *   - Token exchange URL (VITE_CONVEX_TOKEN_EXCHANGE_URL)
 * - Append any missing variables without overwriting existing ones.
 */

const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function pickEnvFile(cwd) {
  const candidates = [".env.local", ".env"];
  for (const name of candidates) {
    const full = path.join(cwd, name);
    try {
      await fs.access(full);
      return full;
    } catch {
      // ignore
    }
  }
  // Default to .env.local if none exist
  return path.join(cwd, ".env.local");
}

function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const map = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1);
    map.set(key, value);
  }
  return { lines, map };
}

async function main() {
  const cwd = process.cwd();
  const envPath = await pickEnvFile(cwd);

  let envContent = "";
  try {
    envContent = await fs.readFile(envPath, "utf8");
  } catch {
    // file doesn't exist yet; we'll create it
  }

  const { lines, map } = parseEnv(envContent);

  console.log("Configuring environment variables in:", envPath);

  const updates = [];

  // 1) VITE_CONVEX_URL
  if (map.has("VITE_CONVEX_URL")) {
    console.log(
      "VITE_CONVEX_URL already set; leaving existing value unchanged."
    );
  } else {
    const url = await ask(
      "Convex deployment URL (e.g. https://your-deployment.convex.cloud) for VITE_CONVEX_URL: "
    );
    if (url) {
      updates.push(`VITE_CONVEX_URL=${url}`);
    }
  }

  // 2) VITE_OAUTH_CLIENT_ID
  if (map.has("VITE_OAUTH_CLIENT_ID")) {
    console.log(
      "VITE_OAUTH_CLIENT_ID already set; leaving existing value unchanged."
    );
  } else {
    const clientId = await ask(
      "Convex OAuth client ID (from dashboard) for VITE_OAUTH_CLIENT_ID: "
    );
    if (clientId) {
      updates.push(`VITE_OAUTH_CLIENT_ID=${clientId}`);
    }
  }

  // 3) VITE_CONVEX_TOKEN_EXCHANGE_URL
  if (map.has("VITE_CONVEX_TOKEN_EXCHANGE_URL")) {
    console.log(
      "VITE_CONVEX_TOKEN_EXCHANGE_URL already set; leaving existing value unchanged."
    );
  } else {
    const def = map.get("VITE_CONVEX_URL") || "";
    const suggestedSite =
      def && def.includes(".convex.cloud")
        ? def.replace(".convex.cloud", ".convex.site") + "/oauth/exchange"
        : "";

    let prompt = "Token exchange URL for VITE_CONVEX_TOKEN_EXCHANGE_URL";
    if (suggestedSite) {
      prompt += ` (press Enter to use suggested ${suggestedSite}): `;
    } else {
      prompt += " (e.g. https://your-deployment.convex.site/oauth/exchange): ";
    }

    let tokenUrl = await ask(prompt);
    if (!tokenUrl && suggestedSite) {
      tokenUrl = suggestedSite;
    }
    if (tokenUrl) {
      updates.push(`VITE_CONVEX_TOKEN_EXCHANGE_URL=${tokenUrl}`);
    }
  }

  if (updates.length === 0) {
    console.log("All required env variables are already set. Nothing to do.");
    return;
  }

  const newContent =
    (envContent ? envContent.replace(/\s*$/, "") + "\n" : "") +
    updates.join("\n") +
    "\n";

  await fs.writeFile(envPath, newContent, "utf8");

  console.log("Added the following env variables:");
  for (const line of updates) {
    const [key] = line.split("=");
    console.log("  -", key);
  }
}

main().catch((err) => {
  console.error("setup-env failed:", err);
  process.exit(1);
});


