/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['convex-panel'],
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_OAUTH_CLIENT_ID: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID,
    NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL: process.env.NEXT_PUBLIC_CONVEX_TOKEN_EXCHANGE_URL,
    CONVEX_ACCESS_TOKEN: process.env.CONVEX_ACCESS_TOKEN,
  },
  webpack: (config, { isServer }) => {
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
    }
    return config;
  },
};

module.exports = nextConfig;

