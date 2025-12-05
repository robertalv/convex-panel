import { CodeBlock } from "./code-block";

export function ConfigurationContent() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-content-primary mb-4">Configuration</h3>
        <p className="text-content-secondary text-lg leading-relaxed mb-8">
          ConvexPanel can be configured through props, environment variables, or a combination of both.
          Environment variables are automatically detected and used as fallbacks when props are not provided.
        </p>

        <div className="space-y-8">
          {/* Environment Variables */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Environment Variables</h4>
            <p className="text-content-secondary mb-4">
              ConvexPanel automatically reads the following environment variables:
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-background-secondary/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-background-secondary/50 border-b border-border">
                      <th className="py-3 px-4 font-semibold text-content-primary">Variable</th>
                      <th className="py-3 px-4 font-semibold text-content-primary">Framework Prefix</th>
                      <th className="py-3 px-4 font-semibold text-content-primary">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">CONVEX_URL</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">VITE_ / NEXT_PUBLIC_</td>
                      <td className="py-3 px-4 text-content-secondary">Your Convex deployment URL (required)</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">OAUTH_CLIENT_ID</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">VITE_ / NEXT_PUBLIC_</td>
                      <td className="py-3 px-4 text-content-secondary">OAuth client ID from Convex dashboard</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">CONVEX_TOKEN_EXCHANGE_URL</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">VITE_ / NEXT_PUBLIC_</td>
                      <td className="py-3 px-4 text-content-secondary">Token exchange endpoint URL (auto-detected if not provided)</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">CONVEX_CLIENT_SECRET</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">VITE_ / NEXT_PUBLIC_</td>
                      <td className="py-3 px-4 text-content-secondary">OAuth client secret from Convex dashboard</td>
                    </tr>
                    <tr className="hover:bg-background-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-content-accent font-medium">CONVEX_ACCESS_TOKEN</td>
                      <td className="py-3 px-4 font-mono text-xs text-content-secondary">(server-side only)</td>
                      <td className="py-3 px-4 text-content-secondary">Team-level access token (never expose to frontend)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Development Mode */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Development Mode</h4>
            <p className="text-content-secondary mb-4">
              By default, ConvexPanel only renders in development mode. It automatically detects development mode by checking:
            </p>
            <ul className="list-disc list-inside space-y-2 text-content-secondary mb-4 ml-4">
              <li><code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">NODE_ENV !== 'production'</code></li>
              <li>Localhost origins (<code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">localhost</code>, <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">127.0.0.1</code>)</li>
              <li>Development deployment URLs (containing <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">dev</code> or <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">localhost</code>)</li>
            </ul>
            <p className="text-content-secondary mb-4">
              To force display in production, use the <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">forceDisplay</code> prop:
            </p>
            <CodeBlock
              code={`<ConvexPanel forceDisplay={true} />`}
              title="Force Display"
              language="typescript"
            />
          </section>

          {/* Auto-detection */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Auto-detection</h4>
            <p className="text-content-secondary mb-4">
              ConvexPanel automatically detects configuration in the following order of precedence:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-content-secondary mb-4 ml-4">
              <li><strong className="text-content-primary">Props</strong> - Explicitly provided props take highest priority</li>
              <li><strong className="text-content-primary">ConvexProvider Context</strong> - Automatically extracts client and URL from React context</li>
              <li><strong className="text-content-primary">Environment Variables</strong> - Falls back to env vars if not provided via props</li>
            </ol>
            <CodeBlock
              code={`// Example: Panel automatically detects from ConvexProvider
<ConvexProvider client={convex}>
  <App />
  <ConvexPanel /> {/* No props needed! */}
</ConvexProvider>`}
              title="Auto-detection Example"
              language="typescript"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
