// Simple Express server for OAuth token exchange in dev environment
// Run with: node dev/server.js

// Load environment variables from .env file (if dotenv is available)
try {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
} catch (e) {
  console.error('dotenv not found, using environment variables directly');
}

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;

// Helper to resolve environment variables from multiple possible keys
// (e.g. CONVEX_CLIENT_ID, OAUTH_CLIENT_ID, VITE_OAUTH_CLIENT_ID, NEXT_PUBLIC_OAUTH_CLIENT_ID)
const resolveEnvVar = (keys, fallbackKey) => {
  for (const key of keys) {
    if (process.env[key]) {
      return { key, value: process.env[key] };
    }
  }
  return { key: fallbackKey || keys[0], value: undefined };
};

const CLIENT_ID_ENV_KEYS = [
  'CONVEX_CLIENT_ID',
  'OAUTH_CLIENT_ID',
  'VITE_OAUTH_CLIENT_ID',
  'NEXT_PUBLIC_OAUTH_CLIENT_ID',
  'REACT_APP_OAUTH_CLIENT_ID',
];

const CLIENT_SECRET_ENV_KEYS = [
  'CONVEX_CLIENT_SECRET',
  'OAUTH_CLIENT_SECRET',
  'VITE_OAUTH_CLIENT_SECRET',
  'NEXT_PUBLIC_OAUTH_CLIENT_SECRET',
  'REACT_APP_OAUTH_CLIENT_SECRET',
];

// CORS configuration - allow requests from convexpanel.dev and subdomains
const allowedOrigins = [
  'https://convexpanel.dev',
  'https://www.convexpanel.dev',
  'https://api.convexpanel.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:14200', // Tauri
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.startsWith('http://localhost') || allowed.startsWith('https://localhost')) {
        return origin.startsWith(allowed);
      }
      // Allow any subdomain of convexpanel.dev
      return origin === allowed || origin.endsWith('.convexpanel.dev');
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.options('/v1/convex/oauth', cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'convex-panel-api',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Convex Panel API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      oauthExchange: '/v1/convex/oauth',
    },
  });
});

