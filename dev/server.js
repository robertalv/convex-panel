// Simple Express server for OAuth token exchange in dev environment
// Run with: node dev/server.js

// Load environment variables from .env file (if dotenv is available)
try {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });
} catch (e) {
  // dotenv not installed, use environment variables directly
  console.log('[Dev Server] dotenv not found, using environment variables directly');
}

const express = require('express');
const cors = require('cors');
const app = express();

const PORT = 3004; // Different port from Vite dev server

// CORS configuration - must be before other middleware
const corsOptions = {
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('/api/convex/exchange', cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth token exchange endpoint
app.post('/api/convex/exchange', async (req, res) => {
  console.log('[Dev Server] Token exchange request received');
  console.log('[Dev Server] Request body:', { 
    hasCode: !!req.body.code, 
    hasCodeVerifier: !!req.body.codeVerifier,
    redirectUri: req.body.redirectUri 
  });
  
  const { code, codeVerifier, redirectUri } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  // Get OAuth credentials from environment variables
  const clientId = process.env.CONVEX_CLIENT_ID || '5f0e41228dd54e70';
  // TODO: Remove hardcoded secret after testing - use environment variable instead
  const clientSecret = process.env.CONVEX_CLIENT_SECRET || '008aabd7eb094a3baa77c56162163bbd';
  const finalRedirectUri = redirectUri || 'http://localhost:5173';

  if (!clientSecret) {
    console.error('[Dev Server] CONVEX_CLIENT_SECRET not set in environment');
    console.error('[Dev Server] Current env vars:', {
      hasClientId: !!process.env.CONVEX_CLIENT_ID,
      hasClientSecret: !!process.env.CONVEX_CLIENT_SECRET,
    });
    return res.status(500).json({ 
      error: 'OAuth client secret not configured. Set CONVEX_CLIENT_SECRET environment variable.' 
    });
  }

  console.log('[Dev Server] Exchanging code for token...');
  console.log('[Dev Server] Client ID:', clientId);
  console.log('[Dev Server] Redirect URI:', finalRedirectUri);
  console.log('[Dev Server] Has code verifier:', !!codeVerifier);
  console.log('[Dev Server] Code (first 20 chars):', code.substring(0, 20) + '...');

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: finalRedirectUri,
      code,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    console.log('[Dev Server] Request params:', {
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

    console.log('[Dev Server] Convex API response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      console.error('[Dev Server] Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });
      
      // Provide helpful error messages for common issues
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
    console.log('[Dev Server] Token exchange successful');
    
    res.json(token);
  } catch (error) {
    console.error('[Dev Server] Error during token exchange:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error during token exchange' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Dev Server] OAuth proxy server running on http://localhost:${PORT}`);
  console.log(`[Dev Server] Client ID: ${process.env.CONVEX_CLIENT_ID || '5f0e41228dd54e70'}`);
  console.log(`[Dev Server] Client Secret: ${process.env.CONVEX_CLIENT_SECRET ? '***SET***' : 'NOT SET'}`);
  if (!process.env.CONVEX_CLIENT_SECRET) {
    console.warn(`[Dev Server] ⚠️  CONVEX_CLIENT_SECRET is not set!`);
    console.warn(`[Dev Server] Create a .env file in the dev/ directory with:`);
    console.warn(`[Dev Server]   CONVEX_CLIENT_SECRET=your-secret-here`);
  }
  console.log(`[Dev Server] Configure your app to use: http://localhost:${PORT}/api/convex/exchange`);
});

