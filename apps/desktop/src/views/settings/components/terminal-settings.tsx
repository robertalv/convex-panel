export function TerminalSettings() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-panel-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "49px",
          borderBottom: "1px solid var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-panel-text)",
            margin: 0,
          }}
        >
          Terminal
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          {/* Terminal Info */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Integrated Terminal
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
                lineHeight: 1.5,
              }}
            >
              The integrated terminal supports Convex CLI commands and is used
              by MCP tools for AI-assisted development.
            </p>

            {/* Keyboard Shortcuts */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--color-panel-bg-secondary)",
                borderRadius: "12px",
                border: "1px solid var(--color-panel-border)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-panel-text-secondary)",
                  marginBottom: "12px",
                }}
              >
                Keyboard Shortcuts
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-panel-text)",
                  }}
                >
                  Toggle Terminal:
                </span>
                <kbd
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-panel-bg-tertiary)",
                    border: "1px solid var(--color-panel-border)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "var(--color-panel-text)",
                  }}
                >
                  Ctrl+`
                </kbd>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-panel-text-muted)",
                  }}
                >
                  or
                </span>
                <kbd
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-panel-bg-tertiary)",
                    border: "1px solid var(--color-panel-border)",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    color: "var(--color-panel-text)",
                  }}
                >
                  Cmd+`
                </kbd>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "12px",
              }}
            >
              Features
            </h3>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {[
                "Run Convex CLI commands (npx convex dev, deploy, etc.)",
                "Execute custom scripts and commands",
                "Used by MCP tools for AI-assisted operations",
                "Automatically uses project directory context",
              ].map((feature, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: "var(--color-panel-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-panel-accent)",
                    }}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
