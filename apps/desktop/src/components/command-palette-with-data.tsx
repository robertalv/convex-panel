/**
 * CommandPaletteWithData
 * Wrapper component that fetches tables and functions data from deployment context
 * and passes it to CommandPaletteProvider
 */

import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CommandPaletteProvider } from "@/contexts/command-palette-context";
import { useDeployment } from "@/contexts/deployment-context";
import { useFunctionRunnerActions } from "@/contexts/function-runner-context";
import {
  discoverFunctions,
  type ModuleFunction,
} from "@convex-panel/shared/api";
import { STALE_TIME } from "@/contexts/query-context";

interface CommandPaletteWithDataProps {
  children: ReactNode;
  onDisconnect: () => void;
  onOpenAbout: () => void;
  onToggleSidebar: () => void;
  onRefreshProjects?: () => void;
  isDeployKeyMode: boolean;
  onSelectTable: (tableName: string) => void;
}

/**
 * Fetch tables from Convex (same logic as useTableData)
 */
async function fetchTables(adminClient: any): Promise<string[]> {
  if (!adminClient) {
    return [];
  }

  try {
    const response = await adminClient.query({
      _name: "_system/frontend/getTableMapping",
      _args: { componentId: null },
    });

    return Object.keys(response || {});
  } catch (err: any) {
    console.error("Failed to fetch tables:", err);
    return [];
  }
}

/**
 * Fetch functions from Convex (same logic as useFunctions)
 */
async function fetchFunctions(
  adminClient: any,
): Promise<Array<{ identifier: string; type: string }>> {
  if (!adminClient) {
    return [];
  }

  try {
    const functions = await discoverFunctions(adminClient, false);
    return functions.map((fn: ModuleFunction) => ({
      identifier: fn.identifier,
      type: fn.udfType,
    }));
  } catch (err: any) {
    console.error("Failed to fetch functions:", err);
    return [];
  }
}

export function CommandPaletteWithData({
  children,
  onDisconnect,
  onOpenAbout,
  onToggleSidebar,
  onRefreshProjects,
  isDeployKeyMode,
  onSelectTable,
}: CommandPaletteWithDataProps) {
  const { adminClient, deploymentUrl } = useDeployment();
  const { openWithFunction } = useFunctionRunnerActions();

  // Fetch tables
  const { data: tables = [] } = useQuery({
    queryKey: ["command-palette-tables", deploymentUrl],
    queryFn: () => fetchTables(adminClient),
    enabled: Boolean(adminClient && deploymentUrl),
    staleTime: STALE_TIME.tables,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch functions
  const { data: functions = [] } = useQuery({
    queryKey: ["command-palette-functions", deploymentUrl],
    queryFn: () => fetchFunctions(adminClient),
    enabled: Boolean(adminClient),
    staleTime: STALE_TIME.functions,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <CommandPaletteProvider
      onDisconnect={onDisconnect}
      onOpenAbout={onOpenAbout}
      onToggleSidebar={onToggleSidebar}
      onRefreshProjects={onRefreshProjects}
      isDeployKeyMode={isDeployKeyMode}
      tables={tables}
      functions={functions}
      onSelectTable={onSelectTable}
      onOpenFunctionRunner={(functionId: string) => {
        // Open function runner with the selected function pre-selected
        openWithFunction(functionId);
      }}
    >
      {children}
    </CommandPaletteProvider>
  );
}
