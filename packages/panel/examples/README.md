# ConvexPanel Framework Examples

ConvexPanel auto-detects configuration from environment variables, so you can simply use `<ConvexPanel />` after setting up the ConvexProvider.

## ✅ React-Based Frameworks (Native Support)

### Vite + React
See `vite-react.tsx` - Just wrap with ConvexProvider and use `<ConvexPanel />`.

### Next.js
See `nextjs.tsx` - Use dynamic imports to avoid SSR issues, then `<ConvexPanel />`.

### Remix
See `remix.tsx` - Works out of the box, just wrap with ConvexProvider and use `<ConvexPanel />`.

## ⚠️ Non-React Frameworks (Requires Integration)

### Vue
See `vue.tsx` - Requires mounting React components using `react-dom/client`. You'll need to:
1. Install React and React DOM: `npm install react react-dom`
2. Use `createRoot` from `react-dom/client` to mount the component
3. Wrap in a Vue component that manages the React root lifecycle

### Svelte
See `svelte.svelte` - Similar to Vue, requires React integration:
1. Install React and React DOM: `npm install react react-dom`
2. Use `createRoot` from `react-dom/client` in `onMount`
3. Clean up the root in `onDestroy` if needed

## Environment Variables

ConvexPanel auto-detects these from your environment:

### Vite
```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_DEPLOY_KEY=your-deploy-key (optional)
VITE_ACCESS_TOKEN=your-access-token (optional)
```

### Next.js
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_DEPLOY_KEY=your-deploy-key (optional)
NEXT_PUBLIC_ACCESS_TOKEN=your-access-token (optional)
NEXT_PUBLIC_OAUTH_CLIENT_ID=your-oauth-client-id (optional)
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback (optional)
```

### Remix
```env
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key (optional)
CONVEX_ACCESS_TOKEN=your-access-token (optional)
```

## Usage

Simply use `<ConvexPanel />` - it will auto-detect:
- Convex client from ConvexProvider context
- Deployment URL from environment variables
- Deploy key and access tokens from environment variables
- OAuth configuration from environment variables

No props needed unless you want to override the defaults!

