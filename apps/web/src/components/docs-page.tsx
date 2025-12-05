import { useState } from "react";
import {
  Database,
  Activity,
  Zap,
  ArrowRight,
} from "lucide-react";
import { InstallationGuide } from "./docs/installation-guide";
import { IntroContent } from "./docs/intro-content";
import { FeatureContent } from "./docs/feature-content";
import { DocsSidebar } from "./docs/docs-sidebar";
import { ApiReferenceContent } from "./docs/api-reference-content";
import { ConfigurationContent } from "./docs/configuration-content";
import { AuthenticationContent } from "./docs/authentication-content";
import { QuickStartContent } from "./docs/quick-start-content";
import type { DocSectionId } from "./docs/types";

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSectionId>("quick-start");

  const renderContent = () => {
    switch (activeSection) {
      case "quick-start":
        return <QuickStartContent />;
      case "intro":
        return <IntroContent />;
      case "installation":
        return <InstallationGuide />;
      case "functions":
        return (
          <FeatureContent
            title="Functions"
            icon={Zap}
            description="The Functions tab provides a unified view of your entire Convex backend API. It automatically detects all registered queries, mutations, and actions."
            codeExample={`// convex/myFunctions.ts
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});`}
          />
        );
      case "queries":
        return (
          <FeatureContent
            title="Queries"
            subtitle="Read data with reactivity"
            icon={ArrowRight}
            description="Monitor active subscriptions and their return values. The panel shows you exactly what data is being synced to the client in real-time."
            codeExample={`// Observe this query updating live in the panel
export const getTask = query({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});`}
          />
        );
      case "mutations":
        return (
          <FeatureContent
            title="Mutations"
            subtitle="Write data transactionally"
            icon={ArrowRight}
            description="Track mutation calls, their arguments, and results. Useful for debugging side effects and database updates."
          />
        );
      case "actions":
        return (
          <FeatureContent
            title="Actions"
            subtitle="Integrate third-party services"
            icon={ArrowRight}
            description="Debug external API calls and long-running processes. Inspect execution time and potential failures."
          />
        );
      case "data":
        return (
          <FeatureContent
            title="Data Explorer"
            icon={Database}
            description="Browse your database tables directly from the panel. Filter, sort, and inspect documents without context switching to the dashboard."
          />
        );
      case "logs":
        return (
          <FeatureContent
            title="Live Logs"
            icon={Activity}
            description="Stream console.log output from your backend functions directly to the browser. Filter by log level, function name, or request ID."
            codeExample={`// Logs appear instantly in the panel
console.log("Processing user request", { userId: user._id });

// Errors are highlighted and stack traces are preserved
if (!authorized) {
  console.error("Unauthorized access attempt");
}`}
          />
        );
      case "api-reference":
        return <ApiReferenceContent />;
      case "configuration":
        return <ConfigurationContent />;
      case "authentication":
        return <AuthenticationContent />;
      default:
        return <InstallationGuide />;
    }
  };

  return (
    <section id="docs" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-content-primary mb-4">
            Documentation
          </h2>
          <p className="text-lg text-content-secondary max-w-2xl mx-auto">
            Everything you need to know to get started with Convex Panel.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-[600px]">
          <DocsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

          {/* Main Content Area */}
          <main className="flex-1 px-6 md:px-10 relative min-h-[500px]">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-content-accent/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">{renderContent()}</div>
          </main>
        </div>
      </div>
    </section>
  );
}
