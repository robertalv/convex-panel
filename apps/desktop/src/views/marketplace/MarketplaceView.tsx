/**
 * Desktop Marketplace View
 *
 * A marketplace for browsing and installing Convex components.
 * Design inspired by Midday's app store:
 * - Grid of cards
 * - Right panel for details
 * - Tab filters (All / Installed)
 * - Search input
 */

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  Search,
  Loader2,
  X,
  FolderOpen,
  Package,
  CheckCircle,
} from "lucide-react";
import { useProjectPath } from "@/contexts/project-path-context";
import { cn } from "@/lib/utils";
import { Toolbar } from "@/components/ui/toolbar";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ComponentCard } from "./components/ComponentCard";
import { ComponentDetailPanel } from "./components/ComponentDetailPanel";
import { InstallModal } from "./components/InstallModal";
import {
  getComponents,
  getCategories,
  filterComponents,
  getComponentCountByCategory,
  type RegistryComponent,
  type ComponentCategory,
  type PackageManager,
} from "@convex-panel/registry";
import { detectPackageManagerFromLockFiles } from "./utils/package-manager";
import { getInstalledPackages } from "./utils/installed-packages";

type TabFilter = "all" | "installed";
type CategoryFilter = ComponentCategory | "all";

export function MarketplaceView() {
  const { projectPath, selectProjectDirectory, validationError } =
    useProjectPath();

  // State
  const [tab, setTab] = useState<TabFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedComponent, setSelectedComponent] =
    useState<RegistryComponent | null>(null);
  const [installingComponent, setInstallingComponent] =
    useState<RegistryComponent | null>(null);
  const [detectedPackageManager, setDetectedPackageManager] =
    useState<PackageManager | null>(null);
  const [installedPackages, setInstalledPackages] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingInstalled, setIsLoadingInstalled] = useState(false);

  // Get components from registry
  getComponents(); // Ensure registry is loaded
  const categories = getCategories();
  const categoryCounts = getComponentCountByCategory();

  // Prepare category options for SearchableSelect
  const categoryOptions = useMemo(() => {
    const allOption = {
      value: "all",
      label: "All Categories",
    };
    const categoryOpts = categories.map((cat) => ({
      value: cat.id,
      label: `${cat.label} (${categoryCounts[cat.id] || 0})`,
    }));
    return [allOption, ...categoryOpts];
  }, [categories, categoryCounts]);

  // Detect package manager when project path changes
  useEffect(() => {
    if (projectPath) {
      detectPackageManagerFromLockFiles(projectPath).then(
        setDetectedPackageManager,
      );
      setIsLoadingInstalled(true);
      getInstalledPackages(projectPath)
        .then(setInstalledPackages)
        .finally(() => setIsLoadingInstalled(false));
    } else {
      setDetectedPackageManager(null);
      setInstalledPackages(new Set());
    }
  }, [projectPath]);

  // Filter components based on search, category, and tab
  const filteredComponents = useMemo(() => {
    let filtered = filterComponents({
      query: search,
      category: category === "all" ? undefined : category,
    });

    // Filter by installed tab
    if (tab === "installed") {
      filtered = filtered.filter((c) => installedPackages.has(c.npmPackage));
    }

    return filtered;
  }, [search, category, tab, installedPackages]);

  // Calculate installed components count (only registry components that are installed)
  const installedComponentsCount = useMemo(() => {
    const allComponents = getComponents().components;
    return allComponents.filter((c) => installedPackages.has(c.npmPackage))
      .length;
  }, [installedPackages]);

  // Handlers
  const handleDetails = useCallback((component: RegistryComponent) => {
    setSelectedComponent(component);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  const handleInstall = useCallback((component: RegistryComponent) => {
    setInstallingComponent(component);
  }, []);

  const handleCloseInstall = useCallback(() => {
    setInstallingComponent(null);
    // Refresh installed packages after install
    if (projectPath) {
      getInstalledPackages(projectPath).then(setInstalledPackages);
    }
  }, [projectPath]);

  const handleSelectFolder = useCallback(async () => {
    await selectProjectDirectory();
  }, [selectProjectDirectory]);

  const handleOpenExternal = useCallback((url: string) => {
    import("@tauri-apps/plugin-shell").then(({ open }) => {
      open(url);
    });
  }, []);

  return (
    <div className="flex h-full overflow-hidden bg-background-base">
      {/* Main content area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300",
          selectedComponent ? "mr-[400px]" : "",
        )}
      >
        {/* Toolbar with tabs, search, and filters */}
        <Toolbar
          left={
            <>
              {/* Tabs */}
              <div
                className="flex items-center rounded-lg p-0.5"
                style={{ backgroundColor: "var(--color-surface-raised)" }}
              >
                <button
                  onClick={() => setTab("all")}
                  className="flex items-center gap-1.5 px-3 py-1 h-7 text-xs font-medium rounded-md transition-all"
                  style={{
                    backgroundColor:
                      tab === "all"
                        ? "var(--color-surface-base)"
                        : "transparent",
                    color:
                      tab === "all"
                        ? "var(--color-text-base)"
                        : "var(--color-text-muted)",
                    boxShadow:
                      tab === "all" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Package size={14} />
                  <span>All</span>
                </button>
                <button
                  onClick={() => setTab("installed")}
                  className="flex items-center gap-1.5 px-3 py-1 h-7 text-xs font-medium rounded-md transition-all"
                  style={{
                    backgroundColor:
                      tab === "installed"
                        ? "var(--color-surface-base)"
                        : "transparent",
                    color:
                      tab === "installed"
                        ? "var(--color-text-base)"
                        : "var(--color-text-muted)",
                    boxShadow:
                      tab === "installed"
                        ? "0 1px 2px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Installed</span>
                  {installedComponentsCount > 0 && (
                    <span
                      className="ml-0.5 text-[10px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      ({installedComponentsCount})
                    </span>
                  )}
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search components..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border-base)",
                    color: "var(--color-text-base)",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                    style={{
                      color: "var(--color-text-muted)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-text-base)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category filter */}
              <SearchableSelect
                options={categoryOptions}
                value={category}
                onChange={(value) => setCategory(value as CategoryFilter)}
                placeholder="All Categories"
                searchPlaceholder="Search categories..."
                variant="secondary"
                className="min-w-[180px]"
              />
            </>
          }
          right={
            <>
              {/* Validation error */}
              {validationError && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                  style={{
                    color: "var(--color-error-base)",
                    backgroundColor:
                      "var(--color-error-base-alpha, rgba(239, 68, 68, 0.1))",
                  }}
                  title={validationError}
                >
                  <span className="truncate max-w-[200px]">
                    {validationError}
                  </span>
                </div>
              )}
              {/* Project folder indicator */}
              {projectPath ? (
                <button
                  onClick={handleSelectFolder}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    color: "var(--color-text-muted)",
                    backgroundColor: "var(--color-surface-overlay)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-surface-overlay)";
                  }}
                  title={projectPath}
                >
                  <FolderOpen size={12} />
                  <span className="truncate max-w-[150px]">
                    {projectPath.split("/").pop()}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleSelectFolder}
                  className="flex items-center gap-2 px-2 py-1 h-7 text-xs rounded-md transition-colors"
                  style={{
                    backgroundColor: "var(--color-surface-raised)",
                    color: "var(--color-text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-surface-overlay)";
                    e.currentTarget.style.color = "var(--color-text-base)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-surface-raised)";
                    e.currentTarget.style.color = "var(--color-text-muted)";
                  }}
                >
                  <FolderOpen size={14} />
                  <span>Select project folder</span>
                </button>
              )}
            </>
          }
        />

        {/* Component grid */}
        <div className="flex-1 overflow-auto p-6">
          {isLoadingInstalled && tab === "installed" ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-raised flex items-center justify-center mb-4">
                <Search size={24} className="text-text-muted" />
              </div>
              <h3 className="text-sm font-medium text-text-base mb-1">
                No components found
              </h3>
              <p className="text-xs text-text-muted">
                {tab === "installed"
                  ? "No components are installed in this project"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredComponents.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onDetails={handleDetails}
                  onInstall={handleInstall}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel (slides in from right) */}
      {selectedComponent && (
        <ComponentDetailPanel
          component={selectedComponent}
          isInstalled={installedPackages.has(selectedComponent.npmPackage)}
          onClose={handleCloseDetails}
          onInstall={() => handleInstall(selectedComponent)}
          onOpenExternal={handleOpenExternal}
        />
      )}

      {/* Install modal */}
      {installingComponent && (
        <InstallModal
          component={installingComponent}
          projectPath={projectPath}
          detectedPackageManager={detectedPackageManager}
          onClose={handleCloseInstall}
          onSelectFolder={handleSelectFolder}
        />
      )}
    </div>
  );
}

export default MarketplaceView;
