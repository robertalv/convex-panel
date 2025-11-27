# Environment Variables Setup

## Two Separate Environments

### 1. Browser Environment (Vite - `.env` in project root or `dev/`)

These variables are exposed to the browser and must start with `VITE_`:

```env
# Required: OAuth Client ID (public, safe to expose)
VITE_OAUTH_CLIENT_ID=your-client-id-here

# Required: Convex deployment URL
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Required: Token exchange endpoint (points to your server)
VITE_CONVEX_TOKEN_EXCHANGE_URL=http://localhost:3001/api/convex/exchange
```

**Location:** Create `.env` in the **project root** (same level as `package.json`) or in `dev/` directory.

**Important:** 
- These are exposed to the browser
- NEVER put secrets here (no `VITE_CONVEX_CLIENT_SECRET`!)
- Restart Vite dev server after adding/changing these

### 2. Server Environment (Node.js - `.env` in `dev/` directory)

These variables are server-side only and should NOT have `VITE_` prefix:

```env
# Required: OAuth Client Secret (server-side only!)
CONVEX_CLIENT_SECRET=your-client-secret-here

# Optional: Client ID (defaults to hardcoded if not set)
CONVEX_CLIENT_ID=your-client-id-here
```

**Location:** Create `.env` in the `dev/` directory (where `server.js` is).

**Important:**
- These are server-side only
- The client secret is sensitive - keep it secure
- Restart the Node.js server after adding/changing these

## Quick Setup

1. **Create `.env` in project root** (for Vite):
   ```env
   VITE_OAUTH_CLIENT_ID=5f0e41228dd54e70
   VITE_CONVEX_URL=https://polished-sockeye-52.convex.cloud
   VITE_CONVEX_TOKEN_EXCHANGE_URL=http://localhost:3001/api/convex/exchange
   ```

2. **Create `dev/.env`** (for server):
   ```env
   CONVEX_CLIENT_SECRET=your-actual-client-secret-here
   ```

3. **Restart both servers:**
   ```bash
   npm run dev:all
   ```

## Why Two Files?

- **Browser env vars** (`VITE_*`): Exposed to client code, used by React components
- **Server env vars** (no prefix): Server-side only, used by `dev/server.js` for token exchange

The client secret must stay on the server to prevent it from being exposed to the browser.

