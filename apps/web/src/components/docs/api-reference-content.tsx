import { CodeBlock } from "./code-block";
import { Zap, Database, Activity, Settings } from "lucide-react";

export function ApiReferenceContent() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-content-primary mb-4">API Reference</h3>
        <p className="text-content-secondary text-lg leading-relaxed mb-8">
          ConvexPanel accepts a variety of props to customize its behavior, authentication, and appearance.
        </p>

        <div className="space-y-8">
          {/* Props Table */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Component Props</h4>
            <div className="overflow-hidden rounded-xl border border-border bg-background-secondary/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-background-secondary/50 border-b border-border">
                      <th className="py-3 px-4 font-semibold text-content-primary">Prop</th>
                      <th className="py-3 px-4 font-semibold text-content-primary">Type</th>
                      <th className="py-3 px-4 font-semibold text-content-primary">Default</th>
                      <th className="py-3 px-4 font-semibold text-content-primary">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">convex</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">ConvexReactClient</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">Auto</td>
                      <td className="py-3 px-4 text-content-secondary">Convex client instance. Auto-detected from ConvexProvider context.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">accessToken</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">string</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">undefined</td>
                      <td className="py-3 px-4 text-content-secondary">Manual access token for authentication. Overrides OAuth if provided.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">teamAccessToken</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">string</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">Auto</td>
                      <td className="py-3 px-4 text-content-secondary">Team-level access token. Auto-detected from CONVEX_ACCESS_TOKEN env var.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">deployUrl</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">string</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">Auto</td>
                      <td className="py-3 px-4 text-content-secondary">Convex deployment URL. Auto-detected from client or environment variables.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">deployKey</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">string</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">undefined</td>
                      <td className="py-3 px-4 text-content-secondary">Deploy key for authentication. Takes precedence over OAuth tokens.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">oauthConfig</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">OAuthConfig</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">Auto</td>
                      <td className="py-3 px-4 text-content-secondary">OAuth configuration object. Auto-detected from environment variables.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">auth</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">UseOAuthReturn</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">undefined</td>
                      <td className="py-3 px-4 text-content-secondary">Custom authentication implementation. If provided, internal OAuth logic is skipped.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">defaultTheme</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">'dark' | 'light'</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">'dark'</td>
                      <td className="py-3 px-4 text-content-secondary">Initial theme preference. User's preference is persisted in localStorage.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">forceDisplay</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">boolean</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">false</td>
                      <td className="py-3 px-4 text-content-secondary">Force display the panel even if not in development mode (useful for testing).</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">useMockData</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">boolean</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">false</td>
                      <td className="py-3 px-4 text-content-secondary">Use mock data for testing without a real Convex deployment.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">teamSlug</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">string</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">undefined</td>
                      <td className="py-3 px-4 text-content-secondary">Team slug for multi-team deployments.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">projectSlug</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">string</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">undefined</td>
                      <td className="py-3 px-4 text-content-secondary">Project slug for multi-project deployments.</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">portalContainer</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">Element | DocumentFragment</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-tertiary">null</td>
                      <td className="py-3 px-4 text-content-secondary">Optional portal container for overlays rendered from within the panel.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* OAuth Config */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">OAuth Configuration</h4>
            <p className="text-content-secondary mb-4">
              The <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">oauthConfig</code> prop accepts the following structure:
            </p>
            <CodeBlock
              code={`interface OAuthConfig {
  clientId: string;           // OAuth client ID from Convex dashboard
  redirectUri: string;         // Redirect URI registered in OAuth app
  scope?: 'team' | 'project';  // OAuth scope (optional)
  tokenExchangeUrl?: string;   // Custom token exchange endpoint (optional)
}`}
              title="OAuthConfig"
              language="typescript"
            />
          </section>

          {/* Available Tabs */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Available Tabs</h4>
            <p className="text-content-secondary mb-4">
              ConvexPanel provides the following tabs for monitoring and debugging:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                <Zap className="w-5 h-5 text-yellow-500 mb-2" />
                <h5 className="font-medium text-content-primary mb-1">Functions</h5>
                <p className="text-sm text-content-tertiary">Execute and test queries, mutations, and actions with custom inputs.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                <Database className="w-5 h-5 text-blue-500 mb-2" />
                <h5 className="font-medium text-content-primary mb-1">Data</h5>
                <p className="text-sm text-content-tertiary">Browse, filter, sort, and edit database tables with an intuitive interface.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                <Activity className="w-5 h-5 text-green-500 mb-2" />
                <h5 className="font-medium text-content-primary mb-1">Logs</h5>
                <p className="text-sm text-content-tertiary">Stream console.log output from backend functions in real-time.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                <Activity className="w-5 h-5 text-purple-500 mb-2" />
                <h5 className="font-medium text-content-primary mb-1">Health</h5>
                <p className="text-sm text-content-tertiary">Monitor system health, cache hit rates, and performance metrics.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                <Activity className="w-5 h-5 text-orange-500 mb-2" />
                <h5 className="font-medium text-content-primary mb-1">Schedules</h5>
                <p className="text-sm text-content-tertiary">View and manage cron jobs and scheduled functions.</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-background-secondary/30">
                <Settings className="w-5 h-5 text-gray-500 mb-2" />
                <h5 className="font-medium text-content-primary mb-1">Settings</h5>
                <p className="text-sm text-content-tertiary">Configure panel preferences, backup/restore, and more.</p>
              </div>
            </div>
          </section>

          {/* Basic Usage */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Basic Usage</h4>
            <CodeBlock
              code={`import ConvexPanel from 'convex-panel/react'

// Minimal setup - auto-detects everything
<ConvexPanel />

// With explicit configuration
<ConvexPanel
  deployUrl="https://your-deployment.convex.cloud"
  accessToken="your-access-token"
  defaultTheme="light"
/>`}
              title="Basic Usage"
              language="typescript"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
