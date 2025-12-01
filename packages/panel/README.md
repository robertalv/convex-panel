# convex-panel

[![NPM Version](https://img.shields.io/npm/v/convex-panel)](https://www.npmjs.com/package/convex-panel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## Environment Setup

Create a `.env.local` (or `.env`) file in your project root.

### Minimum configuration

For Convex Panel to connect to your deployment you need a Convex URL:

- **Next.js**

```bash
NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"
```

- **Vite / React**

```bash
VITE_CONVEX_URL="https://your-deployment.convex.cloud"
```

- **Create React App**

```bash
REACT_APP_CONVEX_URL="https://your-deployment.convex.cloud"
```

### Optional: OAuth + automatic setup

Convex Panel can use OAuth to obtain a short‑lived admin token instead of manual tokens.  
To make this easy, the package ships with setup scripts that:

- Inject an OAuth HTTP action into your `convex/http.ts` (for code → token exchange).
- Help you configure the required environment variables.

From your app root (where `convex/` lives), add these scripts to your app's `package.json`:

```json
"scripts": {
  "convex-panel:setup:oauth": "node ./node_modules/convex-panel/scripts/setup-oauth.js",
  "convex-panel:setup:env": "node ./node_modules/convex-panel/scripts/setup-env.js"
}
```

Then run:

```bash
npm run convex-panel:setup:oauth
npm run convex-panel:setup:env
```

These scripts will:

- Create or update `convex/http.ts` to add:
  - `POST /oauth/exchange`
  - `OPTIONS /oauth/exchange` (CORS preflight)
- Prompt you for, and append to your env file (without overwriting existing values):
  - `VITE_CONVEX_URL` – Convex deployment URL (e.g. `https://your-deployment.convex.cloud`)
  - `VITE_OAUTH_CLIENT_ID` – Convex OAuth client ID from the Convex dashboard
  - `VITE_CONVEX_TOKEN_EXCHANGE_URL` – usually `https://your-deployment.convex.site/oauth/exchange`

In your Convex deployment settings you should also configure:

- `CONVEX_CLIENT_ID` – same OAuth client ID
- `CONVEX_CLIENT_SECRET` – OAuth client secret (server‑side only, never in frontend env)
- Optionally `OAUTH_REDIRECT_URI` – your frontend origin (e.g. `https://your-site.com`)

> **Note:** The panel auto‑detects environment variables based on your framework.  
> If you don’t want OAuth, you can skip the setup scripts and use manual tokens instead (see `accessToken` / `deployKey` props below).

## Quick Start

### Next.js (App Router)

```tsx
// app/providers.tsx
"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import dynamic from "next/dynamic";

const ConvexPanel = dynamic(() => import("convex-panel"), { ssr: false });

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

### Vite / React

```tsx
// src/App.tsx
import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel";

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

That's it! The panel will appear at the bottom of your screen. Click to expand and authenticate with your Convex account via OAuth.

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

For custom OAuth setups, you can provide an `oauthConfig`.  
This is useful if you have your own backend endpoint for token exchange:

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
- Use dynamic import for Next.js: `dynamic(() => import("convex-panel"), { ssr: false })`

### Authentication issues?
- The panel auto-redirects to OAuth login
- Check browser console for errors
- Ensure your Convex URL is correctly configured

### Build warnings about "use client"?
- This is expected for client components
- Won't affect functionality

## License

MIT © [Robert Alvarez](https://github.com/robertalv)

## Links

- [Homepage](https://convexpanel.dev)
- [GitHub Repository](https://github.com/robertalv/convex-panel)
- [Issue Tracker](https://github.com/robertalv/convex-panel/issues)
- [NPM Package](https://www.npmjs.com/package/convex-panel)