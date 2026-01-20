/**
 * FunctionsSidebar Component
 * Tree-style sidebar for function selection, matching DataSidebar/SchemaTreeSidebar style
 */

import { useState, useMemo } from "react";
import { Zap, Search, X, CodeXml } from "lucide-react";
import { TreeItem } from "@/components/ui/tree-item";
import { FunctionIcon } from "@/components/svg/function-icon";
import { ComponentSelector } from "@/components/component-selector";
import { FunctionsSidebarSkeleton } from "./FunctionsSidebarSkeleton";
import type { ConvexComponent } from "@/types/desktop";

/**
 * Function type definitions
 */
export type FunctionType = "query" | "mutation" | "action" | "httpAction";

export interface FunctionItem {
  name: string;
  identifier: string;
  type: FunctionType;
  lastDeploy?: string;
  source?: string; // module/file path
}

interface FunctionGroup {
  type: FunctionType;
  label: string;
  functions: FunctionItem[];
}

interface ModuleGroup {
  module: string;
  functions: FunctionItem[];
}

export type OrganizationMode = "byType" | "byModule";

interface FunctionsSidebarProps {
  functions: FunctionItem[];
  selectedFunction: string | null;
  onSelectFunction: (functionName: string | null) => void;
  isLoading?: boolean;
  /** Component selection - selected component ID (null = root app) */
  selectedComponentId?: string | null;
  /** Called when component changes - receives component ID (null = root app) */
  onComponentSelect?: (componentId: string | null) => void;
  /** List of available components (ConvexComponent objects) */
  components?: ConvexComponent[];
  /** Organization mode */
  organizationMode?: OrganizationMode;
}

/**
 * Get icon for function type
 */
function getFunctionTypeIcon(type: FunctionType) {
  const colorMap: Record<FunctionType, string> = {
    query: "var(--color-info-base)",
    mutation: "var(--color-warning-base)",
    action: "var(--color-brand-base)",
    httpAction: "var(--color-success-base)",
  };

  return <FunctionIcon size={12} style={{ color: colorMap[type] }} />;
}

/**
 * Extract module name from source path
 */
function getModuleName(source: string | undefined): string {
  if (!source) return "unknown";
  // Remove .js extension and get the base name
  const name = source.replace(/\.js$/, "");
  // If it has a path, get the last part
  const parts = name.split("/");
  return parts[parts.length - 1] || "unknown";
}

