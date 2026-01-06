import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Copy,
  Check,
  FolderOpen,
  Github,
  ExternalLink,
  Server,
} from "lucide-react";
import { useMcpOptional } from "../../../contexts/McpContext";
import { useGitHubOptional } from "../../../contexts/GitHubContext";
import type { GitHubRepo } from "../../../services/github/types";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";

export function DesktopIntegrations() {
  const mcp = useMcpOptional();
  const github = useGitHubOptional();
  const [cursorConfig, setCursorConfig] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // For debouncing repo search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [repoSearchResults, setRepoSearchResults] = useState<GitHubRepo[]>([]);
  const [repoSearchLoading, setRepoSearchLoading] = useState(false);

  useEffect(() => {
    if (mcp?.status.running) {
      mcp.getCursorConfig().then(setCursorConfig);
    }
  }, [mcp?.status.running, mcp]);

  // Fetch branches when repo is selected (using context's fetchBranches with pagination)
  useEffect(() => {
    if (github?.selectedRepo) {
      const [owner, repo] = github.selectedRepo.full_name.split("/");
      github.fetchBranches(owner, repo);
    }
  }, [github?.selectedRepo, github]);

  // Debounced repo search handler
  const handleRepoSearchChange = useCallback(
    (query: string) => {
      // Clear any pending timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Only search if 3+ characters (the callback is already gated by minSearchLength)
      if (query.length < 3) {
        setRepoSearchResults([]);
        setRepoSearchLoading(false);
        return;
      }

      setRepoSearchLoading(true);

      // Debounce: wait 300ms before searching
      searchTimeoutRef.current = setTimeout(async () => {
        if (github?.searchRepos) {
          const results = await github.searchRepos(query);
          setRepoSearchResults(results);
        }
        setRepoSearchLoading(false);
      }, 300);
    },
    [github],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyConfig = async () => {
    if (mcp) {
      await mcp.copyConfigToClipboard();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Combine initial repos with search results for the dropdown
  // When no search is active, show the initial repos list
  // When searching, show search results
  const repoOptions =
    repoSearchResults.length > 0
      ? repoSearchResults.map((repo) => ({
          value: repo.full_name,
          label: repo.name,
          sublabel: repo.owner.login,
        }))
      : (github?.repos ?? []).map((repo) => ({
          value: repo.full_name,
          label: repo.name,
          sublabel: repo.owner.login,
        }));

  // Handle repo selection - need to find the full repo object
  const handleRepoSelect = useCallback(
    (fullName: string) => {
      // Look in both search results and initial repos
      const repo =
        repoSearchResults.find((r) => r.full_name === fullName) ??
        github?.repos.find((r) => r.full_name === fullName);
      if (repo && github?.selectRepo) {
        github.selectRepo(repo);
      }
    },
    [repoSearchResults, github],
  );

  // Branch options from context (all branches fetched with pagination)
  const branchOptions = (github?.branches ?? []).map((branch) => ({
    value: branch.name,
    label: branch.name,
  }));

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
          Integrations
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
          {/* Project Directory Section */}
          {mcp && (
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <FolderOpen
                  size={16}
                  style={{ color: "var(--color-panel-accent)" }}
                />
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    margin: 0,
                  }}
                >
                  Project Directory
                </h3>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-panel-text-secondary)",
                  marginBottom: "12px",
                }}
              >
                Your Convex project directory for terminal commands and file
                operations
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    fontSize: "12px",
                    color: mcp.projectPath
                      ? "var(--color-panel-text)"
                      : "var(--color-panel-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mcp.projectPath || "No project selected"}
                </div>
                <button
                  onClick={mcp.selectProjectDirectory}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    color: "var(--color-panel-text)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-bg-secondary)";
                  }}
                >
                  Browse
                </button>
              </div>
            </div>
          )}

          {/* GitHub Section */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <Github
                size={16}
                style={{ color: "var(--color-panel-accent)" }}
              />
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                  margin: 0,
                }}
              >
                GitHub
              </h3>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "12px",
              }}
            >
              Connect to GitHub to view schema history from your repository
            </p>

            {!github?.hasConvexProject ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  fontSize: "12px",
                  color: "var(--color-panel-text-muted)",
                }}
              >
                Select a Convex project to enable GitHub integration
              </div>
            ) : !github?.isAuthenticated ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--color-panel-text)",
                        marginBottom: "4px",
                      }}
                    >
                      Not connected
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text-muted)",
                      }}
                    >
                      Sign in to GitHub to enable schema history
                    </div>
                  </div>
                  <button
                    onClick={github?.startAuth}
                    disabled={github?.isLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#24292e",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: github?.isLoading ? "not-allowed" : "pointer",
                      opacity: github?.isLoading ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!github?.isLoading) {
                        e.currentTarget.style.backgroundColor = "#1b1f23";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#24292e";
                    }}
                  >
                    {github?.isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Github size={14} />
                    )}
                    Connect GitHub
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Auth Status */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#22c55e",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text)",
                      }}
                    >
                      Connected to GitHub
                      {github.user?.login && ` as ${github.user.login}`}
                    </span>
                  </div>
                  <button
                    onClick={github.logout}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "var(--color-panel-text-muted)",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-panel-bg-tertiary)";
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color =
                        "var(--color-panel-text-muted)";
                    }}
                  >
                    Disconnect
                  </button>
                </div>

                {/* Repository Selection */}
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "var(--color-panel-text-secondary)",
                      marginBottom: "6px",
                      display: "block",
                    }}
                  >
                    Repository
                  </label>
                  <SearchableSelect
                    value={github.selectedRepo?.full_name || ""}
                    options={repoOptions}
                    onChange={handleRepoSelect}
                    placeholder="Select a repository"
                    searchPlaceholder="Search repositories..."
                    loading={repoSearchLoading || github.reposLoading}
                    onSearchChange={handleRepoSearchChange}
                    minSearchLength={3}
                    sublabelAsText
                  />
                </div>

                {/* Branch Selection */}
                {github.selectedRepo && (
                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "var(--color-panel-text-secondary)",
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      Branch
                    </label>
                    <SearchableSelect
                      value={github.selectedBranch || ""}
                      options={branchOptions}
                      onChange={(branch) => github.selectBranch(branch)}
                      placeholder={
                        github.branchesLoading
                          ? "Loading branches..."
                          : "Select a branch"
                      }
                      searchPlaceholder="Search branches..."
                      loading={github.branchesLoading}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MCP Server Section */}
          {mcp && (
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <Server
                  size={16}
                  style={{ color: "var(--color-panel-accent)" }}
                />
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    margin: 0,
                  }}
                >
                  MCP Server
                </h3>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-panel-text-secondary)",
                  marginBottom: "12px",
                }}
              >
                Connect to Cursor for AI-assisted development
              </p>

              {/* Status */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: mcp.status.running
                          ? "#22c55e"
                          : "#6b7280",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--color-panel-text)",
                        }}
                      >
                        {mcp.status.running ? "Running" : "Stopped"}
                      </div>
                      {mcp.status.port && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--color-panel-text-muted)",
                          }}
                        >
                          Port {mcp.status.port}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={
                      mcp.status.running ? mcp.stopServer : mcp.startServer
                    }
                    disabled={mcp.isLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: mcp.status.running
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(34, 197, 94, 0.1)",
                      color: mcp.status.running ? "#ef4444" : "#22c55e",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: mcp.isLoading ? "not-allowed" : "pointer",
                      opacity: mcp.isLoading ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!mcp.isLoading) {
                        e.currentTarget.style.backgroundColor = mcp.status
                          .running
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(34, 197, 94, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = mcp.status.running
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(34, 197, 94, 0.1)";
                    }}
                  >
                    {mcp.isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : mcp.status.running ? (
                      "Stop"
                    ) : (
                      "Start"
                    )}
                  </button>
                </div>
              </div>

              {/* Cursor Config */}
              {mcp.status.running && cursorConfig && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-panel-text-secondary)",
                      }}
                    >
                      Add to Cursor's .cursor/mcp.json:
                    </span>
                    <button
                      onClick={handleCopyConfig}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "var(--color-panel-bg-secondary)",
                        color: copied ? "#22c55e" : "var(--color-panel-text)",
                        fontSize: "11px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-panel-bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-panel-bg-secondary)";
                      }}
                    >
                      {copied ? (
                        <>
                          <Check size={12} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "#0a0a0a",
                      border: "1px solid var(--color-panel-border)",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      color: "var(--color-panel-text-muted)",
                      overflowX: "auto",
                      margin: 0,
                    }}
                  >
                    {cursorConfig}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* External Integrations Link */}
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Other Integrations
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "12px",
              }}
            >
              Configure log streaming, exception reporting, and data export in
              the Convex Dashboard
            </p>
            <a
              href="https://docs.convex.dev/production/integrations/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--color-panel-accent)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              Learn about integrations
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
