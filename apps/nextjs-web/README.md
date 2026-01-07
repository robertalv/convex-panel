# Next.js Web App - Convex Panel Demo

This is a Next.js application demonstrating the `convex-panel/nextjs` wrapper.

## Features

- ✅ Next.js App Router with proper SSR handling
- ✅ Uses `convex-panel/nextjs` for optimized Next.js integration
- ✅ Automatic client-side rendering to prevent hydration issues
- ✅ Framework-specific optimizations

## Setup

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Convex deployment URL:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

The app uses the Next.js-specific wrapper:

```tsx
import ConvexPanel from "convex-panel/nextjs";
```

This wrapper handles:
- Client-side only rendering (no SSR)
- Automatic mounted state check
- Next.js environment variable detection
- No hydration issues

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint












