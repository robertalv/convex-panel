# Troubleshooting

Common issues and solutions when using Convex Panel.

---

## Authentication Errors

### "Convex authentication required"

**Causes:**
- Invalid or missing `accessToken`
- Improperly configured OAuth settings

**Solutions:**
1. Verify `accessToken` is correctly set in your environment variables
2. Check `.env.local` file configuration
3. Run `npx convex login` to refresh your authentication
4. If using OAuth, ensure `tokenExchangeUrl` is accessible

### "CORS error" or "Token exchange failed"

**Causes:**
- Server endpoint not running
- Incorrect `tokenExchangeUrl`
- Missing server-side credentials

**Solutions:**
1. Ensure your server endpoint is running and accessible
2. Verify `tokenExchangeUrl` points to the correct endpoint
3. Check that `CONVEX_CLIENT_SECRET` is set in your server environment
4. Add appropriate CORS headers to your server endpoint

---

## Display Issues

### Panel not appearing

**Causes:**
- Component not mounted inside `ConvexProvider`
- CSS z-index conflicts
- Styles not properly loaded

**Solutions:**
1. Ensure `ConvexPanel` is a child of `ConvexProvider`
2. Check for z-index conflicts with other UI elements
3. Verify the component is rendered (check React DevTools)
4. Try setting a custom `buttonPosition` prop

### Logs not appearing

**Causes:**
- Invalid `deployKey` or deployment settings
- Convex client not initialized properly
- Network connectivity issues

**Solutions:**
1. Verify `deployKey` and `CONVEX_DEPLOYMENT` settings
2. Confirm `convex` prop is properly initialized
3. Check access token validity
4. Test network connectivity to Convex servers

---

## Build Issues

### "use client" directive warnings

**Status:** Expected behavior for client components

**Details:**
This warning appears because Convex Panel uses React client features. It won't affect functionality.

**Solution:**
Use dynamic import as shown in the setup examples:

```tsx
const ConvexPanel = dynamic(() => import("convex-panel"), { ssr: false });
```

### Monaco Editor issues in Vite

**Causes:**
- Missing Vite plugin configuration

**Solutions:**
1. Install the Monaco Editor plugin:
   ```bash
   npm install vite-plugin-monaco-editor --save-dev
   ```

2. Configure Vite:
   ```javascript
   import convexPanelViteConfig from 'convex-panel/vite';
   
   export default defineConfig({
     ...convexPanelViteConfig,
   });
   ```

---

## Performance Issues

### High memory usage

**Causes:**
- Too many logs stored in memory
- Large data sets being loaded

**Solutions:**
1. Reduce `maxStoredLogs` value (default: 500)
2. Lower `initialLimit` for log fetching
3. Use pagination for large data tables

### Slow initial load

**Causes:**
- Large initial data fetch
- Bundle size

**Solutions:**
1. Reduce `initialLimit` value
2. Use dynamic import with `ssr: false`
3. Consider lazy loading the panel

---

## Data Issues

### Data not updating in real-time

**Causes:**
- Subscription issues
- Stale Convex client

**Solutions:**
1. Refresh the panel
2. Check Convex client connection status
3. Verify real-time subscription is active

### Edit changes not saving

**Causes:**
- Insufficient permissions
- Validation errors
- Network issues

**Solutions:**
1. Check your access token permissions
2. Verify the data format matches expected types
3. Check browser console for errors

---

## Getting Help

If you continue to experience issues:

1. Check the [GitHub Issues](https://github.com/robertalv/convex-panel/issues) for similar problems
2. Open a new issue with:
   - Convex Panel version
   - Framework and version (Next.js, Vite, etc.)
   - Error messages from browser console
   - Steps to reproduce
3. Join the [Convex Discord](https://discord.gg/convex) for community support

