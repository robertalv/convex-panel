export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">
          Convex Panel - Next.js Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          This is a Next.js app demonstrating the convex-panel/nextjs wrapper.
        </p>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Features:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>✅ Next.js App Router with SSR handling</li>
            <li>✅ Automatic client-side rendering for panel</li>
            <li>✅ No hydration issues</li>
            <li>✅ Framework-specific optimizations</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            The Convex Panel should appear at the bottom of the screen in development mode.
          </p>
        </div>
      </div>
    </main>
  );
}

