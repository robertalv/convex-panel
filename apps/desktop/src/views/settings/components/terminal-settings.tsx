// ============================================================================
// Section Container Component
// ============================================================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="mb-4 rounded-xl border border-border-base bg-surface-raised p-4">
      <h3 className="m-0 mb-3 text-sm font-semibold text-text-base">{title}</h3>
      {description && (
        <p className="m-0 mb-3 text-xs leading-relaxed text-text-muted">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

export function TerminalSettings() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      {/* Content */}
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="w-full max-w-[600px]">
          {/* Integrated Terminal Section */}
          <Section
            title="Integrated Terminal"
            description="The integrated terminal supports Convex CLI commands and is used by MCP tools for AI-assisted development."
          >
            {/* Keyboard Shortcuts */}
            <div className="rounded-lg border border-border-base bg-surface-base p-3">
              <div className="mb-2 text-xs font-medium text-text-muted">
                Keyboard Shortcuts
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-base">Toggle Terminal:</span>
                <kbd className="rounded-md border border-border-base bg-surface-raised px-2 py-1 font-mono text-[11px] text-text-base">
                  Ctrl+`
                </kbd>
                <span className="text-xs text-text-muted">or</span>
                <kbd className="rounded-md border border-border-base bg-surface-raised px-2 py-1 font-mono text-[11px] text-text-base">
                  Cmd+`
                </kbd>
              </div>
            </div>
          </Section>

          {/* Features Section */}
          <Section title="Features">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {[
                "Run Convex CLI commands (npx convex dev, deploy, etc.)",
                "Execute custom scripts and commands",
                "Used by MCP tools for AI-assisted operations",
                "Automatically uses project directory context",
              ].map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-text-muted"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-brand-base" />
                  {feature}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
