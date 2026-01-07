# convex-panel

[![NPM Version](https://img.shields.io/npm/v/convex-panel)](https://www.npmjs.com/package/convex-panel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundlephobia](https://badgen.net/bundlephobia/minzip/convex-panel@latest)](https://bundlephobia.com/package/convex-panel)

A powerful development panel for [Convex](https://convex.dev) applications that provides real-time logs, data inspection, function testing, health monitoring, and more.

## Features

| Feature | Description |
|---------|-------------|
| **Data View** | Browse, filter, sort, and edit your Convex tables with an intuitive interface |
| **Live Logs** | Monitor function calls, HTTP actions, and system events in real-time |
| **Health Dashboard** | Track cache hit rates, scheduler health, database performance, and latency |
| **Function Runner** | Execute queries, mutations, and actions directly with custom inputs |
| **Code Inspection** | View function source code with syntax highlighting |
| **Performance Metrics** | Interactive charts for invocation rates, error rates, and execution times |
| **In-place Editing** | Double-click to edit data values directly in the table |
| **Scheduled Jobs** | View and manage your cron jobs and scheduled functions |
| **Components View** | Browse and manage installed Convex components |
| **Theme Support** | Dark and light themes with customization options |
| **State Persistence** | Automatically saves panel position, size, and preferences |
| **OAuth & Token Auth** | Supports OAuth flow or manual token authentication |

## Installation

```bash
npm install convex-panel --save-dev
# or
yarn add convex-panel --dev
# or
pnpm add convex-panel --save-dev
# or
bun add convex-panel --dev
```

## Quick Setup

The easiest way to get started is using the interactive setup command:

```bash
npx convex-panel setup
```

This command will:
- Create or update `convex/http.ts` with OAuth endpoints
- Prompt you for required environment variables
- Configure your project for OAuth authentication

## Step-by-Step Setup Guide

### Step 1: Install Convex Panel

```bash
npm install convex-panel --save-dev
```

### Step 2: Run Setup Command

From your project root (where your `convex/` folder lives), run:

```bash
npx convex-panel setup
```

This interactive command will:
1. **Create/update `convex/http.ts`**: Adds OAuth HTTP action endpoints (`POST /oauth/exchange` and `OPTIONS /oauth/exchange`) to handle token exchange
2. **Prompt for environment variables**: Guides you through setting up:
   - `VITE_CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` (your Convex deployment URL)
   - `VITE_OAUTH_CLIENT_ID` or `NEXT_PUBLIC_OAUTH_CLIENT_ID` (OAuth client ID)
   - `VITE_CONVEX_TOKEN_EXCHANGE_URL` or `NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL` (token exchange URL)
   - `CONVEX_CLIENT_SECRET` (OAuth client secret - local only)
   - `CONVEX_ACCESS_TOKEN` (optional access token)

> **Note:** If `http.ts` is created in the wrong location (e.g., a `/convex` folder in your app root instead of your actual `convex/` folder), simply move the file to the correct `convex/` directory in your project.

### Step 3: Configure OAuth in Convex Dashboard

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to your team settings and create an OAuth application
3. Copy the **Client ID** and **Client Secret**
4. In your Convex deployment settings, add these environment variables:
   - `CONVEX_CLIENT_ID` - Use the same Client ID from your `.env` file
   - `CONVEX_CLIENT_SECRET` - Use the Client Secret (this should **never** be in your frontend `.env` file, only in Convex dashboard)
   - Optionally `OAUTH_REDIRECT_URI` - Your frontend origin (e.g., `http://localhost:5173` or `https://your-site.com`)

### Step 4: Create Access Token

1. Go to [Convex Dashboard](https://dashboard.convex.dev) → Team Settings → Access Tokens
2. Create a new access token (team-level token recommended)
3. Copy the token value
4. The setup script should have already prompted you for `CONVEX_ACCESS_TOKEN` - if not, add it to your `.env` file:
   ```bash
   CONVEX_ACCESS_TOKEN=your-token-here
   ```

### Step 5: Framework-Specific Configuration

#### Next.js

Add the access token to your `next.config.js`:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CONVEX_ACCESS_TOKEN: process.env.CONVEX_ACCESS_TOKEN,
  },
  // ... other config
};

module.exports = nextConfig;
```

Then use the panel in your app:

```tsx
// app/providers.tsx
"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel />
    </ConvexProvider>
  );
}
```

#### Vite / React (Standard)

```tsx
// src/App.tsx
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function App() {
  return (
    <ConvexProvider client={convex}>
      {/* Your app */}
      <ConvexPanel />
    </ConvexProvider>
  );
}
```

#### Tanstack Start

Update your `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const accessToken = env.CONVEX_ACCESS_TOKEN;

  return {
    plugins: [tanstackStart()],
    define: {
      // This replaces __CONVEX_ACCESS_TOKEN__ at build time
      __CONVEX_ACCESS_TOKEN__: JSON.stringify(accessToken),
    },
  };
});
```

Then use in your root component:

```tsx
// app/root.tsx
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexPanel } from "convex-panel/react";

