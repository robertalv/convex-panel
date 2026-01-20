/**
 * PlanCard Component
 *
 * Displays a single plan with pricing, features, and action button
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { PlanResponse } from "../../api/billing";

interface PlanCardProps {
  plan: PlanResponse;
  isCurrentPlan: boolean;
  onSelectPlan?: () => void;
  disabled?: boolean;
}

const PLAN_FEATURES: Record<string, string[]> = {
  CONVEX_BASE: [
    "For hobbyists and prototypes",
    "Up to 6 team members",
    "Up to 40 deployments",
    "Projects disabled after exceeding monthly usage limit",
    "Community-driven support on Discord",
  ],
  CONVEX_STARTER_PLUS: [
    "Everything in Free",
    "Unlocks usage-based pricing to pay as you go",
    "Community-driven support on Discord",
    "Perfect for small teams that want to pay for resources as they go",
  ],
  CONVEX_PROFESSIONAL: [
    "Everything in Starter",
    "120 deployments",
    "Higher included usage limits",
    "Usage-based pricing applies for usage above included limits",
    "Better performance",
    "Email support",
    "...and more!",
  ],
  CONVEX_BUSINESS: [
    "Everything in Professional",
    "Unlimited deployments",
    "Enterprise-grade support",
    "Custom usage limits",
    "Dedicated account manager",
    "SLA guarantees",
  ],
};

const PLAN_NAMES: Record<string, string> = {
  CONVEX_BASE: "Free",
  CONVEX_STARTER_PLUS: "Starter",
  CONVEX_PROFESSIONAL: "Professional",
  CONVEX_BUSINESS: "Business",
};

export function PlanCard({
  plan,
  isCurrentPlan,
  onSelectPlan,
  disabled = false,
}: PlanCardProps) {
  const { theme } = useTheme();
  const planType = plan.planType || "CONVEX_BASE";
  const planName = PLAN_NAMES[planType] || plan.name;
  const features = PLAN_FEATURES[planType] || [];

  // Get the monthly price if available
  const monthlyPrice = plan.prices?.find((p) => p.billingCadence === "monthly");

  const getPriceDisplay = () => {
    if (planType === "CONVEX_BASE") {
      return "No credit card required";
    }
    if (plan.seatPrice) {
      return `$${plan.seatPrice} per member, per month`;
    }
    if (monthlyPrice) {
      const priceInDollars = (monthlyPrice.unitPrice / 100).toFixed(2);
      return `$${priceInDollars}/month`;
    }
    return "Usage-based pricing";
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isCurrentPlan
            ? theme.colors.primary
            : theme.colors.border,
        },
        isCurrentPlan && styles.currentPlanBorder,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.planName, { color: theme.colors.text }]}>
          {planName}
        </Text>
        <Text style={[styles.priceText, { color: theme.colors.textSecondary }]}>
          {getPriceDisplay()}
        </Text>
        {plan.description && (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
          >
            {plan.description}
          </Text>
        )}
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text
              style={[styles.bullet, { color: theme.colors.textSecondary }]}
            >
              •
            </Text>
            <Text
              style={[
                styles.featureText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionContainer}>
        {isCurrentPlan ? (
          <View
            style={[
              styles.currentPlanLabel,
              { backgroundColor: theme.colors.primary + "20" },
            ]}
          >
            <Text
              style={[styles.currentPlanText, { color: theme.colors.primary }]}
            >
              Current Plan
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor:
                  planType === "CONVEX_PROFESSIONAL"
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor: theme.colors.border,
              },
              disabled && styles.selectButtonDisabled,
            ]}
            onPress={onSelectPlan}
            disabled={disabled || !onSelectPlan}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectButtonText,
                {
                  color:
                    planType === "CONVEX_PROFESSIONAL"
                      ? "#FFFFFF"
                      : theme.colors.text,
                },
              ]}
            >
              {planType === "CONVEX_BASE" ? "Downgrade to Free" : "Select Plan"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  currentPlanBorder: {
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 8,
  },
  currentPlanLabel: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  currentPlanText: {
    fontSize: 15,
    fontWeight: "600",
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
