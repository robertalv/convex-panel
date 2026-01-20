/**
 * PlansList Component
 *
 * Displays all available plans including the Free plan
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";
import { PlanCard } from "./PlanCard";
import { usePlans, useTeamSubscription } from "../../hooks/useBigBrain";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
interface PlansListProps {
  teamId: number;
  teamSlug: string;
  onPlanSelect?: (planId: string) => void;
}

const FREE_PLAN = {
  id: "CONVEX_BASE",
  name: "Free",
  planType: "CONVEX_BASE",
  description: "For hobbyists and prototypes.",
  seatPrice: 0,
  prices: [],
};

export function PlansList({ teamId, teamSlug, onPlanSelect }: PlansListProps) {
  const { session } = useAuth();
  const accessToken = session?.accessToken || null;
  const { theme } = useTheme();
  
  const { data: plansData, isLoading: isLoadingPlans } = usePlans(
    accessToken,
    teamId,
  );
  const { data: subscriptionData, isLoading: isLoadingSubscription } =
    useTeamSubscription(accessToken, teamId);

  const isLoading = isLoadingPlans || isLoadingSubscription;

  const handlePlanSelect = (planId: string) => {
    if (onPlanSelect) {
      onPlanSelect(planId);
    } else {
      const url = `https://dashboard.convex.dev/t/${teamSlug}/settings/billing?upgradePlan=${planId}`;
      Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  const currentPlanId =
    subscriptionData?.plan?.id ||
    subscriptionData?.plan?.planType ||
    "CONVEX_BASE";
  const allPlans = [FREE_PLAN, ...(plansData?.plans || [])];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {allPlans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrentPlan={
            currentPlanId === plan.id || currentPlanId === plan.planType
          }
          onSelectPlan={() => handlePlanSelect(plan.id)}
        />
      ))}

      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.footerText}>
          Need more? Contact us for enterprise plans with custom features and
          support.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
