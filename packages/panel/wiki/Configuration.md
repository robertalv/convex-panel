# Configuration

Comprehensive guide to configuring Convex Panel for your needs.

---

## Required Props

| Prop | Type | Description |
|------|------|-------------|
| `convex` | `ConvexReactClient` | Initialized Convex client instance |
| `accessToken` | `string` | Your Convex access token (required if not using OAuth) |
| `oauthConfig` | `OAuthConfig` | OAuth configuration (required if not using accessToken) |

---

## Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deployUrl` | `string` | `process.env.NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL |
| `deployKey` | `string` | - | Convex deployment key for admin access |
| `theme` | `ThemeClasses` | `{}` | Custom theme configuration |
| `initialLimit` | `number` | `100` | Initial number of logs to fetch |
| `initialShowSuccess` | `boolean` | `true` | Show success logs initially |
| `initialLogType` | `LogType` | `'ALL'` | Initial log type filter |
| `maxStoredLogs` | `number` | `500` | Maximum logs stored in memory |
| `buttonPosition` | `ButtonPosition` | `'bottom-right'` | Panel button position |
| `useMockData` | `boolean` | `false` | Use mock data for development |
| `onLogFetch` | `function` | - | Callback when logs are fetched |
| `onError` | `function` | - | Callback when an error occurs |

---

## OAuth Configuration

```typescript
interface OAuthConfig {
  clientId: string;           // Your OAuth client ID
  redirectUri: string;        // Redirect URI (must match OAuth settings)
  scope?: 'project' | 'team'; // OAuth scope
  tokenExchangeUrl?: string;  // Server endpoint for token exchange
}
```

**Example:**

```tsx
<ConvexPanel
  oauthConfig={{
    clientId: 'your-client-id',
    redirectUri: 'https://yourapp.com',
    scope: 'project',
    tokenExchangeUrl: '/api/convex/exchange',
  }}
  convex={convex}
/>
```

---

## Button Positions

Available positions for the panel toggle button:

| Value | Description |
|-------|-------------|
| `'bottom-left'` | Bottom left corner |
| `'bottom-center'` | Bottom center |
| `'bottom-right'` | Bottom right corner (default) |
| `'right-center'` | Right side, vertically centered |
| `'top-right'` | Top right corner |

---

## Log Types

Available log type filters:

| Type | Description |
|------|-------------|
| `'ALL'` | Show all log types |
| `'SUCCESS'` | Successful operations |
| `'FAILURE'` | Failed operations |
| `'DEBUG'` | Debug messages |
| `'LOGINFO'` | Info messages |
| `'WARNING'` | Warning messages |
| `'ERROR'` | Error messages |
| `'HTTP'` | HTTP requests |

---

## Theme Customization

Customize the panel appearance with the `theme` prop:

```typescript
interface ThemeClasses {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    border?: string;
    success?: string;
    error?: string;
    warning?: string;
  };
  spacing?: {
    padding?: string;
    margin?: string;
    borderRadius?: string;
  };
  components?: {
    button?: {
      backgroundColor?: string;
      color?: string;
      hoverBackgroundColor?: string;
    };
    panel?: {
      backgroundColor?: string;
      boxShadow?: string;
    };
    table?: {
      headerBackground?: string;
      rowHoverBackground?: string;
    };
  };
}
```

**Example:**

```tsx
<ConvexPanel
  theme={{
    colors: {
      primary: '#6366f1',
      background: '#1f2937',
      text: '#f9fafb'
    },
    components: {
      button: {
        backgroundColor: '#4f46e5',
        hoverBackgroundColor: '#4338ca'
      },
      panel: {
        backgroundColor: '#111827',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }
    }
  }}
  convex={convex}
  accessToken={token}
/>
```

---

## State Persistence

The panel automatically persists these settings to `localStorage`:

- Panel position on screen
- Panel size (width/height)
- Active tab selection
- Log filter preferences
- Table view configurations

Settings are restored when the panel is reopened.

---

## Vite Configuration

For Vite projects, configure Monaco Editor:

```bash
npm install vite-plugin-monaco-editor --save-dev
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import convexPanelViteConfig from 'convex-panel/vite';

export default defineConfig({
  ...convexPanelViteConfig,
  // Your other configurations...
});
```

