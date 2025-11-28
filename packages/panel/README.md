# Convex Panel

![NPM Version](https://img.shields.io/npm/v/convex-panel)

A development panel for Convex applications that provides real-time logs, data inspection, and more.

![Convex Panel Data View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Flogs.png?alt=media&token=dd4bdff9-1e9a-41cc-a1da-aaae0f148517)

## Features

- 📊 **Real-time Data View**: Browse and filter your Convex tables with ease
- 📝 **Live Logs**: Monitor function calls, HTTP actions, and system events in real-time
- 🔍 **Advanced Filtering**: Filter logs and data with query capabilities
- 🔄 **Health Monitoring**: Track the health of your application with metrics for cache rates, scheduler health, database performance, and system latency
- 📊 **Function Performance Monitoring**: Track invocation rates, error rates, execution times, and cache hit rates for your functions
- 🔍 **Function Code Inspection**: View and analyze your function source code with syntax highlighting
- 📈 **Performance Metrics Visualization**: See your function performance data with interactive charts and graphs
- 🧪 **Function Testing**: Execute functions directly from the panel with custom inputs and view results
- ✏️ **In-place Data Editing**: Directly edit your data values with double-click editing capability
- 🎨 **Beautiful UI**: Sleek, developer-friendly interface that integrates with your app
- 🔐 **Automatic Token Setup**: Automatically configures your Convex access token during installation
- 💾 **State Persistence**: Automatically saves panel position, size, and preferences

![Convex Panel Logs View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2F683_1x_shots_so.png?alt=media&token=55f531d4-4fc9-4bc3-af9f-b1d4e01487dd)

## Installation

```bash
bun add convex-panel --dev
# or
npm install convex-panel --save-dev
# or
yarn add convex-panel --dev
# or
pnpm add convex-panel --save-dev
```

During installation, the package will automatically:
1. Check if you're logged in to Convex
2. If not logged in, prompt you to run `npx convex login`
3. Once logged in, detect your Convex access token from `~/.convex/config.json` (or `%USERPROFILE%\.convex\config.json` on Windows)
4. Add it to your project's `.env` file as `CONVEX_ACCESS_TOKEN`

The package will guide you through the login process if needed. You can also manually log in at any time by running:
```bash
npx convex login
```

## Environment Setup

Create a `.env.local` file in your project root with the following variables:

```bash
# Nextjs
NEXT_PUBLIC_CONVEX_URL="your_convex_url"
NEXT_PUBLIC_ACCESS_TOKEN="your_access_token"
NEXT_PUBLIC_DEPLOY_KEY="your_deploy_key"

# React
REACT_APP_CONVEX_URL="your_convex_url"
REACT_APP_ACCESS_TOKEN="your_access_token"
REACT_APP_DEPLOY_KEY="your_deploy_key"
```

To get your access token, run:
```bash
cat ~/.convex/config.json  # On Unix-based systems
# or
more %USERPROFILE%\.convex\config.json  # On Windows
```

## Usage

### Next.js Setup (Recommended)

#### Option A: OAuth Authentication (Recommended)

For OAuth authentication, you'll need to create a server-side endpoint to handle token exchange. See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed instructions.

1. **Create the OAuth callback endpoint** (`app/api/convex/callback/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  // Exchange code for token
  const tokenResponse = await fetch('https://api.convex.dev/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.CONVEX_CLIENT_ID!,
      client_secret: process.env.CONVEX_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/convex/callback`,
      code,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
  }

  const token = await tokenResponse.json();
  
  // Store token in cookie or session
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('convex_oauth_token', token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  
  return response;
}
```

2. **Create the token exchange endpoint** (`app/api/convex/exchange/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { code, codeVerifier, redirectUri } = await request.json();
  
  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const body = new URLSearchParams({
    client_id: process.env.CONVEX_CLIENT_ID!,
    client_secret: process.env.CONVEX_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri || process.env.NEXT_PUBLIC_APP_URL!,
    code,
    ...(codeVerifier && { code_verifier: codeVerifier }),
  });

  const tokenResponse = await fetch('https://api.convex.dev/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    return NextResponse.json({ error }, { status: tokenResponse.status });
  }

  const token = await tokenResponse.json();
  return NextResponse.json(token);
}
```

3. **Use the component with OAuth**:

```tsx
"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

import type ConvexPanelType from "convex-panel";

// Use dynamic import to avoid SSR issues
const ConvexPanel = dynamic<ComponentProps<typeof ConvexPanelType>>(() => import("convex-panel"), {
  ssr: false
});

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL! as string);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel
        oauthConfig={{
          clientId: process.env.NEXT_PUBLIC_CONVEX_CLIENT_ID!,
          redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
          scope: 'project',
          tokenExchangeUrl: '/api/convex/exchange', // Your server endpoint
        }}
        convex={convex}
      />
    </ConvexProvider>
  )
}
```

#### Option B: Manual Tokens (Fallback)

If you prefer not to use OAuth, you can use manual tokens:

```tsx
"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

