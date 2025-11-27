# Dev Environment Setup

This directory contains the development environment for convex-panel.

## OAuth Setup

The OAuth token exchange must happen server-side due to CORS restrictions. For development, we provide a simple Express proxy server.

### 1. Set Environment Variables

**Option A: Using a `.env` file (Recommended)**

Create a `.env` file in the `dev/` directory:

```bash
# Copy the example file
cp dev/.env.example dev/.env

# Edit dev/.env and add your client secret
CONVEX_CLIENT_ID=5f0e41228dd54e70
CONVEX_CLIENT_SECRET=your-actual-client-secret-here
```

**Option B: Using environment variables**

Export the variable before starting the server:

```bash
export CONVEX_CLIENT_SECRET=your-actual-client-secret-here
npm run dev:server
```

**Important**: Get your `CONVEX_CLIENT_SECRET` from:
1. Go to [Convex Dashboard → Team Settings → OAuth Applications](https://dashboard.convex.dev/team/settings)
2. Open your OAuth app
3. Copy the Client Secret (it's only shown once, so save it securely!)

### 2. Start the Dev Server (OAuth Proxy)

In a separate terminal, run:

```bash
npm run dev:server
```

This starts the OAuth proxy server on `http://localhost:3001`.

### 3. Start the Vite Dev Server

In another terminal, run:

```bash
npm run dev:live
```

This starts the Vite dev server on `http://localhost:5173`.

### 4. Configure Redirect URI

Make sure `http://localhost:5173` is added to your OAuth app's redirect URIs in the Convex Dashboard.

## How It Works

1. User clicks "Connect" → Redirected to Convex OAuth
2. User authorizes → Redirected back to `http://localhost:5173?code=...`
3. App sends code to proxy server → `http://localhost:3001/api/convex/exchange`
4. Proxy server exchanges code for token (using client_secret)
5. Token returned to app → Stored in localStorage
6. User is authenticated ✅

## Troubleshooting

### "CONVEX_CLIENT_SECRET not set"
- Make sure you've set the `CONVEX_CLIENT_SECRET` environment variable
- You can create a `.env` file in the `dev/` directory

### "Redirect URI not allowed"
- Make sure `http://localhost:5173` is added to your OAuth app's redirect URIs
- The redirect URI must match exactly (including protocol and port)

### CORS errors
- Make sure the dev server is running on port 3001
- Check that `tokenExchangeUrl` in `App.tsx` points to `http://localhost:3001/api/convex/exchange`
