#!/usr/bin/env node

/**
 * Setup script to inject the Convex Panel OAuth HTTP action into a user's
 * `convex/http.ts` file.
 *
 * Goals:
 * - Find (or create) `convex/http.ts` in the host project.
 * - Ensure we have `httpRouter` and `httpAction` imports without duplicating them.
 * - Ensure there is a single `const http = httpRouter();`.
 * - Append the `exchangeOAuthCode` + `preflightOAuthExchange` handlers and routes
 *   exactly once (idempotent).
 *
 * This script is intentionally conservative: if it detects that the OAuth
 * handlers or routes already exist, it will not modify the file again.
 */

const fs = require("fs").promises;
const path = require("path");

const OAUTH_MARKER = "exchangeOAuthCode";
const ROUTE_MARKER = 'path: "/oauth/exchange"';

async function main() {
  const currentDir = process.cwd();
  const currentDirName = path.basename(currentDir);
  
  let httpPath;
  
  // If user is in the convex folder, work with http.ts directly
  if (currentDirName === "convex") {
    httpPath = path.join(currentDir, "http.ts");
  } else {
    // If user is in project root, work with convex/http.ts
    const convexDir = path.join(currentDir, "convex");
    httpPath = path.join(convexDir, "http.ts");
    
    // Only create convex directory if it doesn't exist and we need to create the file
    try {
      await fs.access(convexDir);
      // Directory exists, no need to create it
    } catch {
      // Directory doesn't exist, but we'll create it only if we need to create the file
      // We'll handle this when we try to write the file
    }
  }

  let httpContent = "";
  let httpExists = true;

  try {
    httpContent = await fs.readFile(httpPath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      httpExists = false;
      // If file doesn't exist and we're in project root, ensure convex directory exists
      if (currentDirName !== "convex") {
        const convexDir = path.dirname(httpPath);
        try {
          await fs.mkdir(convexDir, { recursive: true });
        } catch (mkdirErr) {
          // If directory creation fails, it might be a permissions issue
          // We'll try to create the file anyway, which will also create the directory
        }
      }
    } else {
      const fileDisplayName = currentDirName === "convex" ? "http.ts" : "convex/http.ts";
      console.error(`[convex-panel] Failed to read ${fileDisplayName}:`, err.message);
      process.exit(1);
    }
  }

  if (!httpExists) {
    httpContent =
      'import { httpRouter } from "convex/server";\n' +
      'const http = httpRouter();\n\n' +
      "export default http;\n";
    const fileDisplayName = currentDirName === "convex" ? "http.ts" : "convex/http.ts";
    console.log(`[convex-panel] Created new ${fileDisplayName} file.`);
  } else {
    const fileDisplayName = currentDirName === "convex" ? "http.ts" : "convex/http.ts";
    console.log(`[convex-panel] Found existing ${fileDisplayName} file. Will append OAuth handlers.`);
  }

  // If we've already added the OAuth handler or route, do nothing.
  if (httpContent.includes(OAUTH_MARKER) || httpContent.includes(ROUTE_MARKER)) {
    console.log(
      "[convex-panel] OAuth HTTP action already present in convex/http.ts; no changes made."
    );
    return;
  }

  let updated = httpContent;

  // Ensure import for httpRouter from "convex/server"
  if (!updated.includes('from "convex/server"') && !updated.includes("from 'convex/server'")) {
    updated =
      'import { httpRouter } from "convex/server";\n' +
      updated.replace(/^\s*/, (m) => m); // keep existing leading whitespace
  } else {
    // Add httpRouter to existing import if missing
    updated = updated.replace(
      /import\s*{([^}]+)}\s*from\s*["']convex\/server["'];?/,
      (match, group) => {
        if (group.includes("httpRouter")) return match;
        const parts = group
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        parts.push("httpRouter");
        return `import { ${Array.from(new Set(parts)).join(", ")} } from "convex/server";`;
      }
    );
  }

  // Ensure import for httpAction from "./_generated/server"
  if (
    !updated.includes('from "./_generated/server"') &&
    !updated.includes("from './_generated/server'")
  ) {
    // Insert after convex/server import if possible; otherwise prepend.
    if (updated.includes('from "convex/server"') || updated.includes("from 'convex/server'")) {
      updated = updated.replace(
        /(import\s*{[^}]+}\s*from\s*["']convex\/server["'];?\s*)/,
        `$1import { httpAction } from "./_generated/server";\n`
      );
    } else {
      updated = `import { httpAction } from "./_generated/server";\n` + updated;
    }
  } else {
    // Add httpAction to existing generated server import if missing
    updated = updated.replace(
      /import\s*{([^}]+)}\s*from\s*["']\.\/_generated\/server["'];?/,
      (match, group) => {
        if (group.includes("httpAction")) return match;
        const parts = group
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        parts.push("httpAction");
        return `import { ${Array.from(new Set(parts)).join(", ")} } from "./_generated/server";`;
      }
    );
  }

  // Ensure there is a single `const http = httpRouter();`
  if (!/const\s+http\s*=\s*httpRouter\(\s*\)/.test(updated)) {
    // Insert after last import block
    const importBlockMatch = updated.match(/((?:import[\s\S]+?;\s*)+)/);
    if (importBlockMatch) {
      const imports = importBlockMatch[1];
      updated = updated.replace(
        imports,
        `${imports}\nconst http = httpRouter();\n`
      );
    } else {
      updated = `const http = httpRouter();\n` + updated;
    }
  }

  // Ensure there's an `export default http;` at the end or before last export default
  let exportDefaultIndex = updated.indexOf("export default http");
  if (exportDefaultIndex === -1) {
    updated = `${updated.trimEnd()}\n\nexport default http;\n`;
    exportDefaultIndex = updated.indexOf("export default http");
  }

  // OAuth HTTP action block (no imports, no httpRouter definition).
  const oauthBlock = `
/**
 * OAuth code → token exchange endpoint for Convex Panel.
 *
 * This runs inside the user's own Convex deployment, so each team keeps
 * their Convex OAuth client secret in their own Convex env vars.
 *
 * Expected request body (JSON):
 * {
 *   code: string;
 *   codeVerifier?: string;   // camelCase, from our frontend
 *   code_verifier?: string;  // snake_case, for compatibility
 *   redirectUri?: string;
 * }
 */
export const exchangeOAuthCode = httpAction(async (ctx, request) => {
  const origin = request.headers.get("Origin") ?? "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  const {
    code,
    code_verifier: snakeCodeVerifier,
    codeVerifier: camelCodeVerifier,
    redirectUri,
  } = body ?? {};

  const codeVerifier = camelCodeVerifier ?? snakeCodeVerifier ?? undefined;

  if (!code || typeof code !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid \`code\` in request body" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  const clientId =
    process.env.CONVEX_CLIENT_ID ??
    process.env.VITE_OAUTH_CLIENT_ID ??
    process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ??
    undefined;

  const clientSecret =
    process.env.CONVEX_CLIENT_SECRET ??
    process.env.OAUTH_CLIENT_SECRET ??
    undefined;

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({
        error:
          "OAuth client credentials not configured in Convex. Set CONVEX_CLIENT_ID (or VITE_OAUTH_CLIENT_ID) and CONVEX_CLIENT_SECRET in your Convex deployment environment variables.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  const finalRedirectUri =
    redirectUri ??
    process.env.OAUTH_REDIRECT_URI ??
    process.env.VITE_OAUTH_REDIRECT_URI ??
    undefined;

  if (!finalRedirectUri) {
    return new Response(
      JSON.stringify({
        error:
          "Missing redirect URI. Provide \`redirectUri\` in the request body or configure OAUTH_REDIRECT_URI / VITE_OAUTH_REDIRECT_URI in Convex env.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: finalRedirectUri,
    code,
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  try {
    const resp = await fetch("https://api.convex.dev/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const text = await resp.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error:
          err?.message ??
          "Internal error while exchanging OAuth code for token in Convex httpAction",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

export const preflightOAuthExchange = httpAction(async (_ctx, request) => {
  const origin = request.headers.get("Origin") ?? "*";
  const requestMethod = request.headers.get("Access-Control-Request-Method");
  const requestHeaders = request.headers.get("Access-Control-Request-Headers");

  if (origin && requestMethod && requestHeaders) {
    return new Response(null, {
      status: 204,
      headers: new Headers({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": requestHeaders,
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }),
    });
  }

  return new Response(null, { status: 204 });
});

http.route({
  path: "/oauth/exchange",
  method: "POST",
  handler: exchangeOAuthCode,
});

http.route({
  path: "/oauth/exchange",
  method: "OPTIONS",
  handler: preflightOAuthExchange,
});
`;

  // Insert OAuth block before `export default http;`
  const insertionIndex = updated.indexOf("export default http");
  if (insertionIndex === -1) {
    updated = `${updated.trimEnd()}\n\n${oauthBlock}\n`;
  } else {
    updated =
      updated.slice(0, insertionIndex) +
      `\n\n${oauthBlock}\n\n` +
      updated.slice(insertionIndex);
  }

  await fs.writeFile(httpPath, updated, "utf8");
  const fileDisplayName = currentDirName === "convex" ? "http.ts" : "convex/http.ts";
  if (httpExists) {
    console.log(
      `[convex-panel] Successfully appended OAuth HTTP action routes to existing ${fileDisplayName} (path: /oauth/exchange).`
    );
  } else {
    console.log(
      `[convex-panel] Successfully created ${fileDisplayName} with OAuth HTTP action routes (path: /oauth/exchange).`
    );
  }
}

main().catch((err) => {
  console.error("[convex-panel] setup-http-oauth failed:", err);
  process.exit(1);
});


