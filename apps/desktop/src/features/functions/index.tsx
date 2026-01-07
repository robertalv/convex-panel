import { useState } from "react";
import { Clock3, Code2, GitCommitHorizontal, Rocket, PanelLeftOpen } from "lucide-react";
import { FeaturePanel } from "../../components/FeaturePanel";
import { OpenInEditorButton } from "../../components/OpenInEditor";
import { FunctionsSidebar, type FunctionItem, type FunctionType } from "./components/FunctionsSidebar";
import { ResizableSheet } from "../data/components/ResizableSheet";

const functions: FunctionItem[] = [
  {
    name: "queries/users",
    lastDeploy: "2h ago",
    source: "convex/functions/users.ts",
    type: "query" as FunctionType,
  },
  {
    name: "mutations/updateProfile",
    lastDeploy: "1d ago",
    source: "convex/functions/users.ts",
    type: "mutation" as FunctionType,
  },
  {
    name: "actions/sendEmail",
    lastDeploy: "10m ago",
    source: "convex/actions/email.ts",
    type: "action" as FunctionType,
  },
  {
    name: "queries/messages",
    lastDeploy: "3h ago",
    source: "convex/functions/messages.ts",
    type: "query" as FunctionType,
  },
  {
    name: "http/webhook",
    lastDeploy: "1h ago",
    source: "convex/http.ts",
    type: "httpAction" as FunctionType,
  },
];

// Sidebar config
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 400;

export function FunctionsView() {
  const [selectedFunction, setSelectedFunction] = useState<string | null>(
    functions[0]?.name || null
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get the currently selected function details
  const currentFunction = functions.find((fn) => fn.name === selectedFunction);

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-surface-base)" }}
    >
      {/* Sidebar toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="flex items-center justify-center w-10 h-full transition-colors"
          style={{
            backgroundColor: "var(--color-surface-base)",
            borderRight: "1px solid var(--color-border-base)",
            color: "var(--color-text-subtle)",
          }}
          title="Show sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Sidebar */}
      {!sidebarCollapsed && (
        <ResizableSheet
          id="functions-sidebar"
          side="left"
          defaultWidth={DEFAULT_SIDEBAR_WIDTH}
          minWidth={MIN_SIDEBAR_WIDTH}
          maxWidth={MAX_SIDEBAR_WIDTH}
          showHeader={false}
        >
          <FunctionsSidebar
            functions={functions}
            selectedFunction={selectedFunction}
            onSelectFunction={setSelectedFunction}
            isLoading={false}
          />
        </ResizableSheet>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="feature-grid">
          <FeaturePanel
            title="Functions"
            subtitle="Queries, mutations, actions, and HTTP"
            actions={
              <span className="chip">
                <Code2 size={14} /> source-linked
              </span>
            }
          >
            <div className="table-like">
              {functions.map((fn) => (
                <div 
                  className="row" 
                  key={fn.name}
                  onClick={() => setSelectedFunction(fn.name)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: selectedFunction === fn.name 
                      ? "var(--color-surface-raised)" 
                      : "transparent"
                  }}
                >
                  <div className="cell cell--wide">
                    <div className="pill">{fn.name}</div>
                  </div>
                  <div className="cell">
                    <Clock3 size={12} /> {fn.lastDeploy}
                  </div>
                  <div className="cell flex items-center gap-1">
                    {fn.source}
                    <OpenInEditorButton filePath={fn.source} iconOnly size="sm" />
                  </div>
                  <div className="cell">
                    <span
                      className={`chip chip--${fn.type === "mutation" ? "warn" : "muted"}`}
                    >
                      {fn.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </FeaturePanel>

          <FeaturePanel
            title="Recent pushes"
            subtitle="Latest deploy metadata"
            dense
          >
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-icon">
                  <Rocket size={14} />
                </div>
                <div>
                  <div className="timeline-title">Preview build deployed</div>
                  <div className="timeline-detail">
                    feature/auth-refactor • 6 minutes ago
                  </div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon">
                  <GitCommitHorizontal size={14} />
                </div>
                <div>
                  <div className="timeline-title">Compiled 12 functions</div>
                  <div className="timeline-detail">main • 1 hour ago</div>
                </div>
              </div>
            </div>
          </FeaturePanel>
        </div>
      </div>
    </div>
  );
}
