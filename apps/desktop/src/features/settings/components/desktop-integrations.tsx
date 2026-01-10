import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  FolderOpen,
  Github,
  ExternalLink,
  X,
  AlertCircle,
  Code2,
  Terminal,
} from "lucide-react";
import { useGitHubOptional } from "../../../contexts/GitHubContext";
import { useProjectPath } from "../../../contexts/ProjectPathContext";
import type { GitHubRepo } from "../../../services/github/types";
import { SearchableSelect } from "../../../components/ui/SearchableSelect";
import {
  getAllEditors,
  getPreferredEditor,
  setPreferredEditor,
  isEditorAvailable,
  getInstallInstructions,
  addCustomEditor,
  removeCustomEditor,
  type EditorType,
} from "../../../utils/editor";
import {
  hasAutomatedInstall,
  getEditorInstallCommand,
  executeInTerminal,
} from "../../../utils/terminal-commands";

export function DesktopIntegrations() {
  const {
    projectPath,
    selectProjectDirectory,
    clearProjectPath,
    isValidating,
    validationError,
  } = useProjectPath();
  const github = useGitHubOptional();

  // Editor preference state
  const [preferredEditor, setPreferredEditorState] =
    useState<EditorType>(getPreferredEditor());
  const [allEditors, setAllEditors] = useState(getAllEditors());
  const [editorAvailability, setEditorAvailability] = useState<
    Record<string, boolean | null>
  >({});
  const [checkingEditors, setCheckingEditors] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showAddCustomEditor, setShowAddCustomEditor] = useState(false);
  const [customEditorForm, setCustomEditorForm] = useState({
    label: "",
    command: "",
    instructions: "",
  });

  // Refresh editors list (after adding/removing custom editors)
  const refreshEditors = useCallback(() => {
    setAllEditors(getAllEditors());
  }, []);

  // Check editor availability on mount and when editors change
  useEffect(() => {
    const checkEditors = async () => {
      setCheckingEditors(true);
      const results: Record<string, boolean> = {};

      for (const editorKey of Object.keys(allEditors)) {
        try {
          results[editorKey] = await isEditorAvailable(editorKey);
        } catch (error) {
          console.error(`Failed to check ${editorKey}:`, error);
          results[editorKey] = false;
        }
      }

      setEditorAvailability(results);
      setCheckingEditors(false);
    };

    checkEditors();
  }, [allEditors]);

  // Handle editor selection change
  const handleEditorChange = useCallback((editor: EditorType) => {
    setPreferredEditor(editor);
    setPreferredEditorState(editor);
  }, []);

  // For debouncing repo search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [repoSearchResults, setRepoSearchResults] = useState<GitHubRepo[]>([]);
  const [repoSearchLoading, setRepoSearchLoading] = useState(false);

  // Fetch branches when repo is selected (using context's fetchBranches with pagination)
  useEffect(() => {
    if (github?.selectedRepo && github?.fetchBranches) {
      const [owner, repo] = github.selectedRepo.full_name.split("/");
      github.fetchBranches(owner, repo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [github?.selectedRepo?.full_name]);

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
              Your Convex project directory for terminal commands, automatic
              schema fixes, and file operations
            </p>

            {/* Validation error */}
            {validationError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  marginBottom: "12px",
                  backgroundColor:
                    "color-mix(in srgb, var(--color-error-base) 10%, transparent)",
                  border: "1px solid var(--color-error-base)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--color-error-base)",
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{validationError}</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  fontSize: "12px",
                  color: projectPath
                    ? "var(--color-panel-text)"
                    : "var(--color-panel-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {projectPath || "No project selected"}
              </div>
              <button
                onClick={selectProjectDirectory}
                disabled={isValidating}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  color: "var(--color-panel-text)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: isValidating ? "not-allowed" : "pointer",
                  opacity: isValidating ? 0.6 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isValidating) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-bg-tertiary)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-panel-bg-secondary)";
                }}
              >
                {isValidating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Browse"
                )}
              </button>
              {projectPath && (
                <button
                  onClick={clearProjectPath}
                  disabled={isValidating}
                  title="Clear project path"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    color: "var(--color-panel-text-muted)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: isValidating ? "not-allowed" : "pointer",
                    opacity: isValidating ? 0.6 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!isValidating) {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-panel-bg-tertiary)";
                      e.currentTarget.style.color = "var(--color-error-base)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-bg-secondary)";
                    e.currentTarget.style.color =
                      "var(--color-panel-text-muted)";
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Editor Preference Section */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <Code2 size={16} style={{ color: "var(--color-panel-accent)" }} />
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-panel-text)",
                  margin: 0,
                }}
              >
                Preferred Editor
              </h3>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "12px",
              }}
            >
              Choose which code editor to open when applying schema fixes. Make
              sure your editor is installed and available in your PATH.
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {Object.keys(allEditors).map((editorKey) => {
                const editor = allEditors[editorKey];
                const isSelected = preferredEditor === editorKey;
                const isAvailable = editorAvailability[editorKey];
                const isCustom = editor.isCustom === true;

                return (
                  <div
                    key={editorKey}
                    style={{
                      flex: "1 1 calc(50% - 4px)",
                      minWidth: "200px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() => handleEditorChange(editorKey)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: `2px solid ${
                          isSelected
                            ? "var(--color-panel-accent)"
                            : "var(--color-panel-border)"
                        }`,
                        backgroundColor: isSelected
                          ? "color-mix(in srgb, var(--color-panel-accent) 10%, transparent)"
                          : "var(--color-panel-bg-secondary)",
                        color: isSelected
                          ? "var(--color-panel-accent)"
                          : "var(--color-panel-text)",
                        fontSize: "12px",
                        fontWeight: isSelected ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-panel-bg-tertiary)";
                          e.currentTarget.style.borderColor =
                            "var(--color-panel-text-muted)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-panel-bg-secondary)";
                          e.currentTarget.style.borderColor =
                            "var(--color-panel-border)";
                        }
                      }}
                    >
                      {editor.label}
                      {isCustom && (
                        <span
                          style={{
                            fontSize: "9px",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            backgroundColor: "var(--color-panel-accent)",
                            color: "white",
                          }}
                        >
                          CUSTOM
                        </span>
                      )}
                      {!checkingEditors && isAvailable !== null && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isAvailable
                              ? "var(--color-success-base)"
                              : "var(--color-error-base)",
                          }}
                          title={
                            isAvailable
                              ? "Available in PATH"
                              : "Not found in PATH"
                          }
                        />
                      )}
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => {
                          if (
                            confirm(`Remove custom editor "${editor.label}"?`)
                          ) {
                            removeCustomEditor(editorKey);
                            if (preferredEditor === editorKey) {
                              handleEditorChange("cursor");
                            }
                            refreshEditors();
                          }
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--color-error-base)",
                          backgroundColor: "transparent",
                          color: "var(--color-error-base)",
                          fontSize: "10px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--color-error-base)";
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color =
                            "var(--color-error-base)";
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--color-panel-text-muted)",
                  margin: 0,
                }}
              >
                Selected:{" "}
                <strong>
                  {allEditors[preferredEditor]?.label || "Unknown"}
                </strong>{" "}
                (
                <code style={{ fontSize: "10px" }}>
                  {allEditors[preferredEditor]?.command || "unknown"}
                </code>
                )
                {!checkingEditors &&
                  editorAvailability[preferredEditor] === false && (
                    <span style={{ color: "var(--color-error-base)" }}>
                      {" "}
                      - Not found in PATH
                    </span>
                  )}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {!checkingEditors &&
                  editorAvailability[preferredEditor] === false &&
                  hasAutomatedInstall(
                    allEditors[preferredEditor]?.command || "",
                  ) && (
                    <button
                      onClick={() => {
                        const editorCommand =
                          allEditors[preferredEditor]?.command || "";
                        console.log(
                          "[DesktopIntegrations] Install CLI Tool clicked for:",
                          editorCommand,
                        );

                        const command = getEditorInstallCommand(editorCommand);
                        console.log(
                          "[DesktopIntegrations] Got install command:",
                          command,
                        );

                        if (command) {
                          executeInTerminal(command);
                        } else {
                          console.error(
                            "[DesktopIntegrations] No install command found for:",
                            editorCommand,
                          );
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-panel-accent)",
                        backgroundColor: "var(--color-panel-accent)",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "color-mix(in srgb, var(--color-panel-accent) 85%, black)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-panel-accent)";
                      }}
                    >
                      <Terminal size={12} />
                      Install CLI Tool
                    </button>
                  )}
                <button
                  onClick={() => setShowInstallHelp(!showInstallHelp)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-panel-border)",
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    color: "var(--color-panel-text-secondary)",
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
                  {showInstallHelp ? "Hide" : "Show"} Install Instructions
                </button>
              </div>
            </div>

            {/* Installation Instructions */}
            {showInstallHelp && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  border: "1px solid var(--color-panel-border)",
                }}
              >
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    marginBottom: "8px",
                  }}
                >
                  How to install{" "}
                  {allEditors[preferredEditor]?.label || "this editor"}{" "}
                  command-line tool:
                </h4>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--color-panel-text-secondary)",
                    marginBottom: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  {getInstallInstructions(preferredEditor)}
                </p>
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-panel-bg)",
                    border: "1px solid var(--color-panel-border)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      color: "var(--color-panel-text-muted)",
                      margin: "0 0 4px 0",
                    }}
                  >
                    To verify installation, run in terminal:
                  </p>
                  <code
                    style={{
                      fontSize: "11px",
                      color: "var(--color-panel-accent)",
                      fontFamily: "monospace",
                    }}
                  >
                    which {allEditors[preferredEditor]?.command || "command"}
                  </code>
                </div>
              </div>
            )}

            {/* Add Custom Editor Button */}
            <div style={{ marginTop: "16px" }}>
              <button
                onClick={() => setShowAddCustomEditor(!showAddCustomEditor)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-panel-border)",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  color: "var(--color-panel-text)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
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
                {showAddCustomEditor ? "Cancel" : "+ Add Custom Editor"}
              </button>
            </div>

            {/* Add Custom Editor Form */}
            {showAddCustomEditor && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-panel-bg-secondary)",
                  border: "1px solid var(--color-panel-border)",
                }}
              >
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                    marginBottom: "12px",
                  }}
                >
                  Add Custom Editor
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        color: "var(--color-panel-text-secondary)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Editor Name*
                    </label>
                    <input
                      type="text"
                      value={customEditorForm.label}
                      onChange={(e) =>
                        setCustomEditorForm({
                          ...customEditorForm,
                          label: e.target.value,
                        })
                      }
                      placeholder="e.g., Zed"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-panel-border)",
                        backgroundColor: "var(--color-panel-bg)",
                        color: "var(--color-panel-text)",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "11px",
                        color: "var(--color-panel-text-secondary)",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Command*
                    </label>
                    <input
                      type="text"
                      value={customEditorForm.command}
                      onChange={(e) =>
                        setCustomEditorForm({
                          ...customEditorForm,
                          command: e.target.value,
                        })
                      }
                      placeholder="e.g., zed"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-panel-border)",
                        backgroundColor: "var(--color-panel-bg)",
                        color: "var(--color-panel-text)",
                        fontSize: "12px",
                        fontFamily: "monospace",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (customEditorForm.label && customEditorForm.command) {
                        const id = customEditorForm.command.toLowerCase();
                        addCustomEditor(
                          id,
                          customEditorForm.label,
                          customEditorForm.command,
                          customEditorForm.instructions || undefined,
                        );
                        setCustomEditorForm({
                          label: "",
                          command: "",
                          instructions: "",
                        });
                        setShowAddCustomEditor(false);
                        refreshEditors();
                      }
                    }}
                    disabled={
                      !customEditorForm.label || !customEditorForm.command
                    }
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--color-panel-accent)",
                      backgroundColor: "var(--color-panel-accent)",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor:
                        customEditorForm.label && customEditorForm.command
                          ? "pointer"
                          : "not-allowed",
                      opacity:
                        customEditorForm.label && customEditorForm.command
                          ? 1
                          : 0.5,
                      transition: "all 0.2s",
                    }}
                  >
                    Add Editor
                  </button>
                </div>
              </div>
            )}
          </div>

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
                    onClick={() => {
                      const editorCommand =
                        allEditors[preferredEditor]?.command || "";
                      console.log(
                        "[DesktopIntegrations] Install CLI Tool clicked for:",
                        editorCommand,
                      );

                      const command = getEditorInstallCommand(editorCommand);
                      console.log(
                        "[DesktopIntegrations] Got install command:",
                        command,
                      );

                      if (command) {
                        executeInTerminal(command);
                      } else {
                        console.error(
                          "[DesktopIntegrations] No install command found for:",
                          editorCommand,
                        );
                      }
                    }}
                    title="Automatically install CLI tool (may require sudo password)"
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
