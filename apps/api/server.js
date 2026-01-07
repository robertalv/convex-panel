/**
 * Convex Panel API Server
 *
 * Production API for Convex Panel desktop app:
 * - Convex OAuth token exchange
 * - GitHub OAuth Device Flow
 * - GitHub App management
 * - Webhook receiver for schema updates
 * - SSE for real-time notifications
 *
 * Deploy to: api.convexpanel.dev
 */

try {
  require("dotenv").config({
    path: require("path").join(__dirname, ".env.local"),
  });
} catch (e) {
  // dotenv may not be available in production
}

const express = require("express");
const cors = require("cors");

const githubOAuthRouter = require("./src/handlers/github-oauth");
const githubAppRouter = require("./src/handlers/github-app");
const {
  router: webhookRouter,
  setBroadcaster,
} = require("./src/handlers/github-webhook");
const {
  router: eventsRouter,
  broadcastToRepo,
} = require("./src/handlers/events");

const app = express();
const PORT = process.env.PORT || 3001;

setBroadcaster(broadcastToRepo);

// =============================================================================
// CORS Configuration
// =============================================================================

const allowedOrigins = [
  "https://convexpanel.dev",
  "https://www.convexpanel.dev",
  "https://api.convexpanel.dev",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:1420",
  "http://localhost:14200",
  "tauri://localhost",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (
        allowed.startsWith("http://localhost") ||
        allowed.startsWith("https://localhost")
      ) {
        return origin.startsWith(allowed);
      }
      if (allowed === "tauri://localhost") {
        return origin.startsWith("tauri://");
      }
      return origin === allowed || origin.endsWith(".convexpanel.dev");
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// =============================================================================
// Middleware
// =============================================================================

app.use((req, res, next) => {
  if (req.path === "/github/webhook" || req.path === "/v1/github/webhook") {
    return next();
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (!req.path.includes("/events/subscribe")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// =============================================================================
// Routes
// =============================================================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "convex-panel-api",
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.get("/", (req, res) => {
  res.json({
    service: "Convex Panel API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      convexOAuth: "/v1/convex/oauth",
      githubDeviceCode: "/v1/github/device/code",
      githubDeviceToken: "/v1/github/device/token",
      githubAppInstallUrl: "/v1/github/app/install-url",
      githubAppInstallations: "/v1/github/app/installations",
      githubAppRepos: "/v1/github/app/repos",
      githubWebhook: "/v1/github/webhook",
      eventsSubscribe: "/v1/events/subscribe",
    },
  });
});

app.use("/v1/github", githubOAuthRouter);
app.use("/github", githubOAuthRouter);

app.use("/v1/github/app", githubAppRouter);
app.use("/github/app", githubAppRouter);

app.use("/v1/github/webhook", webhookRouter);
app.use("/github/webhook", webhookRouter);

app.use("/v1/events", eventsRouter);
app.use("/events", eventsRouter);

// =============================================================================
// Convex OAuth Token Exchange (existing functionality)
// =============================================================================

const resolveEnvVar = (keys, fallbackKey) => {
  for (const key of keys) {
    if (process.env[key]) {
      return { key, value: process.env[key] };
    }
  }
  return { key: fallbackKey || keys[0], value: undefined };
};

const CLIENT_ID_ENV_KEYS = [
  "CONVEX_CLIENT_ID",
  "OAUTH_CLIENT_ID",
  "VITE_OAUTH_CLIENT_ID",
  "NEXT_PUBLIC_OAUTH_CLIENT_ID",
  "REACT_APP_OAUTH_CLIENT_ID",
];

const CLIENT_SECRET_ENV_KEYS = [
  "CONVEX_CLIENT_SECRET",
  "OAUTH_CLIENT_SECRET",
  "VITE_OAUTH_CLIENT_SECRET",
  "NEXT_PUBLIC_OAUTH_CLIENT_SECRET",
  "REACT_APP_OAUTH_CLIENT_SECRET",
];

app.options("/v1/convex/oauth", cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});

app.post("/v1/convex/oauth", async (req, res) => {
  console.debug("Token exchange request received");

  const {
    code,
    codeVerifier,
    redirectUri,
    clientId: clientIdFromBody,
  } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" });
  }

  const { value: clientIdEnvValue } = resolveEnvVar(
    CLIENT_ID_ENV_KEYS,
    "CONVEX_CLIENT_ID",
  );
  const { value: clientSecretEnvValue } = resolveEnvVar(
    CLIENT_SECRET_ENV_KEYS,
    "CONVEX_CLIENT_SECRET",
  );

  const clientId = clientIdFromBody || clientIdEnvValue;
  const clientSecret = clientSecretEnvValue;
  const finalRedirectUri =
    redirectUri ||
    process.env.DEFAULT_REDIRECT_URI ||
    "https://convexpanel.dev";

  if (!clientId || !clientSecret) {
    console.error("OAuth client credentials not fully configured");
    return res.status(500).json({
      error: "OAuth client credentials not configured.",
    });
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: finalRedirectUri,
      code,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    const tokenResponse = await fetch("https://api.convex.dev/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return res.status(tokenResponse.status).json({
        error: `Token exchange failed: ${errorText}`,
        details: errorData,
      });
    }

    const token = await tokenResponse.json();
    res.json(token);
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).json({
      error: error.message || "Internal server error during token exchange",
    });
  }
});

// =============================================================================
// Error Handling
// =============================================================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.path,
  });
});

// =============================================================================
// Server Startup
// =============================================================================

module.exports = app;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Convex Panel API listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

    if (!process.env.GITHUB_CLIENT_ID) {
      console.warn("GITHUB_CLIENT_ID not set - GitHub OAuth will not work");
    }
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
      console.warn(
        "GITHUB_WEBHOOK_SECRET not set - Webhook signatures will not be verified",
      );
    }
  });
}

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
