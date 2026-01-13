/**
 * useVisualizerSettings Hook
 * Persists schema visualizer UI settings to localStorage
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { VisualizationSettings, LayoutAlgorithm } from "../types";

// Storage key for persisting visualizer settings
const SETTINGS_STORAGE_KEY = "convex-panel:schema-visualizer:settings";

// Default visualization settings
export const defaultVisualizerSettings: VisualizationSettings = {
  layout: "hierarchical" as LayoutAlgorithm,
  showFields: true,
  showIndexes: true,
  showRelationships: true,
  showCardinality: true,
  colorByModule: true,
};

// UI state that should be persisted
interface PersistedUIState {
  sidebarCollapsed: boolean;
  codePanelOpen: boolean;
  showHealthPanel: boolean;
}

const defaultUIState: PersistedUIState = {
  sidebarCollapsed: false,
  codePanelOpen: false,
  showHealthPanel: false,
};

interface PersistedState {
  settings: VisualizationSettings;
  ui: PersistedUIState;
}

/**
 * Load persisted settings from localStorage
 */
function loadPersistedState(): PersistedState | null {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate basic structure
      if (typeof parsed === "object" && parsed.settings && parsed.ui) {
        return parsed as PersistedState;
      }
    }
  } catch (e) {
    console.warn("[useVisualizerSettings] Failed to load persisted state:", e);
  }
  return null;
}

/**
 * Save settings to localStorage
 */
function persistState(state: PersistedState): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[useVisualizerSettings] Failed to persist state:", e);
  }
}

export interface UseVisualizerSettingsReturn {
  // Visualization settings
  settings: VisualizationSettings;
  setSettings: (settings: VisualizationSettings) => void;
  updateSettings: (partial: Partial<VisualizationSettings>) => void;
  setLayout: (layout: LayoutAlgorithm) => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  codePanelOpen: boolean;
  setCodePanelOpen: (open: boolean) => void;
  showHealthPanel: boolean;
  setShowHealthPanel: (show: boolean) => void;
}

export function useVisualizerSettings(): UseVisualizerSettingsReturn {
  // Load initial state from localStorage
  const [state, setState] = useState<PersistedState>(() => {
    const persisted = loadPersistedState();
    return (
      persisted ?? {
        settings: defaultVisualizerSettings,
        ui: defaultUIState,
      }
    );
  });

  // Persist state changes to localStorage
  useEffect(() => {
    persistState(state);
  }, [state]);

  // Settings handlers
  const setSettings = useCallback((settings: VisualizationSettings) => {
    setState((prev) => ({ ...prev, settings }));
  }, []);

  const updateSettings = useCallback(
    (partial: Partial<VisualizationSettings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...partial },
      }));
    },
    [],
  );

  const setLayout = useCallback((layout: LayoutAlgorithm) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, layout },
    }));
  }, []);

  // UI state handlers
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, sidebarCollapsed: collapsed },
    }));
  }, []);

  const setCodePanelOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, codePanelOpen: open },
    }));
  }, []);

  const setShowHealthPanel = useCallback((show: boolean) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, showHealthPanel: show },
    }));
  }, []);

  const settings = useMemo(
    () => state.settings,
    [
      state.settings.layout,
      state.settings.showFields,
      state.settings.showIndexes,
      state.settings.showRelationships,
      state.settings.showCardinality,
      state.settings.colorByModule,
    ],
  );

  return useMemo(
    () => ({
      settings,
      setSettings,
      updateSettings,
      setLayout,
      sidebarCollapsed: state.ui.sidebarCollapsed,
      setSidebarCollapsed,
      codePanelOpen: state.ui.codePanelOpen,
      setCodePanelOpen,
      showHealthPanel: state.ui.showHealthPanel,
      setShowHealthPanel,
    }),
    [
      settings,
      state.ui.sidebarCollapsed,
      state.ui.codePanelOpen,
      state.ui.showHealthPanel,
      setSettings,
      updateSettings,
      setLayout,
      setSidebarCollapsed,
      setCodePanelOpen,
      setShowHealthPanel,
    ],
  );
}

export default useVisualizerSettings;