app.post('/v1/convex/oauth', async (req, res) => {
  console.debug('Token exchange request received');
  console.debug('Request body:', { 
    hasCode: !!req.body.code, 
    hasCodeVerifier: !!req.body.codeVerifier,
    redirectUri: req.body.redirectUri 
  });
  
  const { code, codeVerifier, redirectUri, clientId: clientIdFromBody } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  // Get OAuth credentials from environment (no hardcoded defaults in production)
  // Prefer clientId from the request body (so frontend and backend stay in sync),
  // but fall back to any of the supported env vars for existing deployments.
  const { key: clientIdEnvKey, value: clientIdEnvValue } = resolveEnvVar(
    CLIENT_ID_ENV_KEYS,
    'CONVEX_CLIENT_ID'
  );
  const { key: clientSecretEnvKey, value: clientSecretEnvValue } = resolveEnvVar(
    CLIENT_SECRET_ENV_KEYS,
    'CONVEX_CLIENT_SECRET'
  );

  const clientId = clientIdFromBody || clientIdEnvValue;
  const clientSecret = clientSecretEnvValue;
  const finalRedirectUri = redirectUri || process.env.DEFAULT_REDIRECT_URI || 'https://convexpanel.dev';

  // Extra diagnostics to confirm which env vars are being used (without logging full secrets)
  console.debug('[OAuth] Credential resolution:', {
    clientIdFromBodyPreview: clientIdFromBody
      ? `${String(clientIdFromBody).substring(0, 6)}…${String(clientIdFromBody).substring(
          String(clientIdFromBody).length - 4
        )}`
      : null,
    clientIdEnvKey,
    clientIdEnvValuePresent: !!clientIdEnvValue,
    clientIdPreview: clientId
      ? `${String(clientId).substring(0, 6)}…${String(clientId).substring(
          String(clientId).length - 4
        )}`
      : null,
    clientSecretEnvKey,
    clientSecretEnvValuePresent: !!clientSecretEnvValue,
    clientSecretLength: clientSecret ? String(clientSecret).length : 0,
    clientSecretPreview: clientSecret
      ? `${String(clientSecret).substring(0, 4)}…${String(clientSecret).substring(
          String(clientSecret).length - 4
        )}`
      : null,
  });

  if (!clientId || !clientSecret) {
    console.error('OAuth client credentials not fully configured');
    console.error('Current env lookup:', {
      clientIdFromBody: !!clientIdFromBody,
      clientIdEnvKey,
      clientIdEnvValuePresent: !!clientIdEnvValue,
      clientSecretEnvKey,
      clientSecretEnvValuePresent: !!clientSecretEnvValue,
    });
    return res.status(500).json({ 
      error: 'OAuth client credentials not configured. Provide clientId in request body or set CONVEX_CLIENT_ID and CONVEX_CLIENT_SECRET environment variables.' 
    });
  }

  console.debug('Exchanging code for token...');
  console.debug('Client ID:', clientId);
  console.debug('Redirect URI:', finalRedirectUri);
  console.debug('Has code verifier:', !!codeVerifier);
  console.debug('Code (first 20 chars):', code.substring(0, 20) + '...');

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: finalRedirectUri,
      code,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    console.debug('Request params:', {
      client_id: clientId,
      has_client_secret: !!clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: finalRedirectUri,
      has_code: !!code,
      has_code_verifier: !!codeVerifier,
    });

    const tokenResponse = await fetch('https://api.convex.dev/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    console.debug('Convex API response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });
      
      let errorMessage = `Token exchange failed: ${errorText}`;
      if (errorData.code === 'InternalServerError') {
        errorMessage = `Convex API returned an internal server error. This usually means:\n` +
          `1. The redirect URI doesn't match what's registered in your OAuth app\n` +
          `2. The authorization code has expired or was already used\n` +
          `3. There's a mismatch between client ID and client secret\n` +
          `4. The redirect URI in your OAuth app must exactly match: ${finalRedirectUri}\n\n` +
          `Check your OAuth app settings at: https://dashboard.convex.dev/team/settings`;
      }
       
      return res.status(tokenResponse.status).json({ 
        error: errorMessage,
        details: errorData
      });
    }

    const token = await tokenResponse.json();
    console.log('Token exchange successful');
    
    res.json(token);
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error during token exchange' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Export the app for Vercel serverless functions
module.exports = app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Convex Panel API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`OAuth exchange: http://localhost:${PORT}/v1/convex/oauth`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    const { key: resolvedClientIdKey, value: resolvedClientIdValue } = resolveEnvVar(
      CLIENT_ID_ENV_KEYS,
      'CONVEX_CLIENT_ID'
    );
    const { key: resolvedClientSecretKey, value: resolvedClientSecretValue } = resolveEnvVar(
      CLIENT_SECRET_ENV_KEYS,
      'CONVEX_CLIENT_SECRET'
    );

    console.log(
      `Client ID (${CLIENT_ID_ENV_KEYS.join(
        ' | '
      )}) -> using "${resolvedClientIdKey}": ${resolvedClientIdValue ? 'Set' : 'Missing'}`
    );
    console.log(
      `Client Secret (${CLIENT_SECRET_ENV_KEYS.join(
        ' | '
      )}) -> using "${resolvedClientSecretKey}": ${resolvedClientSecretValue ? 'Set' : 'Missing'}`
    );
    
    if (!resolvedClientSecretValue) {
      console.warn(
        `No client secret found. Checked keys: ${CLIENT_SECRET_ENV_KEYS.join(
          ', '
        )}. Set one of these (e.g. CONVEX_CLIENT_SECRET) to enable OAuth token exchange.`
      );
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
