# Production Build Guide

This guide explains how to build and test the production version of Convex Panel desktop app.

## Quick Start

### Build for Production Testing

```bash
# Build the frontend for production
npm run build:prod

# Build the full Tauri app for production
npm run tauri:build:prod
```

### Preview Production Build

```bash
# Preview the production build locally
npm run preview:prod
```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run tauri:dev` - Start Tauri development mode

### Production Builds
- `npm run build:prod` - Build frontend with production optimizations
- `npm run build:test` - Same as build:prod (alias for production testing)
- `npm run tauri:build:prod` - Build full Tauri application for production
- `npm run tauri:build:test` - Same as tauri:build:prod (alias for production testing)

### Preview
- `npm run preview` - Preview development build
- `npm run preview:prod` - Preview production build

## Production Optimizations

The production build includes:
- ✅ Code minification (esbuild)
- ✅ No sourcemaps (reduces bundle size)
- ✅ Code splitting with manual chunks:
  - `react-vendor` - React, React DOM, React Router
  - `convex-vendor` - Convex SDK
  - `ui-vendor` - Radix UI components
- ✅ Optimized chunk sizes
- ✅ Git commit hash and repository URL injected at build time

## Environment Variables

Create a `.env.production` file (or `.env.production.local`) in the `apps/desktop` directory with:

```env
# Required
VITE_CONVEX_URL=your-production-convex-url

# Optional
VITE_API_URL=https://api.convexpanel.com
VITE_OAUTH_CLIENT_ID=your-oauth-client-id
VITE_CONVEX_TOKEN_EXCHANGE_URL=your-token-exchange-url
```

Note: Vite will automatically load `.env.production` when using `--mode production`.

## Build Output

### Frontend Build
The frontend build output is in `apps/desktop/dist/`

### Tauri Build
The Tauri build output depends on your platform:
- **macOS**: `apps/desktop/src-tauri/target/release/bundle/dmg/` or `apps/desktop/src-tauri/target/release/bundle/macos/`
- **Windows**: `apps/desktop/src-tauri/target/release/bundle/msi/`
- **Linux**: `apps/desktop/src-tauri/target/release/bundle/appimage/`

## Testing Production Build

1. Build the production version:
   ```bash
   npm run tauri:build:prod
   ```

2. Install and run the built application from the output directory

3. Verify:
   - All features work as expected
   - Performance is optimal
   - No console errors
   - Proper environment variable loading

## Troubleshooting

### Build fails with TypeScript errors
- Run `npm run build` first to see TypeScript errors
- Fix all TypeScript errors before building for production

### Environment variables not loading
- Ensure `.env.production` exists in `apps/desktop/`
- Check that variables are prefixed with `VITE_`
- Restart the build process after changing environment variables

### Large bundle size
- Check the build output for warnings
- Review the manual chunks configuration in `vite.config.ts`
- Consider lazy loading additional components if needed
