import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useSheet } from "../contexts/SheetContext";
import { AppHeader } from "./AppHeader";
import { Icon } from "./ui/Icon";

export function DeploymentHeader() {
  const { theme } = useTheme();
  const { team, project, deployment, setProject, clearSelection } =
    useDeployment();
  const { openSheet } = useSheet();

  const handleOpenDeploymentSheet = () => openSheet("deployment");
  const handleOpenMenuSheet = () => openSheet("menu");

  const showBackToProjects = project && !deployment;
  const showBackToTeams = team && !project && !deployment;
  const showBackButton = showBackToProjects || showBackToTeams;

  const getDisplayText = () => {
    if (deployment) {
      return deployment.name;
    }
    if (project) {
      return project.name;
    }
    if (team) {
      return team.name;
    }
    return "Select Deployment";
  };

  const getSubtitle = () => {
    const parts: string[] = [];
    if (team) parts.push(team.name);
    if (project) parts.push(project.name);
    if (deployment) parts.push(deployment.name);
    return parts.length > 1 ? parts.slice(0, -1).join(" / ") : "";
  };

  const subtitle = getSubtitle();

  const handleBackPress = () => {
    if (showBackToProjects) {
      setProject(null);
    } else if (showBackToTeams) {
      clearSelection();
    }
  };

  const backButtonText = showBackToProjects
    ? "Back to projects"
    : "Back to teams";

  if (showBackButton) {
    const leftContent = (
      <View style={styles.backContent}>
        <Icon name="chevron-back" size={20} color={theme.colors.primary} />
        <Text
          style={[styles.backText, { color: theme.colors.primary }]}
          numberOfLines={1}
        >
          {backButtonText}
        </Text>
      </View>
    );

    return (
      <AppHeader
        title={backButtonText}
        titleColor={theme.colors.primary}
        leftContent={leftContent}
        onTitlePress={handleBackPress}
        actions={[
          {
            icon: "more-vertical",
            onPress: handleOpenMenuSheet,
          },
        ]}
      />
    );
  }

  return (
    <AppHeader
      title={getDisplayText()}
      subtitle={subtitle}
      showChevron={true}
      onTitlePress={handleOpenDeploymentSheet}
      actions={[
        {
          icon: "more-vertical",
          onPress: handleOpenMenuSheet,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  backContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
