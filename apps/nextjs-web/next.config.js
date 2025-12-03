/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['convex-panel'],
  // Explicitly expose ALL environment variables to the client
  // Next.js automatically exposes NEXT_PUBLIC_* variables, but we need to ensure
  // they're available in the transpiled package code via webpack DefinePlugin
  env: {
    // Expose all NEXT_PUBLIC_ variables (Next.js does this automatically, but being explicit)
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_OAUTH_CLIENT_ID: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
    NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL: process.env.NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL,
    // Expose CONVEX_ACCESS_TOKEN (server-side only, but we inject it for client-side use)
    CONVEX_ACCESS_TOKEN: process.env.CONVEX_ACCESS_TOKEN,
  },
  webpack: (config, { isServer, webpack }) => {
    // Suppress warnings about import.meta in client-side code
    // These are false positives when transpiling packages that use Vite-specific features
    if (!isServer) {
      config.module = config.module || {};
      config.module.exprContextCritical = false;
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /packages\/panel/,
          message: /Critical dependency.*import\.meta/,
        },
      ];
      
      // Inject environment variables at build time via webpack DefinePlugin
      // This ensures they're available in the bundled package code
      const existingDefinePlugin = config.plugins.find(
        (plugin) => plugin.constructor.name === 'DefinePlugin'
      );
      
      // Get all environment variables - pass everything from .env files
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';
      const oauthClientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || '';
      const tokenExchangeUrl = process.env.NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL || '';
      const accessToken = process.env.CONVEX_ACCESS_TOKEN || '';
      
      const defineVars = {
        // Build-time injected variables (for the panel package)
        __CONVEX_ACCESS_TOKEN__: JSON.stringify(accessToken),
        __NEXT_PUBLIC_CONVEX_URL__: JSON.stringify(convexUrl),
        __NEXT_PUBLIC_OAUTH_CLIENT_ID__: JSON.stringify(oauthClientId),
        __NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL__: JSON.stringify(tokenExchangeUrl),
        // Also inject as process.env for runtime access
        'process.env.NEXT_PUBLIC_CONVEX_URL': JSON.stringify(convexUrl),
        'process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID': JSON.stringify(oauthClientId),
        'process.env.NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL': JSON.stringify(tokenExchangeUrl),
        'process.env.CONVEX_ACCESS_TOKEN': JSON.stringify(accessToken),
      };
      
      if (existingDefinePlugin) {
        // Merge with existing DefinePlugin
        Object.assign(existingDefinePlugin.definitions || {}, defineVars);
      } else {
        config.plugins.push(new webpack.DefinePlugin(defineVars));
      }
    }
    return config;
  },
};

module.exports = nextConfig;

