# Convex Panel Monorepo

This repository contains the `convex-panel` project and its related packages and applications, managed as a monorepo using [Turborepo](https://turbo.build/repo) and [pnpm](https://pnpm.io/).

## Structure

- **apps/**
  - `chrome-extension`: Chrome browser extension
  - `edge-extension`: Edge browser extension
  - `firefox-extension`: Firefox browser extension
- **packages/**
  - `panel`: Core Convex Panel React component (`convex-panel`)
  - `shared`: Shared utilities and types (`convex-panel/shared`)
  - `convex-component`: Server-side Convex component (`convex-panel/convex-component`)

## Getting Started

### Prerequisites

- Node.js
- pnpm (`npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Building

Build all packages and apps:

```bash
pnpm build
```

### Development

Start development mode for all packages:

```bash
pnpm dev
```

## Commands

- `pnpm build`: Build all packages
- `pnpm dev`: Start development server
- `pnpm lint`: Lint all packages
- `pnpm test`: Run tests
- `pnpm clean`: Clean build artifacts

## Using Convex Panel in Your Own App

The `convex-panel` package is designed to be installed into your own Convex project. After installing it as a dependency, you can run a guided setup that:

- Injects an OAuth HTTP action into your `convex/http.ts` (for secure code → token exchange).
- Helps you configure the required environment variables in your app.

### 1. Install `convex-panel`

From your app (not this monorepo), install:

```bash
pnpm add -D convex-panel
# or
npm install --save-dev convex-panel
```

### 2. Run the setup script in your app

From the root of your Convex project (where `convex/` lives), run:

```bash
npx convex-panel setup
```

This will:

- Create or update `convex/http.ts` to add:
  - `POST /oauth/exchange`
  - `OPTIONS /oauth/exchange` (CORS preflight)
- Prompt you for (and append to your `.env.local` / `.env`):
  - `VITE_CONVEX_URL` – your Convex deployment URL (e.g. `https://your-deployment.convex.cloud`)
  - `VITE_OAUTH_CLIENT_ID` – your Convex OAuth client ID from the dashboard
  - `VITE_CONVEX_TOKEN_EXCHANGE_URL` – typically `https://your-deployment.convex.site/oauth/exchange`

Existing values are never overwritten; only missing keys are added.

### 3. Configure Convex OAuth

In the Convex dashboard, create an OAuth application and set:

- **Redirect URIs** including:
  - Local dev: `http://localhost:5173` (or your dev origin)
  - Production: your frontend origin(s), e.g. `https://your-site.com`
- **Client ID / Client Secret** – copy the client ID into `VITE_OAUTH_CLIENT_ID` and the secret into your Convex deployment env as `CONVEX_CLIENT_SECRET` (never into frontend env).

Once this is done, `ConvexPanel` can use OAuth to obtain a short‑lived admin token via your own Convex HTTP action, without ever sharing secrets with `api.convexpanel.dev`.

## Contributing

This project uses Turborepo for build orchestration. Changes in shared packages will automatically trigger rebuilds in dependent packages.
