import { useSearchParams } from "react-router-dom";
import {
  DataView as PanelDataView,
  SheetProvider,
  useSheetSafe,
} from "convex-panel";
import { useDeployment } from "@/contexts/DeploymentContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DataSheet } from "./DataSheet";

/**
 * Internal component that renders the DataView with push-style sheet support.
 * Must be inside SheetProvider to access sheet context.
 */
function DataViewContent() {
  const [searchParams] = useSearchParams();
  const {
    deploymentUrl,
    authToken,
    useMockData,
    adminClient,
    teamSlug,
    projectSlug,
  } = useDeployment();

  const { isOpen: isSheetOpen, sheetContent } = useSheetSafe();

  // Get sheet width from content or default
  const sheetWidth = sheetContent?.width ?? "500px";

  // Get table from URL params to pass as initialTable
  const tableFromUrl = searchParams.get("table");

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Main content - DataView handles the edit sheet internally with inline mode */}
      <PanelDataView
        convexUrl={deploymentUrl ?? undefined}
        accessToken={authToken ?? ""}
        adminClient={adminClient}
        useMockData={useMockData}
        teamSlug={teamSlug ?? undefined}
        projectSlug={projectSlug ?? undefined}
        onError={(error) => console.error("Data view error:", error)}
        sheetRenderMode="inline"
        initialTable={tableFromUrl}
      />

      {/* Global Sheet for Schema, Indexes, Metrics - flexbox will push content when open */}
      {isSheetOpen && <DataSheet width={sheetWidth} />}
    </div>
  );
}

export function DataView() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`cp-theme-${resolvedTheme} h-full`}>
      <SheetProvider>
        <DataViewContent />
      </SheetProvider>
    </div>
  );
}
