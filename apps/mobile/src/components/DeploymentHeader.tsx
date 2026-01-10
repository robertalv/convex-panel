/**
 * Deployment Header Component
 *
 * Custom header that displays current deployment selection and opens bottom sheet
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useDeploymentSheet } from "../contexts/DeploymentSheetContext";
import { Icon } from "./ui/Icon";

export function DeploymentHeader() {
  const { theme } = useTheme();
  const { team, project, deployment } = useDeployment();
  const { openSheet } = useDeploymentSheet();

  // Get display text
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

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={openSheet}
        activeOpacity={0.7}
      >
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {getDisplayText()}
            </Text>
            <Icon
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
