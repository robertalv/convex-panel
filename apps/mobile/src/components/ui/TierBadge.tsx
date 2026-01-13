/**
 * TierBadge Component
 *
 * Displays a badge indicating the user's Mobile Pro subscription tier
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "../../contexts/ThemeContext";

export interface TierBadgeProps {
  /**
   * User's subscription tier
   * @default "free"
   */
  tier?: "free" | "pro";

  /**
   * Badge size
   * @default "md"
   */
  size?: "sm" | "md";

  /**
   * Show icon
   * @default true
   */
  showIcon?: boolean;
}

/**
 * Badge component that displays user's subscription tier
 *
 * @example
 * ```tsx
 * import { TierBadge } from '../components/ui/TierBadge';
 *
 * // Show Pro badge
 * <TierBadge tier="pro" />
 *
 * // Show Free badge
 * <TierBadge tier="free" />
 *
 * // Small size without icon
 * <TierBadge tier="pro" size="sm" showIcon={false} />
 * ```
 */
export function TierBadge({
  tier = "free",
  size = "md",
  showIcon = true,
}: TierBadgeProps) {
  const { theme } = useTheme();

  const isPro = tier === "pro";
  const iconSize = size === "sm" ? 12 : 14;
  const fontSize = size === "sm" ? 11 : 13;
  const paddingVertical = size === "sm" ? 3 : 4;
  const paddingHorizontal = size === "sm" ? 6 : 8;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isPro
            ? `${theme.colors.primary}20`
            : theme.colors.surface,
          borderColor: isPro ? theme.colors.primary : theme.colors.border,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      {showIcon && isPro && (
        <Icon
          name="rocket"
          size={iconSize}
          color={theme.colors.primary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: isPro ? theme.colors.primary : theme.colors.textSecondary,
            fontSize,
          },
        ]}
      >
        {isPro ? "Pro" : "Free"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