declare const __CONVEX_ACCESS_TOKEN__: string | undefined;

function RootDocument() {
  const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
  
  return (
    <ConvexProvider client={convex}>
      {/* Your app */}
      {__CONVEX_ACCESS_TOKEN__ && (
        <ConvexPanel accessToken={__CONVEX_ACCESS_TOKEN__} />
      )}
    </ConvexProvider>
  );
}
```

#### React Router

Update your `vite.config.ts`:

```typescript
// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const accessToken = env.CONVEX_ACCESS_TOKEN;

  return {
    plugins: [reactRouter()],
    define: {
      __CONVEX_ACCESS_TOKEN__: JSON.stringify(accessToken),
    },
  };
});
```

Then use in your root component:

```tsx
// app/root.tsx
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ConvexPanel } from "convex-panel/react";

declare const __CONVEX_ACCESS_TOKEN__: string | undefined;

export default function App() {
  const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
  
  return (
    <ConvexProvider client={convex}>
      {/* Your app */}
      <ConvexPanel accessToken={__CONVEX_ACCESS_TOKEN__} />
    </ConvexProvider>
  );
}
```

### Step 6: Connect to Your Convex Project

1. Start your development server
2. The Convex Panel will appear at the bottom of your screen
3. Click the **"Connect"** button
4. You'll be redirected to Convex OAuth login
5. After authentication, you'll be redirected back to your app
6. Select your Convex project from the dropdown in the panel
7. The panel will now be connected and ready to use!

## Environment Variables

### Local Environment (`.env` or `.env.local`)

These variables go in your project's `.env` file:

| Variable | Framework | Description |
|----------|-----------|-------------|
| `VITE_CONVEX_URL` | Vite/React | Your Convex deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | Next.js | Your Convex deployment URL |
| `REACT_APP_CONVEX_URL` | Create React App | Your Convex deployment URL |
| `VITE_OAUTH_CLIENT_ID` | Vite/React | OAuth client ID from Convex dashboard |
| `NEXT_PUBLIC_OAUTH_CLIENT_ID` | Next.js | OAuth client ID from Convex dashboard |
| `VITE_CONVEX_TOKEN_EXCHANGE_URL` | Vite/React | Token exchange URL (usually `https://your-deployment.convex.site/oauth/exchange`) |
| `NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL` | Next.js | Token exchange URL |
| `CONVEX_CLIENT_SECRET` | All | OAuth client secret (local only, never commit) |
| `CONVEX_ACCESS_TOKEN` | All | Access token for direct authentication (optional) |

### Convex Dashboard Environment Variables

These variables must be set in your Convex deployment settings (not in your local `.env`):

| Variable | Description |
|----------|-------------|
| `CONVEX_CLIENT_ID` | Same OAuth client ID as in your `.env` file |
| `CONVEX_CLIENT_SECRET` | OAuth client secret (server-side only) |
| `OAUTH_REDIRECT_URI` | Optional: Your frontend origin for OAuth redirects |

> **Important:** `CONVEX_CLIENT_SECRET` should **never** be in your frontend `.env` file. It must only exist in your Convex deployment environment variables.

## Framework-Specific Imports

Convex Panel provides framework-specific entry points for optimal integration:

- **`convex-panel/nextjs`** - Next.js-optimized wrapper with built-in SSR handling
- **`convex-panel/react`** - React/Vite-optimized wrapper without SSR overhead
- **`convex-panel`** - Default export (backward compatible, works everywhere)

### Why use framework-specific imports?

- **Next.js**: The `/nextjs` import handles client-side rendering automatically, preventing hydration issues
- **React/Vite**: The `/react` import is simpler and has no SSR overhead for client-only apps
- **Default**: Use the default import if you prefer manual SSR handling or need maximum compatibility

All imports provide the same functionality - choose based on your framework for the best experience.

