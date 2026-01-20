/**
 * Deployment Selector Bottom Sheet
 *
 * Bottom sheet component for selecting team, project, and deployment
 */

import React, { useCallback, useMemo } from "react";
import {
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BottomSheetFlatList, BottomSheetView } from "@gorhom/bottom-sheet";
import type BottomSheet from "@gorhom/bottom-sheet";
import { Icon } from "./ui/Icon";
import { Avatar } from "./ui";
import { BaseSheet } from "./sheets/BaseSheet";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useTeams, useProjects, useDeployments } from "../hooks/useBigBrain";
import { getDeploymentIcon, getDeploymentColors } from "../utils";
import type { Team, Project, Deployment } from "../types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DeploymentSelectorSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  onClose?: () => void;
}

type SelectionStep = "team" | "project" | "deployment";

export function DeploymentSelectorSheet({
  sheetRef,
  onClose,
}: DeploymentSelectorSheetProps) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const { team, project, deployment, setTeam, setProject, setDeployment } =
    useDeployment();
  const [currentStep, setCurrentStep] = React.useState<SelectionStep>("team");
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(
    team?.id ?? null,
  );
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    number | null
  >(project?.id ?? null);

  const accessToken = session?.accessToken ?? null;

  // Fetch data based on current selection
  const { data: teams = [], isLoading: isLoadingTeams } = useTeams(accessToken);
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects(
    accessToken,
    selectedTeamId,
  );
  const {
    data: deployments = [],
    isLoading: isLoadingDeployments,
    error: deploymentsError,
  } = useDeployments(accessToken, selectedProjectId);

  // Calculate item count and loading state for current step
  const { currentItemCount, currentIsLoading } = useMemo(() => {
    switch (currentStep) {
      case "team":
        return {
          currentItemCount: teams.length,
          currentIsLoading: isLoadingTeams,
        };
      case "project":
        return {
          currentItemCount: projects.length,
          currentIsLoading: isLoadingProjects,
        };
      case "deployment":
        return {
          currentItemCount: deployments.length,
          currentIsLoading: isLoadingDeployments,
        };
    }
  }, [
    currentStep,
    teams.length,
    projects.length,
    deployments.length,
    isLoadingTeams,
    isLoadingProjects,
    isLoadingDeployments,
  ]);

  // Reset step when sheet closes
  const handleSheetClose = useCallback(() => {
    setCurrentStep("team");
    setSelectedTeamId(team?.id ?? null);
    setSelectedProjectId(project?.id ?? null);
    onClose?.();
  }, [team, project, onClose]);

  // Handle team selection
  const handleSelectTeam = useCallback(
    (selectedTeam: Team) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedTeamId(selectedTeam.id);
      setSelectedProjectId(null);
      setTeam(selectedTeam);
      setCurrentStep("project");
    },
    [setTeam],
  );

  // Handle project selection
  const handleSelectProject = useCallback(
    (selectedProject: Project) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSelectedProjectId(selectedProject.id);
      setProject(selectedProject);
      setCurrentStep("deployment");
    },
    [setProject],
  );

  // Handle deployment selection
  const handleSelectDeployment = useCallback(
    (selectedDeployment: Deployment) => {
      setDeployment(selectedDeployment);
      sheetRef.current?.close();
    },
    [setDeployment, sheetRef],
  );

  // Handle back button
  const handleBack = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (currentStep === "deployment") {
      setCurrentStep("project");
    } else if (currentStep === "project") {
      setCurrentStep("team");
      setSelectedTeamId(team?.id ?? null);
      setSelectedProjectId(null);
    }
  }, [currentStep, team]);

  // Render team list
  const renderTeams = () => {
    if (isLoadingTeams) {
      return (
        <BottomSheetView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </BottomSheetView>
      );
    }

    if (teams.length === 0) {
      return (
        <BottomSheetView style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No teams found
          </Text>
        </BottomSheetView>
      );
    }

    return (
      <BottomSheetFlatList
        data={teams}
        keyExtractor={(item: Team) => item.id.toString()}
        renderItem={({ item }: { item: Team }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectTeam(item)}
            activeOpacity={0.6}
          >
            <Avatar name={item.name} hashKey={item.id} size={32} borderRadius={16} />
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            {team?.id === item.id ? (
              <Icon
                name="checkmark-circle"
                size={20}
                color={theme.colors.primary}
              />
            ) : (
              <Icon
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        style={{ backgroundColor: theme.colors.background }}
      />
    );
  };

  // Render project list
  const renderProjects = () => {
    if (isLoadingProjects) {
      return (
        <BottomSheetView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </BottomSheetView>
      );
    }

    if (projects.length === 0) {
      return (
        <BottomSheetView style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No projects found
          </Text>
        </BottomSheetView>
      );
    }

    return (
      <BottomSheetFlatList
        data={projects}
        keyExtractor={(item: Project) => item.id.toString()}
        renderItem={({ item }: { item: Project }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectProject(item)}
            activeOpacity={0.6}
          >
            <Avatar name={item.name} hashKey={item.id} size={32} borderRadius={16} />
            <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Icon
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        style={{ backgroundColor: theme.colors.background }}
      />
    );
  };

  // Render deployment list
  const renderDeployments = () => {
    if (isLoadingDeployments) {
      return (
        <BottomSheetView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </BottomSheetView>
      );
    }

    if (deploymentsError) {
      return (
        <BottomSheetView style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.error }]}>
            Error loading deployments
          </Text>
          <Text
            style={[styles.errorDetail, { color: theme.colors.textSecondary }]}
          >
            {deploymentsError instanceof Error
              ? deploymentsError.message
              : "Unknown error occurred"}
          </Text>
        </BottomSheetView>
      );
    }

    if (deployments.length === 0) {
      return (
        <BottomSheetView style={styles.emptyContainer}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No deployments found
          </Text>
        </BottomSheetView>
      );
    }

    return (
      <BottomSheetFlatList
        data={deployments}
        keyExtractor={(item: Deployment) => item.id.toString()}
        renderItem={({ item }: { item: Deployment }) => {
          const colors = getDeploymentColors(item.deploymentType, theme);
          const iconName = getDeploymentIcon(item);

          return (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleSelectDeployment(item)}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.deploymentIcon,
                  {
                    backgroundColor: colors.backgroundColor,
                    borderWidth: 1,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Icon name={iconName} size={18} color={colors.iconColor} />
              </View>
              <View style={styles.deploymentInfo}>
                <Text style={[styles.itemTitle, { color: colors.textColor }]}>
                  {item.name}
                </Text>
                <View style={styles.deploymentMeta}>
                  <Text
                    style={{
                      color: colors.textColor,
                      fontSize: 12,
                      marginRight: 6,
                      opacity: 0.8,
                    }}
                  >
                    {item.deploymentType.toUpperCase()}
                  </Text>
                </View>
              </View>
              {deployment?.id === item.id && (
                <Icon name="checkmark" size={20} color={colors.iconColor} />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        style={{ backgroundColor: theme.colors.background }}
      />
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case "team":
        return renderTeams();
      case "project":
        return renderProjects();
      case "deployment":
        return renderDeployments();
      default:
        return null;
    }
  };

  // Dynamic title based on step
  const title =
    currentStep === "team"
      ? "Teams"
      : currentStep === "project"
        ? "Projects"
        : "Deployments";

  // Back button for header left (only show when not on first step)
  const headerLeft =
    currentStep !== "team" ? (
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Icon
          name="chevron-back"
          size={24}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    ) : undefined;

  return (
    <BaseSheet
      sheetRef={sheetRef}
      onClose={handleSheetClose}
      size="list"
      itemCount={currentItemCount}
      isLoading={currentIsLoading}
      title={title}
      headerLeft={headerLeft}
      rawContent
    >
      {renderContent()}
    </BaseSheet>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  deploymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  deploymentInfo: {
    flex: 1,
  },
  deploymentMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  errorDetail: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
