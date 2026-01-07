/**
 * FunctionsSidebar Component
 * Tree-style sidebar for function selection, matching DataSidebar/SchemaTreeSidebar style
 */

import { useState, useMemo } from "react";
import {
  Zap,
  Search,
  X,
  Code2,
  GitBranch,
  Globe,
  Database,
} from "lucide-react";
import { TreeItem } from "@/components/ui/TreeItem";

/**
 * Function type definitions
 */
export type FunctionType = "query" | "mutation" | "action" | "httpAction";

export interface FunctionItem {
  name: string;
  type: FunctionType;
  lastDeploy?: string;
  source?: string;
}

interface FunctionGroup {
  type: FunctionType;
  label: string;
  functions: FunctionItem[];
}

interface FunctionsSidebarProps {
  functions: FunctionItem[];
  selectedFunction: string | null;
  onSelectFunction: (functionName: string | null) => void;
  isLoading?: boolean;
}

/**
 * Get icon for function type
 */
function getFunctionTypeIcon(type: FunctionType) {
  switch (type) {
    case "query":
      return (
        <Database size={12} style={{ color: "var(--color-info-base)" }} />
      );
    case "mutation":
      return (
        <GitBranch size={12} style={{ color: "var(--color-warning-base)" }} />
      );
    case "action":
      return <Code2 size={12} style={{ color: "var(--color-brand-base)" }} />;
    case "httpAction":
      return <Globe size={12} style={{ color: "var(--color-success-base)" }} />;
  }
}

export function FunctionsSidebar({
  functions,
  selectedFunction,
  onSelectFunction,
  isLoading = false,
}: FunctionsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    queries: true,
    mutations: true,
    actions: true,
    httpActions: true,
  });

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Filter and group functions
  const groupedFunctions = useMemo(() => {
    const filtered = functions.filter((fn) =>
      fn.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const totalFunctions = functions.length;

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      {/* Search input */}
      <div
        className="p-2"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tree content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarColor: "var(--color-border-strong) transparent" }}
      >
        {isLoading ? (
          <div
            className="px-4 py-3 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading functions...
          </div>
        ) : groupedFunctions.length === 0 ? (
          <div
            className="px-4 py-3 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {searchQuery ? "No functions match search" : "No functions found"}
          </div>
        ) : (
          <>
            {groupedFunctions.map((group) => {
              const groupKey = group.type + "s"; // queries, mutations, etc.
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
                        key={fn.name}
                        label={fn.name}
                        icon={getFunctionTypeIcon(fn.type)}
                        depth={1}
                        isSelected={selectedFunction === fn.name}
                        onClick={() => onSelectFunction(fn.name)}
                        rightContent={
                          fn.lastDeploy && (
                            <span className="text-[10px]">{fn.lastDeploy}</span>
                          )
                        }
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
