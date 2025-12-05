import { CodeBlock } from "./code-block";

export function AuthenticationContent() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-content-primary mb-4">Authentication</h3>
        <p className="text-content-secondary text-lg leading-relaxed mb-8">
          ConvexPanel supports multiple authentication methods. Choose the one that best fits your security requirements.
        </p>

        <div className="space-y-8">
          {/* OAuth Authentication */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">OAuth Authentication (Recommended)</h4>
            <p className="text-content-secondary mb-4">
              OAuth is the recommended authentication method. It provides a secure flow without exposing tokens in your frontend code.
            </p>
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold text-content-primary mb-2">1. Set up OAuth in Convex Dashboard</h5>
                <p className="text-sm text-content-secondary mb-3">
                  Create an OAuth application in your Convex dashboard and configure redirect URIs.
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-content-primary mb-2">2. Configure Environment Variables</h5>
                <CodeBlock
                  code={`# .env.local
VITE_CONVEX_URL="https://your-deployment.convex.cloud"
VITE_OAUTH_CLIENT_ID="your-client-id"
VITE_CONVEX_TOKEN_EXCHANGE_URL="https://your-deployment.convex.site/oauth/exchange"
CONVEX_CLIENT_SECRET="your-client-secret"`}
                  title="Environment Variables"
                  language="bash"
                />
              </div>
              <div>
                <h5 className="font-semibold text-content-primary mb-2">3. Set up Token Exchange Endpoint</h5>
                <p className="text-sm text-content-secondary mb-3">
                  Run the setup script to automatically configure the token exchange endpoint:
                </p>
                <CodeBlock
                  code={`npx convex-panel setup`}
                  title="Setup Command"
                  language="bash"
                />
              </div>
            </div>
          </section>

          {/* Manual Token */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Manual Access Token</h4>
            <p className="text-content-secondary mb-4">
              For testing or when OAuth is not available, you can provide an access token directly:
            </p>
            <CodeBlock
              code={`<ConvexPanel
  deployUrl="https://your-deployment.convex.cloud"
  accessToken="your-access-token-here"
/>`}
              title="Manual Token"
              language="typescript"
            />
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-content-secondary">
                <strong className="text-content-primary">Warning:</strong> Never commit access tokens to your repository. 
                Use environment variables or secure token management.
              </p>
            </div>
          </section>

          {/* Deploy Key */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Deploy Key</h4>
            <p className="text-content-secondary mb-4">
              Deploy keys provide the highest level of access and take precedence over OAuth tokens:
            </p>
            <CodeBlock
              code={`<ConvexPanel
  deployUrl="https://your-deployment.convex.cloud"
  deployKey="your-deploy-key-here"
/>`}
              title="Deploy Key"
              language="typescript"
            />
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-content-secondary">
                <strong className="text-content-primary">Security Note:</strong> Deploy keys should only be used in secure, 
                server-side environments. Never expose deploy keys in client-side code.
              </p>
            </div>
          </section>

          {/* Custom Auth */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Custom Authentication</h4>
            <p className="text-content-secondary mb-4">
              You can provide a custom authentication implementation using the <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">auth</code> prop:
            </p>
            <CodeBlock
              code={`import { useOAuth } from 'convex-panel'

const customAuth = useOAuth({
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:5173',
  tokenExchangeUrl: 'https://your-deployment.convex.site/oauth/exchange',
  scope: 'project'
})

<ConvexPanel auth={customAuth} />`}
              title="Custom Auth"
              language="typescript"
            />
          </section>

          {/* Authentication Priority */}
          <section>
            <h4 className="text-xl font-bold text-content-primary mb-4">Authentication Priority</h4>
            <p className="text-content-secondary mb-4">
              ConvexPanel uses authentication in the following order of precedence:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-content-secondary mb-4 ml-4">
              <li><strong className="text-content-primary">deployKey</strong> - Highest priority, if provided</li>
              <li><strong className="text-content-primary">OAuth Token</strong> - From OAuth flow or custom auth</li>
              <li><strong className="text-content-primary">accessToken</strong> - Manual token provided via prop</li>
              <li><strong className="text-content-primary">teamAccessToken</strong> - From CONVEX_ACCESS_TOKEN env var</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
