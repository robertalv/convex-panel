# Convex Panel

Convex Panel is a powerful debugging and monitoring suite for Convex applications. It provides a desktop app, mobile app, Raycast extension, and embeddable React components to inspect data, view logs, run functions, and monitor performance in real-time.

![Convex Panel Screenshot](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex-panel%2Fcleansnap-16x9.png?alt=media&token=600d9bf6-18bc-46b2-9635-20290ec8afd4)

## Installation

### Desktop App

**macOS (Homebrew)**

```bash
brew install robertalv/tap/convex-panel
```

**macOS (curl)**

```bash
curl -fsSL https://raw.githubusercontent.com/robertalv/convex-panel/main/install.sh | bash
```

**Windows (PowerShell)**

```powershell
irm https://raw.githubusercontent.com/robertalv/convex-panel/main/install.ps1 | iex
```

**Manual Download**

Download the latest release from [GitHub Releases](https://github.com/robertalv/convex-panel/releases):

- macOS: `.dmg` (Apple Silicon & Intel)
- Windows: `.msi` or `.exe` installer
- Linux: `.AppImage` or `.deb`

### NPM Package

```bash
npm install convex-panel
npx convex-panel setup
```

### Mobile App

- iOS: Coming soon to the App Store
- Android: Coming soon to the Play Store

### Raycast Extension

Install from the [Raycast Store](https://raycast.com/convexpanel/convex-panel)

---

## Features

### Desktop App

![Desktop App](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex-panel%2FScreenshot%202026-01-20%20at%2011.23.22%E2%80%AFPM.png?alt=media&token=b34df713-4c3f-45a2-87ff-3f826aa44d3d)

#### Data Browser

Browse and manage your Convex database with a powerful data explorer.

- Multiple view modes: table, list, JSON, and raw views
- In-place document editing with full CRUD operations
- Advanced filtering, sorting, and search capabilities
- Bulk operations and document export

#### Functions & Logs

Debug and monitor your Convex functions in real-time.

- Function browser with execution statistics and performance charts
- Source code viewer powered by Monaco Editor
- Live log streaming with automatic updates
- Historical log search with SQLite storage
- Function call trees for tracing execution flow

#### Schema Visualizer

Visualize your database schema with an interactive diagram.

- Interactive ReactFlow-based schema diagram
- Git and GitHub integration with visual diff mode
- Multiple layout algorithms: force-directed, hierarchical, radial
- Export diagrams to PNG or SVG
- Zoom, pan, and filter by table relationships

#### Performance Advisor

Get actionable insights to optimize your Convex application.

- Schema health scoring (0-100) with detailed breakdowns
- Actionable recommendations with one-click auto-fix
- Index optimization suggestions
- Query performance analysis

#### Health Metrics

Monitor your application's health at a glance.

- Real-time failure rate and success metrics
- Cache hit rate monitoring
- Latency tracking with percentile breakdowns
- Database usage and storage monitoring
- Team billing overview and rate limits

#### File Storage

Manage your Convex file storage with ease.

- Browse, upload, preview, and delete files
- Drag-and-drop upload support
- Image and document previews
- Bulk delete operations

---

### Mobile App (iOS & Android)

![Mobile App](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex-panel%2Fleft.png?alt=media&token=e797aa3d-b1b4-42c5-a80a-79a99e680b6c)

Take Convex monitoring on the go with our mobile app.

- **OAuth Device Flow**: Secure authentication without typing passwords
- **Deployment Switching**: Quickly switch between dev, staging, and production
- **Data Browser**: Browse tables and documents on mobile
- **Log Viewer**: Monitor logs and errors in real-time
- **Push Notifications**: Get alerted when errors occur

---

### Raycast Extension
![Raycast Extension](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex-panel%2Fconvex%202026-01-15%20at%2009.06.58.png?alt=media&token=074c65f1-812b-4d54-b0b9-b918b3b78f42)

Quick access to Convex from your launcher with 10 powerful commands:

| Command              | Description                       |
| -------------------- | --------------------------------- |
| Manage Projects      | Switch between Convex projects    |
| Switch Deployment    | Toggle between dev/staging/prod   |
| Run Function         | Execute Convex functions directly |
| Data Browser         | Quick access to table data        |
| View Logs            | Stream logs in Raycast            |
| Search Docs          | Search Convex documentation       |
| Browse Components    | Explore the component registry    |
| Open Dashboard       | Jump to Convex dashboard          |
| Copy Deployment URL  | Copy your deployment URL          |
| Configure Deploy Key | Set up deploy key authentication  |

---

### NPM Package (`convex-panel`)

Embed Convex debugging tools directly in your application.

```bash
npm install convex-panel
```

**Features:**

- Embeddable React components for all major views
- Works with Next.js, Vite, Create React App, and more
- OAuth and deploy key authentication
- Interactive setup wizard with `npx convex-panel setup`
- Dark mode support

**Quick Setup:**

1. Install the package:

```bash
npm install convex-panel
```

2. Run the setup wizard:

```bash
npx convex-panel setup
```

3. Configure OAuth in your [Convex dashboard](https://dashboard.convex.dev):
   - Create an OAuth application
   - Add redirect URIs for your dev and production environments
   - Copy the Client ID to your environment variables

4. Import and use the panel:

```tsx
import { ConvexPanel } from "convex-panel";

function App() {
  return (
    <div>
      <YourApp />
      <ConvexPanel />
    </div>
  );
}
```

---

## Requirements

| Platform    | Requirements                                        |
| ----------- | --------------------------------------------------- |
| Desktop     | macOS 10.15+, Windows 10+, or Linux (Ubuntu 20.04+) |
| NPM Package | Node.js 18+, React 18+                              |
| Mobile      | iOS 15+ or Android 10+                              |
| Convex      | Active Convex project with API access               |

---

## Development

### Prerequisites

- Node.js 22+
- pnpm 9+ (`npm install -g pnpm`)
- Rust toolchain (for desktop app development)

### Installation

```bash
git clone https://github.com/robertalv/convex-panel.git
cd convex-panel
pnpm install
```

### Development Commands

```bash
# Start all apps in development mode
pnpm dev

# Start only the web app
pnpm dev:vite-only

# Start only the Next.js example
pnpm dev:nextjs-only

# Start the desktop app
pnpm dev:desktop
```

### Build Commands

```bash
# Build all packages and apps
pnpm build

# Lint all packages
pnpm lint

# Run tests
pnpm test

# Clean build artifacts
pnpm clean

# Format code
pnpm format
```

### Desktop Release Build

```bash
cd apps/desktop
pnpm tauri build
```

Artifacts will be in `apps/desktop/src-tauri/target/release/bundle/`:

- macOS: `macos/*.app`, `dmg/*.dmg`
- Windows: `msi/*.msi`, `nsis/*.exe`
- Linux: `appimage/*.AppImage`, `deb/*.deb`

---

## Project Structure

```
convex-panel/
├── apps/
│   ├── desktop/          # Tauri desktop app (macOS/Windows/Linux)
│   ├── mobile/           # React Native + Expo app (iOS/Android)
│   ├── raycast/          # Raycast extension
│   ├── web/              # Marketing website (Vite + React)
│   ├── nextjs-web/       # Next.js example integration
│   └── api/              # API server
├── packages/
│   ├── panel/            # Core React components (npm: convex-panel)
│   ├── shared/           # Shared utilities and API clients
│   ├── backend/          # Convex backend functions
│   └── registry/         # Component registry
├── install.sh            # macOS/Linux install script
├── install.ps1           # Windows install script
└── README.md
```

---

## Configuration

### Environment Variables

For the NPM package, configure these in your `.env.local`:

```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_OAUTH_CLIENT_ID=your-oauth-client-id
VITE_CONVEX_TOKEN_EXCHANGE_URL=https://your-deployment.convex.site/oauth/exchange
```

### OAuth Setup

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to Settings → OAuth
3. Create a new OAuth application
4. Add redirect URIs:
   - Development: `http://localhost:5173`
   - Production: `https://your-app.com`
5. Copy the Client ID and Client Secret
6. Set `VITE_OAUTH_CLIENT_ID` in your environment
7. Set `CONVEX_CLIENT_SECRET` in your Convex deployment environment (never expose in frontend)

---

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit your changes: `git commit -m "Add my feature"`
7. Push to your fork: `git push origin feature/my-feature`
8. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style (Prettier + ESLint)
- Write tests for new features
- Update documentation as needed

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Links

- [GitHub Repository](https://github.com/robertalv/convex-panel)
- [Releases](https://github.com/robertalv/convex-panel/releases)
- [NPM Package](https://www.npmjs.com/package/convex-panel)
- [Convex Documentation](https://docs.convex.dev)

---

## Support

- [GitHub Issues](https://github.com/robertalv/convex-panel/issues) - Bug reports and feature requests
- [Discussions](https://github.com/robertalv/convex-panel/discussions) - Questions and community support
