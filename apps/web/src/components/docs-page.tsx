import { HeroHeader } from "./hero5-header";
import { CopyButton } from "./copy-button";
import { TextEffect } from "./motion-primitives/text-effect";
import { AnimatedGroup } from "./motion-primitives/animated-group";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "installation", label: "Installation" },
  { id: "connecting-to-convex", label: "Connecting to Convex" },
  { id: "using-the-panel", label: "Using the Panel" },
  { id: "data-view", label: "Data view" },
  { id: "logs-and-health", label: "Logs & health" },
  { id: "embedding", label: "Embedding the panel" },
];

export default function DocsPage() {
  return (
    <>
      <HeroHeader />
      <main className="min-h-screen bg-background/95 text-foreground">
        <div className="relative pt-24 md:pt-28 pb-24">
          {/* Soft gradient backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_60%)]" />
            <div className="absolute -right-40 top-40 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(243,176,28,0.16),_transparent_70%)] blur-3xl" />
          </div>

          <div className="mx-auto flex max-w-6xl gap-10 px-6 lg:px-8">
            {/* Sidebar */}
            <aside className="sticky top-28 hidden h-fit w-56 shrink-0 md:block">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs">
                <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Docs
                </p>
                <nav className="space-y-1.5">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-background/60 hover:text-[#34D399]"
                    >
                      {section.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-16">
              {/* Header */}
              <section id="overview" className="space-y-6">
                <TextEffect
                  as="p"
                  preset="fade-in-blur"
                  speedSegment={0.25}
                  className="inline-flex items-center rounded-full border border-[#34D399]/20 bg-[#34D399]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#D1FAE5]"
                >
                  Convex Panel · Documentation
                </TextEffect>

                <div className="space-y-4">
                  <TextEffect
                    as="h1"
                    preset="fade-in-blur"
                    speedSegment={0.3}
                    className="text-balance text-3xl font-semibold tracking-tight md:text-4xl"
                  >
                    Build, debug, and operate your Convex app in real time.
                  </TextEffect>
                  <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                    Convex Panel is a developer-focused control panel for your Convex
                    backend. Inspect data, stream logs, run functions, and keep your
                    deployment healthy – all in a single, beautiful interface that feels
                    like part of your app, not an afterthought.
                  </p>
                </div>

                <AnimatedGroup
                  className="mt-6 flex flex-wrap items-center gap-3"
                  variants={{
                    container: {
                      visible: {
                        transition: { staggerChildren: 0.05 },
                      },
                    },
                    item: {
                      hidden: { opacity: 0, y: 8 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { type: "spring", bounce: 0.25, duration: 0.9 },
                      },
                    },
                  }}
                >
                  <div className="rounded-xl border border-[#34D399]/30 bg-background/80 px-3 py-2 text-[11px] text-muted-foreground shadow-sm shadow-[#34D399]/10">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A7F3D0]">
                      Quick install
                    </span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[11px] text-[#A7F3D0]">
                        npm install convex-panel
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                    Works with any Convex app · Dev & prod safe · OAuth ready
                  </div>
                </AnimatedGroup>
              </section>

              {/* Installation */}
              <section id="installation" className="space-y-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  1. Installation
                </h2>
                <p className="text-sm text-muted-foreground">
                  Install the panel into your frontend codebase. You can use npm, pnpm,
                  or yarn – it&apos;s a regular React component with zero runtime
                  coupling to your app&apos;s routing.
                </p>

                <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-background/80 to-background/40">
                  <div className="flex items-center justify-between border-b border-border/70 bg-muted/50 px-4 py-2.5">
                    <p className="text-xs font-mono text-muted-foreground">
                      Install with your favorite package manager
                    </p>
                    <CopyButton />
                  </div>
                  <pre className="overflow-x-auto bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.16),_transparent_55%)] px-4 py-3 text-[12px] leading-relaxed text-[#E5E7EB]">
                    <code className="font-mono">
                      npm install convex-panel{"\n"}
                      {"# or"}{"\n"}
                      pnpm add convex-panel{"\n"}
                      yarn add convex-panel
                    </code>
                  </pre>
                </div>
              </section>

              {/* Connecting */}
              <section id="connecting-to-convex" className="space-y-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  2. Connect to your Convex deployment
                </h2>
                <p className="text-sm text-muted-foreground">
                  Convex Panel needs a Convex URL and an access token with admin
                  privileges. In this marketing site we pass them through{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                    import.meta.env
                  </code>{" "}
                  and the panel picks them up automatically.
                </p>

                <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4 text-xs">
                  <ol className="space-y-2 text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">
                        1. Get your Convex deployment URL
                      </span>{" "}
                      from the Convex dashboard.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        2. Create an access token
                      </span>{" "}
                      with admin privileges.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        3. Expose them as environment variables
                      </span>{" "}
                      (see this repo&apos;s{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        VITE_CONVEX_URL
                      </code>{" "}
                      and{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        VITE_CONVEX_ACCESS_TOKEN
                      </code>{" "}
                      usage).
                    </li>
                  </ol>
                </div>
              </section>

              {/* Using the panel */}
              <section id="using-the-panel" className="space-y-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  3. Drop the panel into your app
                </h2>
                <p className="text-sm text-muted-foreground">
                  Convex Panel renders as a floating debugger that you can summon on
                  top of your app. In this site we mount it once at the root of the
                  React tree:
                </p>

                <div className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-background/90 to-background/40">
                  <div className="flex items-center justify-between border-b border-border/70 bg-muted/50 px-4 py-2.5">
                    <p className="text-xs font-mono text-muted-foreground">
                      Minimal usage
                    </p>
                  </div>
                  <pre className="overflow-x-auto px-4 py-3 text-[12px] leading-relaxed text-[#E5E7EB]">
                    <code className="font-mono">
                      {`import ConvexPanel from "convex-panel";\n\nfunction App() {\n  return (\n    <ConvexProvider client={convex}>\n      {/* your app */}\n      <ConvexPanel />\n    </ConvexProvider>\n  );\n}`}
                    </code>
                  </pre>
                </div>
              </section>

              {/* Data view */}
              <section id="data-view" className="space-y-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  Data view: real-time tables
                </h2>
                <p className="text-sm text-muted-foreground">
                  The{" "}
                  <span className="font-medium text-foreground">
                    Data view
                  </span>{" "}
                  lets you browse any table in your Convex deployment with instant
                  updates, powerful filtering, and inline editing. The screenshot on
                  the homepage is driven by the same components you&apos;ll see in your
                  own app.
                </p>
                <ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  <li className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      Live updates
                    </p>
                    <p className="mt-1 text-xs">
                      New documents created by your app appear in the table in real
                      time, with a soft highlight for new rows and updated cells.
                    </p>
                  </li>
                  <li className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold text-foreground">
                      Powerful filters
                    </p>
                    <p className="mt-1 text-xs">
                      Build complex filter expressions, save them per-table, and jump
                      directly to a single document by ID.
                    </p>
                  </li>
                </ul>
              </section>

              {/* Logs & health */}
              <section id="logs-and-health" className="space-y-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  Logs & health
                </h2>
                <p className="text-sm text-muted-foreground">
                  Convex Panel surfaces function logs, errors, and deployment health
                  signals alongside your data so you can debug without jumping
                  between tabs.
                </p>
              </section>

              {/* Embedding */}
              <section id="embedding" className="space-y-5">
                <h2 className="text-lg font-semibold tracking-tight">
                  Embedding in other apps
                </h2>
                <p className="text-sm text-muted-foreground">
                  You can embed Convex Panel in any React app (Next.js, Vite, SPA
                  dashboards, internal tools) or ship it as a standalone desktop app
                  using the provided example in this repo.
                </p>
                <p className="text-xs text-muted-foreground">
                  See the examples in{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    packages/panel/examples
                  </code>{" "}
                  for Next.js and Svelte integrations.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}


