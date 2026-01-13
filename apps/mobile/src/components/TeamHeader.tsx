/**
 * Team Header Component
 *
 * Custom header for Team screen showing team name, tier badge, and menu
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useAuth } from "../contexts/AuthContext";
import { useSheet } from "../contexts/SheetContext";
import { useTeamSubscription } from "../hooks/useBigBrain";
import { AppHeader } from "./AppHeader";
import { TeamTierBadge } from "./ui/TeamTierBadge";
import { Icon } from "./ui/Icon";

interface TeamHeaderProps {
  showBackButton?: boolean;
}

export function TeamHeader({ showBackButton = false }: TeamHeaderProps) {
  const { theme } = useTheme();
  const { team } = useDeployment();
  const { session } = useAuth();
  const { openSheet } = useSheet();
  const navigation = useNavigation();

  const accessToken = session?.accessToken ?? null;
  const { data: teamSubscription } = useTeamSubscription(
    accessToken,
    team?.id ?? null,
  );

  const handleOpenMenuSheet = () => openSheet("menu");
  const handleBack = () => (navigation as any).navigate("Team");

  // Show back button if requested
  if (showBackButton) {
    const leftContent = (
      <View style={styles.backContent}>
        <Icon name="chevron-back" size={20} color={theme.colors.primary} />
        <Text
          style={[styles.backText, { color: theme.colors.primary }]}
          numberOfLines={1}
        >
          Team
        </Text>
      </View>
    );

    return (
      <AppHeader
        title="Back to Team"
        titleColor={theme.colors.primary}
        leftContent={leftContent}
        onTitlePress={handleBack}
        actions={[
          {
            icon: "more-vertical",
            onPress: handleOpenMenuSheet,
          },
        ]}
      />
    );
  }

  // Custom left content with team name and badge
  const leftContent = team ? (
    <View style={styles.leftContent}>
      <Text
        style={[styles.teamName, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {team.name}
      </Text>
      <TeamTierBadge subscription={teamSubscription ?? null} size="sm" />
    </View>
  ) : null;

  return (
    <AppHeader
      title={team?.name || "Team"}
      leftContent={leftContent}
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
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: "600",
  },
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
