import { useCallback } from "react";
import { useDeployment } from "@/contexts/deployment-context";
import {
  useFunctionRunnerState,
  useFunctionRunnerActions,
} from "@/contexts/function-runner-context";
import { CustomQuerySheet } from "@/views/data/components/CustomQuerySheet";
import { useFunctions } from "@/views/data/hooks/useFunctions";
import { useComponents } from "@/views/data/hooks/useComponents";
import { ResizableSheet } from "@/views/data/components/ResizableSheet";

export function FunctionRunnerPanel() {
  const { isOpen, layoutMode } = useFunctionRunnerState();
  const { closeFunctionRunner, setLayoutMode } = useFunctionRunnerActions();
  const { adminClient, deploymentUrl, authToken, useMockData } =
    useDeployment();

  // Get available functions and components
  const { functions: availableFunctions } = useFunctions({
    adminClient,
    useMockData,
  });

  const { components, selectedComponentId, setSelectedComponent } =
    useComponents({
      adminClient,
      useMockData,
    });

  const handleLayoutModeChange = useCallback(
    (mode: "side" | "bottom" | "fullscreen") => {
      setLayoutMode(mode);
    },
    [setLayoutMode],
  );

  if (!isOpen || !adminClient) return null;

  const isBottomLayout = layoutMode === "bottom";
  const isFullscreenLayout = layoutMode === "fullscreen";

  // For fullscreen, take up all available space in the content area (not fixed overlay)
  if (isFullscreenLayout) {
    return (
      <div
        className="flex-1 h-full w-full min-h-0 min-w-0"
        style={{
          backgroundColor: "var(--color-background-base)",
        }}
      >
        <CustomQuerySheet
          tableName=""
          adminClient={adminClient}
          deploymentUrl={deploymentUrl || undefined}
          accessToken={authToken || undefined}
          componentId={selectedComponentId}
          onClose={closeFunctionRunner}
          availableFunctions={availableFunctions}
          availableComponents={components}
          onComponentChange={setSelectedComponent}
          layoutMode={layoutMode}
          onLayoutModeChange={handleLayoutModeChange}
        />
      </div>
    );
  }

  // For side/bottom layouts, use ResizableSheet
  return (
    <ResizableSheet
      id="function-runner-global"
      side={isBottomLayout ? "bottom" : "right"}
      defaultWidth={isBottomLayout ? undefined : 400}
      defaultHeight={isBottomLayout ? 320 : undefined}
      minWidth={isBottomLayout ? undefined : 350}
      maxWidth={isBottomLayout ? undefined : 800}
      minHeight={isBottomLayout ? 200 : undefined}
      maxHeight={isBottomLayout ? 600 : undefined}
      showHeader={false}
      onClose={closeFunctionRunner}
    >
      <CustomQuerySheet
        tableName=""
        adminClient={adminClient}
        deploymentUrl={deploymentUrl || undefined}
        accessToken={authToken || undefined}
        componentId={selectedComponentId}
        onClose={closeFunctionRunner}
        availableFunctions={availableFunctions}
        availableComponents={components}
        onComponentChange={setSelectedComponent}
        layoutMode={layoutMode}
        onLayoutModeChange={handleLayoutModeChange}
      />
    </ResizableSheet>
  );
}
