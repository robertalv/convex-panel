import { useState, useEffect, useCallback } from "react";
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
import { useGitHubOptional } from "../../../contexts/github-context";
import { useProjectPath } from "../../../contexts/project-path-context";
import type { GitHubRepo } from "../../../services/github/types";
import { SearchableSelect } from "../../../components/ui/searchable-select";
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
import { useDebounceCallback } from "../../../hooks/useDebounce";

// ============================================================================
// Section Container Component
// ============================================================================

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, icon, description, children }: SectionProps) {
  return (
    <div className="mb-4 rounded-xl border border-border-base bg-surface-raised p-4">
      <div
        className={`flex items-center gap-2 ${description ? "mb-1" : "mb-3"}`}
      >
        {icon && <span className="text-brand-base">{icon}</span>}
        <h3 className="text-sm font-semibold text-text-base">{title}</h3>
      </div>
      {description && (
        <p className="mb-3 text-xs text-text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}

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
  const performSearch = useCallback(
    async (query: string) => {
      // Only search if 3+ characters (the callback is already gated by minSearchLength)
      if (query.length < 3) {
        setRepoSearchResults([]);
        setRepoSearchLoading(false);
        return;
      }

      setRepoSearchLoading(true);

      if (github?.searchRepos) {
        const results = await github.searchRepos(query);
        setRepoSearchResults(results);
      }
      setRepoSearchLoading(false);
    },
    [github],
  );

  const debouncedSearch = useDebounceCallback(performSearch, 300);

  const handleRepoSearchChange = useCallback(
    (query: string) => {
      debouncedSearch(query);
    },
    [debouncedSearch],
  );

  // Combine initial repos with search results for the dropdown
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

  // Handle repo selection
  const handleRepoSelect = useCallback(
    (fullName: string) => {
      const repo =
        repoSearchResults.find((r) => r.full_name === fullName) ??
        github?.repos.find((r) => r.full_name === fullName);
      if (repo && github?.selectRepo) {
        github.selectRepo(repo);
      }
    },
    [repoSearchResults, github],
  );

  // Branch options from context
  const branchOptions = (github?.branches ?? []).map((branch) => ({
    value: branch.name,
    label: branch.name,
  }));

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="w-full max-w-2xl space-y-4">
          {/* Project Directory Section */}
          <Section
            title="Project Directory"
            icon={<FolderOpen size={16} />}
            description="Your Convex project directory for terminal commands, automatic schema fixes, and file operations"
          >
            {/* Validation error */}
            {validationError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-error-base bg-error-base/10 px-3 py-2 text-xs text-error-base">
                <AlertCircle size={14} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border-base bg-surface-base px-3 py-2.5 text-xs text-text-base">
                {projectPath || (
                  <span className="text-text-muted">No project selected</span>
                )}
              </div>
              <button
                onClick={selectProjectDirectory}
                disabled={isValidating}
                className="shrink-0 rounded-lg border border-border-base bg-surface-base px-4 py-2.5 text-xs font-medium text-text-base transition-all hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="flex shrink-0 items-center rounded-lg border border-border-base bg-surface-base p-2.5 text-text-muted transition-all hover:bg-surface-raised hover:text-error-base disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </Section>

          {/* Editor Preference Section */}
          <Section
            title="Preferred Editor"
            icon={<Code2 size={16} />}
            description="Choose which code editor to open when applying schema fixes. Make sure your editor is installed and available in your PATH."
          >
            <div className="flex flex-wrap gap-2">
              {Object.keys(allEditors).map((editorKey) => {
                const editor = allEditors[editorKey];
                const isSelected = preferredEditor === editorKey;
                const isAvailable = editorAvailability[editorKey];
                const isCustom = editor.isCustom === true;

                return (
                  <div
                    key={editorKey}
                    className="flex min-w-[200px] flex-1 flex-col gap-1"
                  >
                    <button
                      onClick={() => handleEditorChange(editorKey)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-3 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-brand-base bg-brand-base/10 font-semibold text-brand-base"
                          : "border-border-base bg-surface-base text-text-base hover:border-text-muted hover:bg-surface-raised"
                      }`}
                    >
                      {editor.label}
                      {isCustom && (
                        <span className="rounded bg-brand-base px-1 py-0.5 text-[9px] text-white">
                          CUSTOM
                        </span>
                      )}
                      {!checkingEditors && isAvailable !== null && (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isAvailable ? "bg-success-base" : "bg-error-base"
                          }`}
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
                        className="rounded-md border border-error-base px-2 py-1 text-[10px] text-error-base transition-all hover:bg-error-base hover:text-white"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="m-0 text-[11px] text-text-muted">
                Selected:{" "}
                <strong>
                  {allEditors[preferredEditor]?.label || "Unknown"}
                </strong>{" "}
                (
                <code className="text-[10px]">
                  {allEditors[preferredEditor]?.command || "unknown"}
                </code>
                )
                {!checkingEditors &&
                  editorAvailability[preferredEditor] === false && (
                    <span className="text-error-base">
                      {" "}
                      - Not found in PATH
                    </span>
                  )}
              </p>
              <div className="flex gap-2">
                {!checkingEditors &&
                  editorAvailability[preferredEditor] === false &&
                  hasAutomatedInstall(
                    allEditors[preferredEditor]?.command || "",
                  ) && (
                    <button
                      onClick={() => {
                        const editorCommand =
                          allEditors[preferredEditor]?.command || "";
                        const command = getEditorInstallCommand(editorCommand);
                        if (command) {
                          executeInTerminal(command);
                        }
                      }}
                      className="flex items-center gap-1 rounded-md border border-brand-base bg-brand-base px-2 py-1 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                    >
                      <Terminal size={12} />
                      Install CLI Tool
                    </button>
                  )}
                <button
                  onClick={() => setShowInstallHelp(!showInstallHelp)}
                  className="rounded-md border border-border-base bg-surface-base px-2 py-1 text-[11px] text-text-muted transition-all hover:bg-surface-raised"
                >
                  {showInstallHelp ? "Hide" : "Show"} Install Instructions
                </button>
              </div>
            </div>

            {/* Installation Instructions */}
            {showInstallHelp && (
              <div className="mt-3 rounded-lg border border-border-base bg-surface-base p-3">
                <h4 className="mb-2 text-xs font-semibold text-text-base">
                  How to install{" "}
                  {allEditors[preferredEditor]?.label || "this editor"}{" "}
                  command-line tool:
                </h4>
                <p className="mb-3 text-[11px] leading-relaxed text-text-muted">
                  {getInstallInstructions(preferredEditor)}
                </p>
                <div className="rounded-md border border-border-base bg-surface-raised p-2">
                  <p className="m-0 mb-1 text-[10px] text-text-muted">
                    To verify installation, run in terminal:
                  </p>
                  <code className="font-mono text-[11px] text-brand-base">
                    which {allEditors[preferredEditor]?.command || "command"}
                  </code>
                </div>
              </div>
            )}

            {/* Add Custom Editor Button */}
            <div className="mt-4">
              <button
                onClick={() => setShowAddCustomEditor(!showAddCustomEditor)}
                className="w-full rounded-lg border border-border-base bg-surface-base px-4 py-2 text-xs font-medium text-text-base transition-all hover:bg-surface-raised"
              >
                {showAddCustomEditor ? "Cancel" : "+ Add Custom Editor"}
              </button>
            </div>

            {/* Add Custom Editor Form */}
            {showAddCustomEditor && (
              <div className="mt-3 rounded-lg border border-border-base bg-surface-base p-4">
                <h4 className="mb-3 text-xs font-semibold text-text-base">
                  Add Custom Editor
                </h4>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-text-muted">
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
                      className="w-full rounded-md border border-border-base bg-surface-raised px-3 py-2 text-xs text-text-base"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] text-text-muted">
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
                      className="w-full rounded-md border border-border-base bg-surface-raised px-3 py-2 font-mono text-xs text-text-base"
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
                    className="rounded-lg border border-brand-base bg-brand-base px-4 py-2.5 text-xs font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Editor
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* GitHub Section */}
          <Section
            title="GitHub"
            icon={<Github size={16} />}
            description="Connect to GitHub to view schema history from your repository"
          >
            {!github?.hasConvexProject ? (
              <div className="rounded-lg border border-border-base bg-surface-base px-3 py-2.5 text-xs text-text-muted">
                Select a Convex project to enable GitHub integration
              </div>
            ) : !github?.isAuthenticated ? (
              <div className="rounded-lg border border-border-base bg-surface-base p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="mb-1 text-xs font-medium text-text-base">
                      Not connected
                    </div>
                    <div className="text-xs text-text-muted">
                      Sign in to GitHub to enable schema history
                    </div>
                  </div>
                  <button
                    onClick={github?.startAuth}
                    disabled={github?.isLoading}
                    className="flex items-center gap-1.5 rounded-lg border-none bg-[#24292e] px-4 py-2 text-xs font-medium text-white transition-all hover:bg-[#1b1f23] disabled:cursor-not-allowed disabled:opacity-60"
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
              <div className="flex flex-col gap-3">
                {/* Auth Status */}
                <div className="flex items-center justify-between rounded-lg border border-border-base bg-surface-base px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success-base" />
                    <span className="text-xs text-text-base">
                      Connected to GitHub
                      {github.user?.login && ` as ${github.user.login}`}
                    </span>
                  </div>
                  <button
                    onClick={github.logout}
                    className="rounded-md border-none bg-transparent px-2.5 py-1 text-[11px] text-text-muted transition-all hover:bg-surface-raised hover:text-error-base"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Repository Selection */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-text-muted">
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
                    <label className="mb-1.5 block text-[11px] font-medium text-text-muted">
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
          </Section>

          {/* External Integrations Link */}
          <Section
            title="Other Integrations"
            description="Configure log streaming, exception reporting, and data export in the Convex Dashboard"
          >
            <a
              href="https://docs.convex.dev/production/integrations/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-base no-underline hover:underline"
            >
              Learn about integrations
              <ExternalLink size={12} />
            </a>
          </Section>
        </div>
      </div>
    </div>
  );
}