import type ConvexPanelType from "convex-panel";

const ConvexPanel = dynamic<ComponentProps<typeof ConvexPanelType>>(() => import("convex-panel"), {
  ssr: false
});

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL! as string);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel
        accessToken={process.env.NEXT_PUBLIC_ACCESS_TOKEN!}
        deployKey={process.env.NEXT_PUBLIC_DEPLOY_KEY!}
        convex={convex}
      />
    </ConvexProvider>
  )
}
```

### React Setup (Alternative)

For non-Next.js React applications, you'll need to set up a server endpoint for OAuth token exchange. Here are options:

#### Option A: OAuth with Express/Node.js Server

1. **Create a server endpoint** (e.g., using Express):

```javascript
// server.js or your API server
app.post('/api/convex/exchange', async (req, res) => {
  const { code, codeVerifier, redirectUri } = req.body;
  
  const tokenResponse = await fetch('https://api.convex.dev/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.CONVEX_CLIENT_ID,
      client_secret: process.env.CONVEX_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    }),
  });

  const token = await tokenResponse.json();
  res.json(token);
});
```

2. **Use the component**:

```tsx
import { ConvexPanel } from 'convex-panel';
import { ConvexReactClient, ConvexProvider } from "convex/react";

export default function YourComponent() {
  const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL);

  return (
    <ConvexProvider client={convex}>
      {/* Your app content */}
      <ConvexPanel
        oauthConfig={{
          clientId: process.env.REACT_APP_CONVEX_CLIENT_ID!,
          redirectUri: window.location.origin,
          scope: 'project',
          tokenExchangeUrl: 'http://localhost:3001/api/convex/exchange', // Your server
        }}
        convex={convex}
      />
    </ConvexProvider>
  );
}
```

#### Option B: Manual Tokens (No OAuth)

```tsx
import { ConvexPanel } from 'convex-panel';
import { ConvexReactClient, ConvexProvider } from "convex/react";

export default function YourComponent() {
  const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL);

  return (
    <ConvexProvider client={convex}>
      {/* Your app content */}
      <ConvexPanel
        accessToken={process.env.REACT_APP_ACCESS_TOKEN}
        deployUrl={process.env.REACT_APP_CONVEX_DEPLOYMENT}
        convex={convex}
      />
    </ConvexProvider>
  );
}
```

## Configuration

### Authentication

The component supports two authentication methods:

1. **OAuth (Recommended)**: Provide `oauthConfig` with `tokenExchangeUrl` pointing to your server endpoint
2. **Manual Tokens**: Provide `accessToken` (and optionally `deployKey`)

See [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed setup instructions.

### Required Props

**Either:**
- `oauthConfig` + `tokenExchangeUrl` (OAuth authentication)
- `accessToken` (Manual token authentication)

| Prop | Type | Description |
|------|------|-------------|
| `oauthConfig` | OAuthConfig | OAuth configuration object (see below) |
| `tokenExchangeUrl` | string | Server endpoint URL for OAuth token exchange (required if using OAuth) |
| `accessToken` | string | Your Convex access token (from `~/.convex/config.json`). Required if not using OAuth. |
| `deployKey` | string | Optional. Convex deployment key for admin-level access. Enables additional admin capabilities. |

### OAuth Configuration

```typescript
interface OAuthConfig {
  clientId: string;              // Your OAuth application's client ID
  redirectUri: string;            // Must match OAuth app settings
  scope?: 'project' | 'team';     // OAuth scope
  tokenExchangeUrl?: string;      // Your server endpoint for token exchange
}
```

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `convex` | ConvexReactClient | Required | Initialized Convex client instance for API communication. |
| `deployUrl` | string | process.env.NEXT_PUBLIC_CONVEX_URL | Your Convex deployment URL. |
| `theme` | ThemeClasses | {} | Custom theme options (see Theme Customization below). |
| `initialLimit` | number | 100 | Initial number of logs to fetch and display. |
| `initialShowSuccess` | boolean | true | Whether to show success logs in the initial view. |
| `initialLogType` | LogType | 'ALL' | Initial log type filter. Options: 'ALL', 'SUCCESS', 'FAILURE', 'DEBUG', 'LOGINFO', 'WARNING', 'ERROR', 'HTTP' |
| `maxStoredLogs` | number | 500 | Maximum number of logs to store in memory. |
| `onLogFetch` | (logs: LogEntry[]) => void | undefined | Callback when logs are fetched. |
| `onError` | (error: string) => void | undefined | Callback when an error occurs. |
| `buttonPosition` | ButtonPosition | 'bottom-right' | Position of the panel button. Options: 'bottom-left', 'bottom-center', 'bottom-right', 'right-center', 'top-right' |
| `useMockData` | boolean | false | Use mock data instead of real API data. |

### Theme Customization

The `theme` prop accepts a `ThemeClasses` object with the following structure:

```typescript
interface ThemeClasses {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    // ... other color options
  };
  spacing?: {
    padding?: string;
    margin?: string;
    // ... other spacing options
  };
  components?: {
    button?: {
      backgroundColor?: string;
      color?: string;
      // ... other button styles
    };
    // ... other component styles
  };
}
```

Example theme usage:

```tsx
<ConvexPanel
  theme={{
    colors: {
      primary: '#6366f1',
      background: '#1f2937'
    },
    components: {
      button: {
        backgroundColor: '#4f46e5'
      }
    }
  }}
  // ... other props
