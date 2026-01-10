/**
 * Dashboard Stack Navigator
 *
 * Stack navigation for dashboard screens
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { DeploymentHeader } from "../components/DeploymentHeader";
import type { DashboardStackParamList } from "../types";

// Import health hooks
import { useHealthMetrics } from "../features/dashboard/hooks/useHealthMetrics";
import { useFunctionHealth } from "../features/dashboard/hooks/useFunctionHealth";
import { useFunctionActivity } from "../features/dashboard/hooks/useFunctionActivity";
import { useInsights } from "../features/dashboard/hooks/useInsights";

// Import card components
import { FailureRateCard } from "../features/dashboard/components/FailureRateCard";
import { CacheHitRateCard } from "../features/dashboard/components/CacheHitRateCard";
import { SchedulerLagCard } from "../features/dashboard/components/SchedulerLagCard";
import { LatencyCard } from "../features/dashboard/components/LatencyCard";
import { RequestRateCard } from "../features/dashboard/components/RequestRateCard";
import { TopErrorsCard } from "../features/dashboard/components/TopErrorsCard";
import { SlowestFunctionsCard } from "../features/dashboard/components/SlowestFunctionsCard";
import { TopFunctionsCard } from "../features/dashboard/components/TopFunctionsCard";
import { FunctionActivityCard } from "../features/dashboard/components/FunctionActivityCard";
import { InsightsSummaryCard } from "../features/dashboard/components/InsightsSummaryCard";

const Stack = createNativeStackNavigator<DashboardStackParamList>();

// Dashboard Overview Screen with all health cards
function DashboardOverviewScreen() {
  const { theme } = useTheme();
  const { session } = useAuth();
  const { deployment } = useDeployment();
  const [refreshing, setRefreshing] = React.useState(false);

  // FIXED: Call all hooks unconditionally, but disable queries when no deployment
  const hasDeployment = Boolean(deployment);
  const healthMetrics = useHealthMetrics();
  const functionHealth = useFunctionHealth();
  const functionActivity = useFunctionActivity();
  const insights = useInsights();

  // FIXED: Move useCallback before early return to maintain consistent hook order
  const onRefresh = React.useCallback(async () => {
    if (!hasDeployment) return;
    
    setRefreshing(true);
    try {
      // Refetch all data
      await Promise.all([
        healthMetrics.refetch(),
        functionHealth.refetch(),
        functionActivity.refetch(),
        insights.refetch(),
      ]);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  }, [hasDeployment, healthMetrics, functionHealth, functionActivity, insights]);

  // Show empty state when no deployment is selected
  if (!hasDeployment) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView>
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Welcome, {session?.profile?.name || "User"}!
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              Select a deployment to view health metrics
            </Text>
            <View
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                No Deployment Selected
              </Text>
              <Text
                style={[styles.cardText, { color: theme.colors.textSecondary }]}
              >
                Please select a deployment from the deployments list to view
                health metrics and insights.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
        contentContainerStyle={styles.content}
      >
        {/* Metric Cards */}
        <FailureRateCard />
        <CacheHitRateCard />
        <SchedulerLagCard />
        <LatencyCard />
        <RequestRateCard />

        {/* Function Cards */}
        <TopErrorsCard />
        <SlowestFunctionsCard />
        <TopFunctionsCard />
        <FunctionActivityCard />

        {/* Insights */}
        <InsightsSummaryCard />

        {/* Bottom padding for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function DashboardStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen
        name="DashboardOverview"
        component={DashboardOverviewScreen}
        options={{
          header: () => <DeploymentHeader />,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 24,
  },
});
