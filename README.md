# Convex Panel Monorepo

This repository contains the `convex-panel` project and its related packages and applications, managed as a monorepo using [Turborepo](https://turbo.build/repo) and [pnpm](https://pnpm.io/).

## Structure

- **apps/**
  - `chrome-extension`: Chrome browser extension
  - `edge-extension`: Edge browser extension
  - `firefox-extension`: Firefox browser extension
- **packages/**
  - `panel`: Core Convex Panel React component (`@convex-panel/panel`)
  - `shared`: Shared utilities and types (`@convex-panel/shared`)
  - `convex-component`: Server-side Convex component (`@convex-panel/convex-component`)

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

## Contributing

This project uses Turborepo for build orchestration. Changes in shared packages will automatically trigger rebuilds in dependent packages.
