import { useState } from "react";
import { CodeBlock } from "./code-block";
import { cn } from "../../lib/utils";
import { frameworks } from "./data";
import type { Framework } from "./types";

export function InstallationGuide() {
  const [activeTab, setActiveTab] = useState<Framework>("react");
  const activeFramework = frameworks.find((f) => f.id === activeTab) || frameworks[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold text-content-primary mb-4">Installation</h3>
        <p className="text-content-secondary mb-6">
          Choose your framework to see specific installation instructions. Convex Panel is
          designed to be zero-config for most setups.
        </p>

        {/* Framework Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {frameworks.map((framework) => {
            const isActive = activeTab === framework.id;
            const isSvg = typeof framework.icon === "string";

            return (
              <button
                key={framework.id}
                onClick={() => setActiveTab(framework.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                  isActive
                    ? "text-content-primary bg-background-tertiary border-border shadow-sm"
                    : "text-content-secondary border-transparent hover:text-content-primary hover:bg-background-tertiary/50",
                )}
              >
                {isSvg ? (
                  <div
                    className={cn(
                      "w-4 h-4 flex items-center justify-center",
                      isActive ? "text-content-primary" : "text-content-tertiary",
                    )}
                    dangerouslySetInnerHTML={{ __html: framework.icon as string }}
                  />
                ) : (
                  <framework.icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-content-accent" : "text-content-tertiary",
                    )}
                  />
                )}
                <span>{framework.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h4 className="text-xs font-semibold text-content-primary uppercase tracking-wider">
                Add Dependency
              </h4>
            </div>
            <CodeBlock code={activeFramework.install} title="Terminal" language="bash" />
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h4 className="text-xs font-semibold text-content-primary uppercase tracking-wider">
                Mount Component
              </h4>
            </div>
            <p className="text-sm text-content-secondary">{activeFramework.description}</p>
            <div className="relative">
              {/* <div className="absolute top-0 right-0 px-3 py-1 bg-background-tertiary text-[10px] font-mono text-content-tertiary border-l border-b border-border rounded-bl-lg rounded-tr-lg border z-10">
                {activeFramework.filename}
              </div> */}
              <CodeBlock 
                code={activeFramework.setup} 
                title={activeFramework.filename} 
                language={
                  activeFramework.filename.endsWith('.tsx') || activeFramework.filename.includes('tsx') ? 'tsx' :
                  'typescript'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
