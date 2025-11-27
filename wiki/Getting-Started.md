# Getting Started

This guide will help you install and configure Convex Panel in your project.

---

## Installation

Install via your preferred package manager:

```bash
# Bun (recommended)
bun add convex-panel --dev

# npm
npm install convex-panel --save-dev

# Yarn
yarn add convex-panel --dev

# pnpm
pnpm add convex-panel --save-dev
```

### Automatic Setup

During installation, the package will automatically:
1. Check if you're logged in to Convex
2. Prompt you to run `npx convex login` if not logged in
3. Detect your Convex access token from `~/.convex/config.json`
4. Add it to your project's `.env` file as `CONVEX_ACCESS_TOKEN`

---

## Environment Setup

Create a `.env.local` file in your project root:

### Next.js
```bash
NEXT_PUBLIC_CONVEX_URL="your_convex_url"
NEXT_PUBLIC_ACCESS_TOKEN="your_access_token"
NEXT_PUBLIC_DEPLOY_KEY="your_deploy_key"
```

### React (Vite/CRA)
```bash
REACT_APP_CONVEX_URL="your_convex_url"
REACT_APP_ACCESS_TOKEN="your_access_token"
REACT_APP_DEPLOY_KEY="your_deploy_key"
```

### Getting Your Access Token

```bash
# Unix/macOS
cat ~/.convex/config.json

# Windows
more %USERPROFILE%\.convex\config.json
```

---

## Authentication

Convex Panel supports two authentication methods:

### Option A: OAuth (Recommended)

OAuth provides a secure, user-friendly authentication flow. Requires a server endpoint for token exchange.

**1. Create token exchange endpoint** (`app/api/convex/exchange/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { code, codeVerifier, redirectUri } = await request.json();
  
  const body = new URLSearchParams({
    client_id: process.env.CONVEX_CLIENT_ID!,
    client_secret: process.env.CONVEX_CLIENT_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
    ...(codeVerifier && { code_verifier: codeVerifier }),
  });

  const tokenResponse = await fetch('https://api.convex.dev/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const token = await tokenResponse.json();
  return NextResponse.json(token);
}
```

**2. Use the component with OAuth**:

```tsx
<ConvexPanel
  oauthConfig={{
    clientId: process.env.NEXT_PUBLIC_CONVEX_CLIENT_ID!,
    redirectUri: window.location.origin,
    scope: 'project',
    tokenExchangeUrl: '/api/convex/exchange',
  }}
  convex={convex}
/>
```

### Option B: Manual Tokens

For simpler setups without OAuth:

```tsx
<ConvexPanel
  accessToken={process.env.NEXT_PUBLIC_ACCESS_TOKEN!}
  deployKey={process.env.NEXT_PUBLIC_DEPLOY_KEY!}
  convex={convex}
/>
```

---

## Basic Usage

### Next.js (App Router)

```tsx
"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import dynamic from 'next/dynamic';

const ConvexPanel = dynamic(() => import("convex-panel"), { ssr: false });

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel
        accessToken={process.env.NEXT_PUBLIC_ACCESS_TOKEN!}
        convex={convex}
      />
    </ConvexProvider>
  );
}
```

### React (Vite)

```tsx
import { ConvexPanel } from 'convex-panel';
import { ConvexReactClient, ConvexProvider } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function App() {
  return (
    <ConvexProvider client={convex}>
      <YourApp />
      <ConvexPanel
        accessToken={import.meta.env.VITE_ACCESS_TOKEN}
        convex={convex}
      />
    </ConvexProvider>
  );
}
```

---

## Next Steps

- [Configuration Options](./Configuration)
- [Theme Customization](./Configuration#theme-customization)
- [Troubleshooting](./Troubleshooting)