## Configuration

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `convex` | `ConvexReactClient` | Auto-detected | Convex client instance (auto-detected from ConvexProvider) |
| `deployUrl` | `string` | Auto-detected | Your Convex deployment URL |
| `accessToken` | `string` | - | Manual access token (if not using OAuth) |
| `deployKey` | `string` | - | Deploy key for admin-level access |
| `defaultTheme` | `'dark' \| 'light'` | `'dark'` | Initial theme (persisted in localStorage) |
| `useMockData` | `boolean` | `false` | Use mock data for development/testing |
| `onError` | `(error: string) => void` | - | Error callback |

### OAuth Configuration (Advanced)

For custom OAuth setups, you can provide an `oauthConfig`. This is useful if you have your own backend endpoint for token exchange:

```tsx
<ConvexPanel
  oauthConfig={{
    clientId: "your-client-id",
    redirectUri: window.location.origin,
    scope: "project", // or "team"
    tokenExchangeUrl: "https://your-deployment.convex.site/oauth/exchange",
  }}
/>
```

### Custom Authentication

You can provide your own authentication implementation:

```tsx
import { useOAuth } from "convex-panel";

const customAuth = useOAuth(oauthConfig);

<ConvexPanel auth={customAuth} />
```

## Views

### Data View
Browse, filter, sort, and edit your Convex tables:
- **Table Browser**: View all tables with paginated data display
- **Advanced Filtering**: Query-based filtering with date ranges and full-text search
- **In-place Editing**: Double-click any cell to edit (auto-converts types)
- **Context Menu**: Right-click for quick actions (copy, delete, view details)

### Logs View
Real-time function logs with powerful filtering:
- **Type Filtering**: SUCCESS, FAILURE, DEBUG, WARNING, ERROR, HTTP
- **Full-text Search**: Search across all log messages
- **Time Range**: Filter logs by specific time periods
- **Export**: Download logs in JSON format

### Health View
Monitor your Convex application's performance:
- **Cache Hit Rate**: Track caching efficiency
- **Failure Rate**: Monitor function error rates
- **Scheduler Status**: View scheduled function health
- **Latency Charts**: Visualize system response times

### Functions View
Test and debug your Convex functions:
- **Function Runner**: Execute queries, mutations, and actions
- **Code Inspection**: View source code with syntax highlighting
- **Input Editor**: Monaco editor with JSON support
- **Performance Metrics**: Invocation counts, error rates, execution times

### Schedules View
Manage scheduled jobs and cron functions:
- View all scheduled and cron jobs
- Execution history and status
- Manual trigger capability

### Components View
Browse installed Convex components:
- View component metadata
- Explore component functions

## Vite Configuration

For Vite projects with Monaco Editor support:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import convexPanelViteConfig from 'convex-panel/vite';

export default defineConfig({
  ...convexPanelViteConfig,
  // Your other configurations...
});
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev:live

# Build the package
npm run build
```

### Package Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the package for production |
| `npm run dev` | Watch mode for development |
| `npm run dev:live` | Start the live development server |
| `npm run dev:server` | Start the development API server |
| `npm run clean` | Remove dist folder |

## Troubleshooting

### Panel not appearing?
- Ensure the component is inside a `ConvexProvider`
- Check for z-index conflicts with your app
- Use framework-specific import for Next.js: `convex-panel/nextjs`

### Authentication issues?
- Verify OAuth credentials are set in both `.env` and Convex dashboard
- Check that `CONVEX_CLIENT_SECRET` is in Convex dashboard (not in `.env`)
- Ensure token exchange URL matches your deployment
- Check browser console for errors

### Build warnings about "use client"?
- This is expected for client components
- Won't affect functionality

### http.ts file in wrong location?
- If the setup script created `http.ts` in the wrong folder, manually move it to your actual `convex/` directory
- Ensure the file is in the same directory as your other Convex functions

### Access token not working?
- For Next.js: Ensure `CONVEX_ACCESS_TOKEN` is exposed in `next.config.js` `env` config
- For Vite: Ensure `__CONVEX_ACCESS_TOKEN__` is defined in `vite.config.ts` and passed to the component
- Verify the token is a valid team-level access token from Convex dashboard

## License

MIT © [Robert Alvarez](https://github.com/robertalv)

## Links

- [Homepage](https://convexpanel.dev)
- [GitHub Repository](https://github.com/robertalv/convex-panel)
- [Issue Tracker](https://github.com/robertalv/convex-panel/issues)
- [NPM Package](https://www.npmjs.com/package/convex-panel)
