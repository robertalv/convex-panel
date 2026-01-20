/**
 * Deployment Sheet Sidebar Menu
 *
 * Left sidebar menu for deployment sheet with additional options
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "./ui/Icon";
import { TierBadge } from "./ui/TierBadge";
import { useTheme } from "../contexts/ThemeContext";
import { useIsProUser } from "../hooks/useIsProUser";

export type MenuSection = "deployments" | "team" | "subscription";

interface DeploymentSheetSidebarProps {
  activeSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
}

export function DeploymentSheetSidebar({
  activeSection,
  onSectionChange,
}: DeploymentSheetSidebarProps) {
  const { theme } = useTheme();
  const { isPro } = useIsProUser();

  const menuItems: Array<{
    id: MenuSection;
    icon: string;
    label: string;
    badge?: React.ReactNode;
  }> = [
    {
      id: "deployments",
      icon: "signal",
      label: "Deployments",
    },
    {
      id: "team",
      icon: "people",
      label: "Team",
    },
    {
      id: "subscription",
      icon: "rocket",
      label: "Pro",
      badge: (
        <TierBadge tier={isPro ? "pro" : "free"} size="sm" showIcon={false} />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.colors.surface,
          borderRightColor: theme.colors.border,
        },
      ]}
    >
      {menuItems.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              isActive && {
                backgroundColor: `${theme.colors.primary}20`,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary,
              },
            ]}
            onPress={() => onSectionChange(item.id)}
            activeOpacity={0.6}
          >
            <Icon
              name={item.icon}
              size={22}
              color={
                isActive ? theme.colors.primary : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.menuLabel,
                {
                  color: isActive
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.badge && <View style={styles.badge}>{item.badge}</View>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 90,
    paddingTop: 8,
    borderRightWidth: 1,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  badge: {
    marginTop: 2,
  },
});
