import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "./ui/Icon";

export interface AppHeaderAction {
  icon: string;
  onPress: () => void;
  badge?: number;
  isActive?: boolean;
  color?: string;
}

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onTitlePress?: () => void;
  showChevron?: boolean;
  chevronDirection?: "up" | "down";
  leftContent?: React.ReactNode;
  actions?: AppHeaderAction[];
  titleColor?: string;
  subtitleColor?: string;
}

export function AppHeader({
  title,
  subtitle,
  onTitlePress,
  showChevron = false,
  chevronDirection = "down",
  leftContent,
  actions = [],
  titleColor,
  subtitleColor,
}: AppHeaderProps) {
  const { theme, isDark } = useTheme();

  const renderLeftContent = () => {
    if (leftContent) {
      if (onTitlePress) {
        return (
          <TouchableOpacity
            style={styles.leftContentContainer}
            onPress={onTitlePress}
            activeOpacity={0.7}
          >
            {leftContent}
          </TouchableOpacity>
        );
      }
      return <View style={styles.leftContentContainer}>{leftContent}</View>;
    }

    const content = (
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: titleColor || theme.colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {showChevron && (
            <Icon
              name={chevronDirection === "up" ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textSecondary}
            />
          )}
        </View>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: subtitleColor || theme.colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    );

    if (onTitlePress) {
      return (
        <TouchableOpacity
          style={styles.leftContentContainer}
          onPress={onTitlePress}
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return <View style={styles.leftContentContainer}>{content}</View>;
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View
        style={[
          styles.blurContainer,
          {
            backgroundColor: isDark
              ? "rgba(30, 28, 26, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <View style={styles.content}>
          {renderLeftContent()}
          {actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.iconButton}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconButtonContainer}>
                    <Icon
                      name={action.icon}
                      size={action.icon === "more-vertical" ? 20 : 18}
                      color={
                        action.color ||
                        (action.isActive
                          ? theme.colors.primary
                          : action.icon === "more-vertical"
                            ? theme.colors.textSecondary
                            : theme.colors.text)
                      }
                    />
                    {action.badge !== undefined && action.badge > 0 && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.background,
                          },
                        ]}
                      >
                        <Text style={styles.badgeText}>{action.badge}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: 0,
  },
  blurContainer: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 44,
    position: "relative",
  },
  leftContentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
