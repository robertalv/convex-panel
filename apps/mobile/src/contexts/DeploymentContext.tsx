/**
 * Deployment Context
 *
 * Manages currently selected team/project/deployment with persistence
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "./QueryContext";
import type { Team, Project, Deployment } from "../types";

interface DeploymentContextValue {
  team: Team | null;
  project: Project | null;
  deployment: Deployment | null;
  setTeam: (team: Team | null) => void;
  setProject: (project: Project | null) => void;
  setDeployment: (deployment: Deployment | null) => void;
  clearSelection: () => void;
  isLoading: boolean;
}

const DeploymentContext = createContext<DeploymentContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "@convex-panel:deployment-selection";

interface StoredSelection {
  team: Team | null;
  project: Project | null;
  deployment: Deployment | null;
}

export function DeploymentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [team, setTeamState] = useState<Team | null>(null);
  const [project, setProjectState] = useState<Project | null>(null);
  const [deployment, setDeploymentState] = useState<Deployment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevDeploymentRef = useRef<Deployment | null>(null);

  // Load saved selection on mount
  useEffect(() => {
    loadSelection();
  }, []);

  // Save selection whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveSelection();
    }
  }, [team, project, deployment, isLoading]);

  // Clear React Query cache when deployment changes
  useEffect(() => {
    if (!isLoading && deployment?.id !== prevDeploymentRef.current?.id) {
      // Deployment changed - clear all deployment-scoped queries
      // Clear data queries
      queryClient.removeQueries({ queryKey: ["data"] });
      
      // Clear logs queries
      queryClient.removeQueries({ queryKey: ["logs"] });
      
      // Clear deployment status queries
      queryClient.removeQueries({ queryKey: ["deploymentStatus"] });
      
      // Clear insights queries
      queryClient.removeQueries({ queryKey: ["insights"] });
      
      // Clear function health queries
      queryClient.removeQueries({ queryKey: ["functionHealth"] });
      
      // Clear function activity queries
      queryClient.removeQueries({ queryKey: ["functionActivity"] });
      
      console.log("[DeploymentContext] Cleared React Query cache for deployment change");
      
      prevDeploymentRef.current = deployment;
    } else if (!isLoading && !deployment) {
      // Deployment cleared
      prevDeploymentRef.current = null;
    }
  }, [deployment, isLoading]);

  const loadSelection = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StoredSelection = JSON.parse(saved);
        setTeamState(parsed.team);
        setProjectState(parsed.project);
        setDeploymentState(parsed.deployment);
        console.log("[DeploymentContext] Loaded saved selection:", {
          team: parsed.team?.name,
          project: parsed.project?.name,
          deployment: parsed.deployment?.name,
        });
      }
    } catch (error) {
      console.error("[DeploymentContext] Error loading selection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSelection = async () => {
    try {
      const toSave: StoredSelection = { team, project, deployment };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log("[DeploymentContext] Saved selection:", {
        team: team?.name,
        project: project?.name,
        deployment: deployment?.name,
      });
    } catch (error) {
      console.error("[DeploymentContext] Error saving selection:", error);
    }
  };

  const setTeam = useCallback(
    (newTeam: Team | null) => {
      setTeamState(newTeam);
      // Clear project and deployment when team changes
      if (newTeam?.id !== team?.id) {
        setProjectState(null);
        setDeploymentState(null);
      }
    },
    [team],
  );

  const setProject = useCallback(
    (newProject: Project | null) => {
      setProjectState(newProject);
      // Clear deployment when project changes
      if (newProject?.id !== project?.id) {
        setDeploymentState(null);
      }
    },
    [project],
  );

  const setDeployment = useCallback((newDeployment: Deployment | null) => {
    setDeploymentState(newDeployment);
  }, []);

  const clearSelection = useCallback(async () => {
    setTeamState(null);
    setProjectState(null);
    setDeploymentState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[DeploymentContext] Cleared selection");
    } catch (error) {
      console.error("[DeploymentContext] Error clearing selection:", error);
    }
  }, []);

  const value: DeploymentContextValue = {
    team,
    project,
    deployment,
    setTeam,
    setProject,
    setDeployment,
    clearSelection,
    isLoading,
  };

  return (
    <DeploymentContext.Provider value={value}>
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment(): DeploymentContextValue {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error("useDeployment must be used within a DeploymentProvider");
  }
  return context;
}
