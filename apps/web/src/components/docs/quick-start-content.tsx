import { CodeBlock } from "./code-block";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function QuickStartContent() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-content-primary mb-4">Quick Start</h3>
        <p className="text-content-secondary text-lg leading-relaxed mb-8">
          Get ConvexPanel up and running in your project in just a few minutes. Follow these simple steps to start debugging your Convex backend.
        </p>

        <div className="space-y-8">
          {/* Step 1: Install */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-content-accent/10 flex items-center justify-center">
                <span className="text-content-accent font-bold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-content-primary mb-2">Install the Package</h4>
                <p className="text-content-secondary mb-4">
                  Install ConvexPanel using your package manager:
                </p>
                <CodeBlock
                  code={`npm install convex-panel`}
                  // title="Install"
                  language="bash"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Environment Variables */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-content-accent/10 flex items-center justify-center">
                <span className="text-content-accent font-bold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-content-primary mb-2">Configure Environment Variables</h4>
                <p className="text-content-secondary mb-4">
                  You can configure environment variables manually or use the interactive setup command:
                </p>
                
                <div className="mb-4">
                  <h5 className="font-semibold text-content-primary mb-2">Option 1: Interactive Setup (Recommended)</h5>
                  <p className="text-sm text-content-secondary mb-3">
                    Run the setup command to interactively configure all required environment variables:
                  </p>
                  <CodeBlock
                    code={`npx convex-panel setup`}
                    // title="Interactive Setup"
                    language="bash"
                  />
                </div>

                <div className="mb-4">
                  <h5 className="font-semibold text-content-primary mb-2">Option 2: Manual Configuration</h5>
                  <p className="text-sm text-content-secondary mb-3">
                    Create a <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">.env.local</code> file in your project root with the following variables:
                  </p>
                  <CodeBlock
                    code={`# Required: Your Convex deployment URL
VITE_CONVEX_URL="https://your-deployment.convex.cloud"

VITE_OAUTH_CLIENT_ID="your-oauth-client-id"
CONVEX_CLIENT_SECRET="your-client-secret"
VITE_CONVEX_TOKEN_EXCHANGE_URL="https://your-deployment.convex.site/oauth/exchange"

# IMPORTANT: CONVEX_ACCESS_TOKEN must be obtained from the Convex dashboard
CONVEX_ACCESS_TOKEN="your-access-token"`}
                    title=".env.local"
                    language="bash"
                  />
                </div>

                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-content-secondary">
                    <strong className="text-content-primary">Important:</strong> <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">CONVEX_ACCESS_TOKEN</code> must be obtained from the <a href="https://dashboard.convex.dev" target="_blank" rel="noopener noreferrer" className="text-content-accent hover:underline">Convex dashboard</a>. Never generate tokens manually.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-content-secondary">
                    <strong className="text-content-primary">Note:</strong> For Next.js projects, use <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">NEXT_PUBLIC_</code> prefix instead of <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">VITE_</code>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Setup OAuth (Optional) */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-content-accent/10 flex items-center justify-center">
                <span className="text-content-accent font-bold">3</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-content-primary mb-2">Set Up OAuth (Recommended)</h4>
                <p className="text-content-secondary mb-4">
                  For the best security, set up OAuth authentication. Run the setup script to automatically configure the token exchange endpoint:
                </p>
                <CodeBlock
                  code={`npx convex-panel setup`}
                  // title="Setup OAuth"
                  language="bash"
                />
                <p className="text-sm text-content-tertiary mt-2">
                  This will guide you through creating an OAuth app in your Convex dashboard and configuring the token exchange endpoint.
                </p>
              </div>
            </div>
          </section>

          {/* Step 4: Add to Your App */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-content-accent/10 flex items-center justify-center">
                <span className="text-content-accent font-bold">4</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-content-primary mb-2">Add ConvexPanel to Your App</h4>
                <p className="text-content-secondary mb-4">
                  Import and add ConvexPanel to your app. It will automatically detect your Convex configuration:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-content-primary mb-2">React / Vite</h5>
                    <CodeBlock
                      code={`import ConvexPanel from 'convex-panel'

function App() {
  return (
    <>
      <YourApp />
      <ConvexPanel />
    </>
  )
}`}
                      title="React Setup"
                      language="typescript"
                    />
                  </div>

                  <div>
                    <h5 className="font-semibold text-content-primary mb-2">Next.js</h5>
                    <CodeBlock
                      code={`// app/providers.tsx
'use client'

import { ConvexClientProvider } from 'convex/react'
import ConvexPanel from 'convex-panel/nextjs'

export function Providers({ children }) {
  return (
    <ConvexClientProvider>
      {children}
      <ConvexPanel />
    </ConvexClientProvider>
  )
}`}
                      title="Next.js Setup"
                      language="typescript"
                    />
                  </div>

                  <div>
                    <h5 className="font-semibold text-content-primary mb-2">Vue</h5>
                    <CodeBlock
                      code={`<!-- App.vue -->
<script setup lang="ts">
import ConvexPanel from 'convex-panel/vue'

const convexUrl = import.meta.env.VITE_CONVEX_URL || ''
</script>

<template>
  <main>
    <!-- Your app content -->
  </main>
  <ConvexPanel
    v-if="convexUrl"
    :convex-url="convexUrl"
  />
</template>`}
                      title="Vue Setup"
                      language="vue"
                    />
                  </div>

                  <div>
                    <h5 className="font-semibold text-content-primary mb-2">Svelte</h5>
                    <CodeBlock
                      code={`<!-- App.svelte -->
<script lang="ts">
import ConvexPanel from 'convex-panel/svelte'

const convexUrl = import.meta.env.VITE_CONVEX_URL || ''
</script>

<main>
  <!-- Your app content -->
</main>

{#if convexUrl}
  <ConvexPanel {convexUrl} />
{/if}`}
                      title="Svelte Setup"
                      language="svelte"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 5: Start Using */}
          <section className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-content-accent/10 flex items-center justify-center">
                <span className="text-content-accent font-bold">5</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-content-primary mb-2">Start Using ConvexPanel</h4>
                <p className="text-content-secondary mb-4">
                  Once your app is running, ConvexPanel will appear as a bottom sheet. Click to expand and start debugging:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
                    <h5 className="font-medium text-content-primary mb-1">Functions Tab</h5>
                    <p className="text-sm text-content-tertiary">Execute queries, mutations, and actions with custom inputs</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mb-2" />
                    <h5 className="font-medium text-content-primary mb-1">Data Tab</h5>
                    <p className="text-sm text-content-tertiary">Browse and edit your database tables</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mb-2" />
                    <h5 className="font-medium text-content-primary mb-1">Logs Tab</h5>
                    <p className="text-sm text-content-tertiary">View real-time console logs from your backend</p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 mb-2" />
                    <h5 className="font-medium text-content-primary mb-1">Health Tab</h5>
                    <p className="text-sm text-content-tertiary">Monitor system health and performance metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="mt-8 p-6 rounded-xl border border-border bg-background-secondary/30">
            <h4 className="text-lg font-bold text-content-primary mb-3 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-content-accent" />
              Next Steps
            </h4>
            <ul className="space-y-2 text-content-secondary">
              <li className="flex items-start gap-2">
                <span className="text-content-accent mt-1">•</span>
                <span>Read the <strong className="text-content-primary">Installation</strong> guide for framework-specific setup details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-content-accent mt-1">•</span>
                <span>Check out the <strong className="text-content-primary">Authentication</strong> section to set up OAuth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-content-accent mt-1">•</span>
                <span>Explore the <strong className="text-content-primary">API Reference</strong> for advanced configuration options</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
