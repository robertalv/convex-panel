import { Activity, Database, Play, Settings, Terminal } from "lucide-react";
import type { Framework } from "./constants";
import { CodeBlock } from "./code-block";
import { OnThisPage, PageHeader } from "./layout";

export function IntroContent() {
  return (
    <div className="flex gap-10 animate-fade-in">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Introduction"
          description="Convex Panel is a powerful development tool tailored for Convex applications. It provides real-time observability, data manipulation, and function testing capabilities directly in your browser."
        />

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {[
            {
              title: "Data View",
              desc: "Browse, filter, sort, and edit your Convex tables.",
              icon: Database,
            },
            {
              title: "Live Logs",
              desc: "Monitor function calls, HTTP actions, and system events.",
              icon: Activity,
            },
            {
              title: "Health",
              desc: "Track cache hit rates, scheduler health, and latency.",
              icon: Settings,
            },
            {
              title: "Runner",
              desc: "Execute queries, mutations, and actions directly.",
              icon: Play,
            },
          ].map((feature, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className="p-4 rounded-xl bg-background-secondary/30 border border-border/50 hover:border-border hover:bg-background-secondary/50 transition-all group"
            >
              <feature.icon className="w-6 h-6 text-primary mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              <h3 className="font-bold text-content-primary mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-content-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <OnThisPage
        links={[
          { id: "features", label: "Key Features" },
        ]}
      />
    </div>
  );
}

export function InstallationContent() {
  return (
    <div className="flex gap-10 animate-fade-in">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Installation"
          description="Get started by installing the package using your preferred package manager."
        />

        <div className="space-y-8">
          <section id="add-package">
            <h3 className="text-xl font-bold text-content-primary font-display mb-4">
              Add the package
            </h3>
            <CodeBlock
              title="Terminal"
              code={`npm install convex-panel --save-dev

# or

yarn add convex-panel --dev

# or

pnpm add convex-panel --save-dev`}
            />

            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
              <div className="mt-0.5 text-primary">
                <Terminal className="w-4 h-4" />
              </div>
              <div className="text-sm text-content-secondary">
                <strong className="text-content-primary block mb-0.5">
                  Dev Dependency
                </strong>
                We recommend installing it as a dev dependency so it doesn&apos;t
                increase your production bundle size.
              </div>
            </div>
          </section>
        </div>
      </div>

      <OnThisPage
        links={[
          { id: "add-package", label: "Add Package" },
        ]}
      />
    </div>
  );
}

export function EnvironmentContent({ framework }: { framework: Framework }) {
  const envPrefix =
    framework === "nextjs"
      ? "NEXT_PUBLIC_"
      : framework === "vite" || framework === "react"
        ? "VITE_"
        : "REACT_APP_";

  return (
    <div className="flex gap-10 animate-fade-in">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Environment Setup"
          description="Configure your environment variables to connect the panel to your deployment."
        />

        <div className="space-y-12">
          <section id="manual-setup">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center text-sm font-bold text-content-primary shadow-sm">
                1
              </div>
              <h3 className="text-xl font-bold text-content-primary font-display">
                Minimum Configuration
              </h3>
            </div>
            <p className="text-content-secondary mb-4">
              Create a{" "}
              <code className="bg-background-secondary px-1.5 py-0.5 rounded text-sm border border-border text-content-primary font-mono">
                .env.local
              </code>{" "}
              file and add your Convex Deployment URL.
            </p>
            <CodeBlock
              title=".env.local"
              code={`${envPrefix}CONVEX_URL="https://your-deployment.convex.cloud"`}
            />
          </section>

          <section id="auto-setup" className="pt-8 border-t border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-background-secondary border border-border flex items-center justify-center text-sm font-bold text-content-primary shadow-sm">
                2
              </div>
              <h3 className="text-xl font-bold text-content-primary font-display">
                Automatic Setup (Optional)
              </h3>
            </div>
            <p className="text-content-secondary mb-4">
              Convex Panel can automatically configure OAuth for you using the
              included setup scripts.
            </p>
            <CodeBlock
              title="package.json"
              code={`"scripts": {
  "convex-panel:setup:oauth": "node ./node_modules/convex-panel/scripts/setup-oauth.js",
  "convex-panel:setup:env": "node ./node_modules/convex-panel/scripts/setup-env.js"
}`}
            />
          </section>
        </div>
      </div>

      <OnThisPage
        links={[
          { id: "manual-setup", label: "Minimum Config" },
          { id: "auto-setup", label: "Automatic Setup" },
        ]}
      />
    </div>
  );
}

export function QuickStartContent({ framework }: { framework: Framework }) {

  return (
    <div className="flex gap-10 animate-fade-in">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Quick Start"
          description="Integrate the panel into your application wrapper."
        />

        {framework === "nextjs" && (
          <section id="nextjs-setup">
            <CodeBlock
              title="app/providers.tsx"
              code={`"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
      <ConvexPanel />
    </ConvexProvider>
  );
}`}
            />
          </section>
        )}

        {(framework === "vite" || framework === "react") && (
          <section id="vite-setup">
            <CodeBlock
              title="src/App.tsx"
              code={`import { ConvexReactClient, ConvexProvider } from "convex/react";
import ConvexPanel from "convex-panel/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function App() {
  return (
    <ConvexProvider client={convex}>
      {/* Your app components */}
      <ConvexPanel />
    </ConvexProvider>
  );
}`}
            />
          </section>
        )}
      </div>

      <OnThisPage
        links={[
          { id: "setup", label: "Provider Setup" },
        ]}
      />
    </div>
  );
}

export function ConfigurationContent() {
  return (
    <div className="flex gap-10 animate-fade-in">
      <div className="flex-1 min-w-0">
        <PageHeader
          title="Configuration"
          description="Customize the panel behavior and appearance."
        />

        <section id="props">
          <h3 className="text-xl font-bold mb-6 text-content-primary font-display">
            Component Props
          </h3>
          <div className="overflow-hidden rounded-xl border border-border shadow-sm bg-background-secondary/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-content-secondary">
                <thead>
                  <tr className="bg-background-secondary/50 border-b border-border">
                    <th className="py-3 px-4 font-semibold text-content-primary">
                      Prop
                    </th>
                    <th className="py-3 px-4 font-semibold text-content-primary">
                      Type
                    </th>
                    <th className="py-3 px-4 font-semibold text-content-primary">
                      Default
                    </th>
                    <th className="py-3 px-4 font-semibold text-content-primary">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    {
                      name: "convex",
                      type: "ConvexReactClient",
                      default: "Auto",
                      desc: "Convex client instance",
                    },
                    {
                      name: "deployUrl",
                      type: "string",
                      default: "Auto",
                      desc: "Deployment URL",
                    },
                    {
                      name: "defaultTheme",
                      type: "'dark' | 'light'",
                      default: "'dark'",
                      desc: "Initial theme preference",
                    },
                    {
                      name: "useMockData",
                      type: "boolean",
                      default: "false",
                      desc: "Use mock data for testing",
                    },
                  ].map((row) => (
                    <tr
                      key={row.name}
                      className="hover:bg-background-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-primary font-medium">
                        {row.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-brand-purple">
                        {row.type}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs opacity-70">
                        {row.default}
                      </td>
                      <td className="py-3 px-4 text-content-secondary">
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="auth" className="mt-12">
          <h3 className="text-xl font-bold mb-4 text-content-primary font-display">
            Custom Authentication
          </h3>
          <CodeBlock
            title="Custom Auth Example"
            code={`import { useOAuth } from "convex-panel";

const customAuth = useOAuth(oauthConfig);

<ConvexPanel auth={customAuth} />`}
          />
        </section>
      </div>

      <OnThisPage
        links={[
          { id: "props", label: "Component Props" },
          { id: "auth", label: "Authentication" },
        ]}
      />
    </div>
  );
}

export { GenericViewContent } from "./layout";


