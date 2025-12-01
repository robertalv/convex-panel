import { HeroHeader } from "./hero5-header";
import { AnimatedGroup } from "./motion-primitives/animated-group";
import { CopyLinkButton } from "./copy-link-button";

export default function ChangelogPage() {
  return (
    <>
      <HeroHeader />
      <main className="h-full">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
        >
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section className="min-h-screen">
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 0.5,
                    },
                  },
                },
              }}
              className="mx-auto max-w-7xl px-6 lg:px-8"
            >
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                  Changelog
                </h1>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  Stay up to date with the latest improvements and updates to Convex Panel.
                </p>
              </div>

              <div className="mt-16 space-y-20">
                {/* Version 0.2.18 */}
                <div id="version-0.2.18" className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-start group gap-2">
                    <span className="bg-background pr-3 text-sm font-semibold leading-6">
                      Version 0.2.18 - December 1, 2025
                    </span>
                    <CopyLinkButton version="version-0.2.18" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Website, Routing & OSS Stats
                    </h2>
                    <p className="mt-4 leading-7 text-muted-foreground">
                      A fresh marketing experience for Convex Panel with proper routing, docs,
                      changelog, and live open‑source stats powered by Convex components.
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-8">
                      <li>
                        <h3 className="font-semibold leading-6">New Docs & Changelog pages</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Added dedicated <code>/docs</code> and <code>/changelog</code> pages with
                          animated headers, deep links, and copy‑link buttons for each release.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">TanStack Router integration</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Replaced manual pathname checks with TanStack Router for smoother,
                          scalable client‑side routing across the marketing site.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">OSS Stats component</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Wired in <code>@erquhart/convex-oss-stats</code> to sync GitHub stars and
                          npm downloads for <code>convex-panel</code>, and surface them in the Stats
                          section via Convex queries.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Panel polish & quieter logs</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Refined the Convex Panel header actions, improved highlight animations in
                          the data view, and removed noisy console diagnostics from the embedded
                          panel components.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Version 0.1.47 */}
                <div id="version-0.1.47" className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-start group gap-2">
                    <span className="bg-background pr-3 text-sm font-semibold leading-6">
                      Version 0.1.47 - March 17, 2025
                    </span>
                    <CopyLinkButton version="version-0.1.47" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Feature Enhancements & DevTools
                    </h2>
                    <p className="mt-4 leading-7 text-muted-foreground">
                      Introducing recently viewed tables, advanced row selection, and comprehensive
                      editing capabilities.
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-8">
                      <li>
                        <h3 className="font-semibold leading-6">Recently Viewed Tables</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Implemented a feature to track and display recently viewed tables for quick access.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Row Selection & Detailed Panel</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Added the ability to select rows, opening a detailed panel for in-depth data insights.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Field and JSON Editing</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Enhanced editing capabilities allowing field-specific edits and full record
                          editing in JSON format.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">DevTools Integration</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Introduced DevTools to display frontend browser console logs and a network tab
                          for comprehensive debugging.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Version 0.1.32 */}
                <div id="version-0.1.32" className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-start group gap-2">
                    <span className="bg-background pr-3 text-sm font-semibold leading-6">
                      Version 0.1.32 - March 14, 2024
                    </span>
                    <CopyLinkButton version="version-0.1.32" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Feature Update</h2>
                    <p className="mt-4 leading-7 text-muted-foreground">
                      Enhanced UI controls and stability improvements.
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-8">
                      <li>
                        <h3 className="font-semibold leading-6">Button Positioning</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Added support for customizable button positioning in the interface.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Error Handling</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Improved error handling to ensure ConvexPanel button remains visible during errors.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Log Management</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Enhanced log filtering and auto-pause functionality with improved error log styling.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Version 0.1.25 */}
                <div id="version-0.1.25" className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-start group gap-2">
                    <span className="bg-background pr-3 text-sm font-semibold leading-6">
                      Version 0.1.25 - March 13, 2024
                    </span>
                    <CopyLinkButton version="version-0.1.25" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Documentation & Performance
                    </h2>
                    <p className="mt-4 leading-7 text-muted-foreground">
                      Major documentation updates and performance improvements.
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-8">
                      <li>
                        <h3 className="font-semibold leading-6">Infinite Scroll</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Improved infinite scroll functionality for better performance.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Documentation</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Enhanced documentation with improved installation and usage guidelines.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Automatic Login</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Added automatic login prompt during installation for better user experience.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Version 0.1.20 */}
                <div id="version-0.1.20" className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-start group gap-2">
                    <span className="bg-background pr-3 text-sm font-semibold leading-6">
                      Version 0.1.20 - March 12, 2024
                    </span>
                    <CopyLinkButton version="version-0.1.20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Health Monitoring Update
                    </h2>
                    <p className="mt-4 leading-7 text-muted-foreground">
                      Added comprehensive health monitoring features and UI improvements.
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-8">
                      <li>
                        <h3 className="font-semibold leading-6">Health Monitoring</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Implemented health monitoring feature with detailed metrics and visualization.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Cell Editing</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Added cell editing restrictions and improved data validation.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Version Checking</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Implemented version checking system and UI improvements.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Version 0.1.0 */}
                <div id="version-0.1.0" className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-muted"></div>
                  </div>
                  <div className="relative flex justify-start group gap-2">
                    <span className="bg-background pr-3 text-sm font-semibold leading-6">
                      Version 0.1.0 - March 14, 2024
                    </span>
                    <CopyLinkButton version="version-0.1.0" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Initial Release</h2>
                    <p className="mt-4 leading-7 text-muted-foreground">
                      The first stable release of Convex Panel with all core features.
                    </p>
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-8">
                      <li>
                        <h3 className="font-semibold leading-6">Real-time Data View</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          View and interact with your Convex data in real-time with automatic updates.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Live Logs</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Monitor your application logs in real-time with advanced filtering options.
                        </p>
                      </li>
                      <li>
                        <h3 className="font-semibold leading-6">Health Monitoring</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Track the health and performance of your Convex deployment.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}