export function FunctionsSidebar({
  functions,
  selectedFunction,
  onSelectFunction,
  isLoading = false,
  selectedComponentId,
  onComponentSelect,
  components = [],
  organizationMode = "byModule",
}: FunctionsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter and group functions by type
  const groupedByType = useMemo(() => {
    const filtered = functions.filter((fn) =>
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const groups: FunctionGroup[] = [
      {
        type: "query",
        label: "Queries",
        functions: filtered.filter((fn) => fn.type === "query"),
      },
      {
        type: "mutation",
        label: "Mutations",
        functions: filtered.filter((fn) => fn.type === "mutation"),
      },
      {
        type: "action",
        label: "Actions",
        functions: filtered.filter((fn) => fn.type === "action"),
      },
      {
        type: "httpAction",
        label: "HTTP Actions",
        functions: filtered.filter((fn) => fn.type === "httpAction"),
      },
    ];

    return groups.filter((group) => group.functions.length > 0);
  }, [functions, searchQuery]);

  // Filter and group functions by module
  const groupedByModule = useMemo(() => {
    const filtered = functions.filter((fn) =>
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Group by module
    const moduleMap = new Map<string, FunctionItem[]>();
    filtered.forEach((fn) => {
      const module = getModuleName(fn.source);
      if (!moduleMap.has(module)) {
        moduleMap.set(module, []);
      }
      moduleMap.get(module)!.push(fn);
    });

    // Convert to array and sort
    const groups: ModuleGroup[] = Array.from(moduleMap.entries())
      .map(([module, funcs]) => ({
        module,
        functions: funcs.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.module.localeCompare(b.module));

    return groups;
  }, [functions, searchQuery]);

  // Auto-expand all groups when mode or functions change
  useMemo(() => {
    const newExpanded: Record<string, boolean> = {};
    if (organizationMode === "byType") {
      groupedByType.forEach((group) => {
        const key = group.type + "s";
        newExpanded[key] = true;
      });
    } else {
      groupedByModule.forEach((group) => {
        newExpanded[group.module] = true;
      });
    }
    setExpanded(newExpanded);
  }, [organizationMode, groupedByType, groupedByModule]);

  const totalFunctions = functions.length;

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      {/* Component selector - only show when multiple components exist */}
      {components.length > 1 && (
        <div
          className="p-2 h-[45px] flex items-center"
          style={{ borderBottom: "1px solid var(--color-border-base)" }}
        >
          <ComponentSelector
            selectedComponentId={selectedComponentId ?? null}
            onSelect={onComponentSelect || (() => {})}
            components={components}
            fullWidth
            variant="input"
          />
        </div>
      )}

      {/* Search input */}
      <div
        className="p-2 h-[45px]"
        style={{ borderBottom: "1px solid var(--color-border-base)" }}
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search functions..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md focus:outline-none"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              border: "1px solid var(--color-border-base)",
              color: "var(--color-text-base)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-muted)" }}
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
      </div>

      {/* Tree content */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent"
        style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
      >
        {isLoading ? (
          <FunctionsSidebarSkeleton organizationMode={organizationMode} />
        ) : organizationMode === "byType" ? (
          // By Type View
          groupedByType.length === 0 ? (
            <div
              className="px-4 py-3 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {searchQuery ? "No functions match search" : "No functions found"}
            </div>
          ) : (
            <>
              {groupedByType.map((group) => {
                const groupKey = group.type + "s";
                return (
                  <div key={group.type}>
                    {/* Group header */}
                    <TreeItem
                      label={group.label}
                      icon={
                        <Zap
                          size={14}
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      }
                      depth={0}
                      isExpandable
                      isExpanded={expanded[groupKey]}
                      onToggle={() => toggleExpanded(groupKey)}
                      rightContent={
                        <span className="text-[10px]">
                          {group.functions.length}
                        </span>
                      }
                    />

                    {/* Functions in this group */}
                    {expanded[groupKey] &&
                      group.functions.map((fn) => (
                        <TreeItem
                          key={fn.identifier}
                          label={fn.name}
                          icon={getFunctionTypeIcon(fn.type)}
                          depth={1}
                          isSelected={selectedFunction === fn.name}
                          onClick={() => onSelectFunction(fn.name)}
                        />
                      ))}
                  </div>
                );
              })}
            </>
          )
        ) : // By Module View
        groupedByModule.length === 0 ? (
          <div
            className="px-4 py-3 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {searchQuery ? "No functions match search" : "No functions found"}
          </div>
        ) : (
          <>
            {groupedByModule.map((group) => {
              return (
                <div key={group.module}>
                  {/* Module header */}
                  <TreeItem
                    label={group.module}
                    icon={
                      <CodeXml
                        size={14}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                    }
                    depth={0}
                    isExpandable
                    isExpanded={expanded[group.module]}
                    onToggle={() => toggleExpanded(group.module)}
                    rightContent={
                      <span className="text-[10px]">
                        {group.functions.length}
                      </span>
                    }
                  />

                  {/* Functions in this module */}
                  {expanded[group.module] &&
                    group.functions.map((fn) => (
                      <TreeItem
                        key={fn.identifier}
                        label={fn.name}
                        icon={getFunctionTypeIcon(fn.type)}
                        depth={1}
                        isSelected={selectedFunction === fn.name}
                        onClick={() => onSelectFunction(fn.name)}
                      />
                    ))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Stats footer */}
      <div
        className="p-2 text-[10px] flex items-center justify-between"
        style={{
          borderTop: "1px solid var(--color-border-base)",
          color: "var(--color-text-muted)",
        }}
      >
        <span>{totalFunctions} functions</span>
        {selectedFunction && (
          <span className="truncate max-w-[150px]" title={selectedFunction}>
            {selectedFunction}
          </span>
        )}
      </div>
    </div>
  );
}

export default FunctionsSidebar;