/>
```

### State Persistence

The panel automatically persists several settings in localStorage:
- Panel position on screen
- Panel size (width/height)
- Active tab selection
- Log filter preferences
- Table view configurations

These settings are restored when the panel is reopened.

## Features Documentation

### Health Monitoring

The health dashboard provides real-time insights into your Convex application's performance metrics:

- **Cache Rates**: Monitor your application's cache hit rates and efficiency
- **Scheduler Health**: Track the health and performance of your scheduled functions
- **Database Metrics**: View database throughput, operation counts, and response times
- **System Latency**: Visualize overall system response times and identify bottlenecks

### Data Editing

The panel supports in-place editing of table data:

- **Double-click Editing**: Simply double-click on any editable cell to modify its value
- **Smart Value Parsing**: Automatically converts edited values to the appropriate type (number, boolean, array, object)
- **Real-time Updates**: Changes are immediately reflected in your Convex database
- **Validation**: Basic type checking and format validation for edited values

### Log Management

Advanced log filtering and management capabilities:

- **Type Filtering**: Filter by log types (SUCCESS, FAILURE, DEBUG, etc.)
- **Search**: Full-text search across log messages
- **Time Range**: Filter logs by time period
- **Export**: Download logs in JSON format
- **Auto-refresh**: Real-time log updates
- **Memory Management**: Automatic cleanup of old logs based on `maxStoredLogs`

## Troubleshooting

For detailed troubleshooting and setup instructions, see [USAGE_GUIDE.md](./USAGE_GUIDE.md).

### Common Errors

1. **"Convex authentication required"**:
   - Ensure valid `accessToken` is provided (manual auth), or
   - Ensure `oauthConfig` and `tokenExchangeUrl` are properly configured (OAuth)
   - Check `.env.local` file configuration
   - Verify Convex login status

2. **"CORS error" or "Token exchange failed"**:
   - Make sure your server endpoint is running and accessible
   - Verify that `tokenExchangeUrl` points to the correct endpoint
   - Check that `CONVEX_CLIENT_SECRET` is set in your server environment
   - See [USAGE_GUIDE.md](./USAGE_GUIDE.md) for server endpoint examples

2. **No logs appearing**:
   - Verify `deployKey` and `CONVEX_DEPLOYMENT` settings
   - Check `convex` prop initialization
   - Confirm access token validity
   - Check network connectivity

3. **Build warnings about "use client" directive**:
   - Expected behavior for client components
   - Won't affect functionality
   - Use dynamic import as shown in setup examples

4. **Panel not appearing**:
   - Ensure component is mounted inside ConvexProvider
   - Check z-index conflicts
   - Verify styles are properly injected

### Performance Optimization

- Adjust `initialLimit` based on your needs
- Set appropriate `maxStoredLogs` to prevent memory issues
- Use `useMockData` for development/testing
- Consider lazy loading for large datasets

## Development

To contribute to this package:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Run tests: `npm test`

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "feature-name"

# Run tests in watch mode
npm test -- --watch
```

## Publishing Updates

To publish a new version:

1. Update version in `package.json`
2. Run tests: `npm test`
3. Build the package: `npm run build`
4. Commit changes
5. Create a git tag: `git tag v1.x.x`
6. Push changes and tags: `git push && git push --tags`
7. Publish: `npm publish`

## License

MIT

## Using with Vite

If you're using Vite, you'll need to configure it to properly handle Monaco Editor. The package provides a pre-configured Vite configuration that you can extend:

1. First, install the required Vite plugin:
```bash
npm install vite-plugin-monaco-editor --save-dev
```

2. In your `vite.config.js`, import and use the provided configuration:
```javascript
import { defineConfig } from 'vite';
import convexPanelViteConfig from 'convex-panel/vite';

export default defineConfig({
  ...convexPanelViteConfig,
  // Your other Vite configurations...
});
```

This will set up the necessary Monaco Editor configuration for Vite. 