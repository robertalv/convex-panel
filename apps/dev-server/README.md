# Convex Panel API Server

Production-ready API server for Convex Panel. Can be deployed to `api.convexpanel.dev`.

## Features

- OAuth token exchange (server-side to avoid CORS)
- Health check endpoint
- CORS protection with configurable origins
- Error handling and logging
- Environment-based configuration

## Local Development

```bash
npm install
npm run dev
```

## Production Deployment

### Environment Variables

Set these on your hosting platform:

```env
CONVEX_CLIENT_ID=your-client-id
CONVEX_CLIENT_SECRET=your-client-secret
PORT=3001
NODE_ENV=production
DEFAULT_REDIRECT_URI=https://convexpanel.dev
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

### Deploy to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`

2. Create `fly.toml`:
```toml
app = "convex-panel-api"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  memory_mb = 256
  cpu_kind = "shared"
  cpus = 1
```

3. Deploy:
```bash
flyctl launch
flyctl secrets set CONVEX_CLIENT_ID=... CONVEX_CLIENT_SECRET=...
flyctl deploy
```

### Deploy to Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Deploy to Vercel

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### Deploy to Render

1. Create new Web Service
2. Point to this directory
3. Build command: `npm install`
4. Start command: `npm start`
5. Set environment variables

## API Endpoints

### POST `/api/convex/exchange`

Exchange OAuth authorization code for access token.

**Request:**
```json
{
  "code": "authorization_code",
  "codeVerifier": "optional_pkce_code_verifier",
  "redirectUri": "https://your-app.com"
}
```

**Response:**
```json
{
  "access_token": "token_here",
  "token_type": "bearer",
  "expires_at": 1234567890
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "convex-panel-api",
  "version": "1.0.0"
}
```

## Usage in Panel

Configure the panel to use your API server:

```typescript
<ConvexPanel
  oauthConfig={{
    clientId: "your-client-id",
    redirectUri: window.location.origin,
    scope: "project",
    tokenExchangeUrl: "https://api.convexpanel.dev/api/convex/exchange"
  }}
/>
```

## License

MIT

