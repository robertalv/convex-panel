/**
 * TeamTierBadge Component
 *
 * Displays a badge for Convex team subscription plans
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { getPlanInfo, type PlanType } from "../../utils/getPlanInfo";
import type { TeamSubscription } from "../../types";

export interface TeamTierBadgeProps {
  /**
   * Team subscription object from BigBrain API
   */
  subscription: TeamSubscription | null;

  /**
   * Badge size
   * @default "md"
   */
  size?: "sm" | "md";
}

/**
 * Badge component that displays team's subscription plan
 *
 * @example
 * ```tsx
 * import { TeamTierBadge } from '../components/ui/TeamTierBadge';
 *
 * // Show team subscription badge
 * <TeamTierBadge subscription={teamSubscription} />
 *
 * // Small size
 * <TeamTierBadge subscription={teamSubscription} size="sm" />
 * ```
 */
export function TeamTierBadge({
  subscription,
  size = "md",
}: TeamTierBadgeProps) {
  const { theme } = useTheme();

  // null subscription means free plan
  const planType: PlanType = subscription?.plan?.planType ?? "CONVEX_BASE";
  const { label, colorScheme } = getPlanInfo(planType);

  const fontSize = size === "sm" ? 11 : 13;
  const paddingVertical = size === "sm" ? 3 : 4;
  const paddingHorizontal = size === "sm" ? 6 : 8;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorScheme.background,
          borderColor: colorScheme.border,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colorScheme.text,
            fontSize,
          },
        ]}
      >
        {label}
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
  text: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
