# Convex Panel Desktop

A desktop application for monitoring and managing your Convex deployments, built with Tauri and React.

## Features

- 🔐 **OAuth Authentication** - Secure authentication with your Convex account
- 📊 **Database Management** - View and manage your Convex database tables
- ⚡ **Function Monitoring** - Monitor and execute Convex functions
- 📝 **Logs Viewer** - Real-time logs from your Convex deployment
- 🎨 **Dark Theme** - Beautiful dark mode interface
- ⚙️ **Settings Management** - Configure OAuth settings via UI

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) - `npm install -g pnpm`
- [Rust](https://rustup.rs/) - Required for Tauri

## Getting Started

### 1. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Configure OAuth

You'll need to set up OAuth with your Convex deployment:

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to your project settings
3. Create an OAuth application
4. Note your **Client ID**
5. Add `http://localhost:14200` as a redirect URI

### 3. Run in Development Mode

```bash
cd apps/desktop
pnpm tauri dev
```

On first launch, you'll be prompted to enter your OAuth Client ID. You can also access settings anytime with `Cmd/Ctrl + ,` or by clicking the settings button.

### 4. Build for Production

```bash
cd apps/desktop
pnpm tauri build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`.

## Usage

### First Time Setup

1. Launch the application
2. Enter your OAuth Client ID in the settings dialog
3. Click "Connect" to authenticate with Convex
4. Your browser will open for OAuth authorization
5. After authorizing, return to the app - you're ready to go!

### Settings

Access settings via:
- Keyboard shortcut: `Cmd/Ctrl + ,`
- Settings button (⚙️) in the bottom right corner

Configure:
- **Client ID**: Your Convex OAuth client ID
- **Redirect URI**: OAuth callback URL (default: `http://localhost:14200`)
- **Scope**: `project` or `team` level access

### Features

- **Database Tab**: Browse tables, view documents, perform CRUD operations
- **Functions Tab**: View and execute Convex functions
- **Logs Tab**: Real-time logs from your deployment
- **Settings Tab**: Manage deployment settings

## Architecture

### Frontend (`src/`)

- **React 19** with TypeScript
- **Convex Panel** package for UI components
- **Tauri APIs** for native functionality

### Backend (`src-tauri/`)

- **Rust** with Tauri framework
- **OAuth Server** for handling authentication callbacks
- **Native Window Management**

### Key Components

- `App.tsx` - Main application component with settings management
- `useTauriAuth.ts` - Custom hook for Tauri-specific OAuth flow
- `SettingsDialog.tsx` - UI for OAuth configuration
- `ErrorBoundary.tsx` - Error handling and recovery
- `main.rs` - Rust backend with OAuth server

## Development

### Project Structure

```
apps/desktop/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── src-tauri/             # Tauri backend
│   ├── src/
│   │   └── main.rs        # Rust backend
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── index.html             # HTML template
├── package.json           # Node dependencies
└── vite.config.ts         # Vite configuration
```

### Available Scripts

- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build frontend for production
- `pnpm tauri dev` - Run app in development mode
- `pnpm tauri build` - Build app for production

## Troubleshooting

### OAuth Server Fails to Start

If port 14200 is already in use, the OAuth server will fail to start. Close any applications using that port or modify the redirect URI in settings.

### Authentication Timeout

The OAuth flow has a 5-minute timeout. If you don't complete authentication within this time, you'll need to try again.

### Panel Not Loading

Ensure you have:
1. Valid OAuth Client ID configured
2. Completed authentication successfully
3. Network connection to Convex servers

### Build Errors

If you encounter build errors:
1. Ensure all dependencies are installed: `pnpm install`
2. Clear build cache: `rm -rf dist src-tauri/target`
3. Rebuild: `pnpm tauri build`

## Contributing

This is part of the [Convex Panel monorepo](../../README.md). See the main README for contribution guidelines.

## License

MIT - See LICENSE file in the repository root.

## Support

For issues and questions:
- [GitHub Issues](https://github.com/robertalv/convex-panel/issues)
- [Convex Discord](https://convex.dev/community)
