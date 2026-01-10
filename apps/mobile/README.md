# Convex Panel Mobile

React Native mobile application for monitoring and managing Convex deployments.

## Features

- 🔐 OAuth device authorization flow
- 📊 Real-time deployment monitoring
- 🔔 Push notifications for critical alerts
- ⚡ Quick actions (rollback, disable functions)
- 📱 Native iOS and Android support

## Tech Stack

- **React** 19.0
- **React Native** 0.73
- **Expo** ~50.0
- **TypeScript** 5.3
- **React Query** (TanStack Query) 5.x

## Prerequisites

- Node.js >= 18
- pnpm >= 9
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Start Development Server

```bash
# Start Expo dev server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

### Building for Production

```bash
# iOS
pnpm run build:ios

# Android
pnpm run build:android
```

## Project Structure

```
src/
├── api/              # API clients (BigBrain)
├── components/       # Shared UI components
├── contexts/         # React Context providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── DeploymentContext.tsx
├── features/         # Feature modules
│   ├── dashboard/
│   ├── alerts/
│   └── settings/
├── hooks/            # Custom React hooks
├── navigation/       # Navigation configuration
├── screens/          # Screen components
│   └── auth/
├── services/         # Core services
│   ├── auth.ts
│   ├── storage.ts
│   └── notifications.ts
├── types/            # TypeScript type definitions
└── App.tsx           # App entry point
```

## Architecture

### Authentication

Uses OAuth 2.0 Device Authorization Flow:

1. User starts sign-in
2. App displays device code
3. User authorizes in browser
4. App polls for token
5. Token stored securely in Keychain/Keystore

### State Management

- **React Query**: Server state and data fetching
- **React Context**: Auth, theme, and deployment selection
- **Secure Storage**: Tokens stored in platform-specific secure storage

### API Integration

Integrates with Convex's BigBrain API for:

- Team/project/deployment management
- Health metrics and monitoring
- Deployment insights
- Quick actions (rollback, disable functions)

## Environment Variables

No environment variables needed - uses production Convex API endpoints.

## Security

- Tokens stored in secure storage (iOS Keychain / Android Keystore)
- HTTPS only
- Certificate pinning (production)
- No sensitive data logging

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT
