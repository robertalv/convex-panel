import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { ossStats } from "./stats";

const http = httpRouter();

/**
 * OAuth code → token exchange endpoint for Convex Panel.
 *
 * This runs inside the user's own Convex deployment, so each team keeps
 * their Convex OAuth client secret in their **own** Convex env vars, instead
 * of sharing it with api.convexpanel.dev.
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
  const corsHeaders: Record<string, string> = {
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
      JSON.stringify({ error: "Missing or invalid `code` in request body" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // Resolve client ID from Convex env. These names line up with what users
  // typically configure in their Convex deployment settings.
  // Read OAuth credentials from Convex function environment (Node-style env vars).
  // These are configured in your Convex deployment settings, not in the client.
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
          "Missing redirect URI. Provide `redirectUri` in the request body or configure OAUTH_REDIRECT_URI / VITE_OAUTH_REDIRECT_URI in Convex env.",
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

// Pre-flight OPTIONS handler for /oauth/exchange (CORS)
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

  // Not a valid preflight request; just return 204 without CORS
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

// GitHub webhook endpoint for OSS stats.
// This will handle /events/github by default and keep star counts in sync.
ossStats.registerRoutes(http);

export default http;


