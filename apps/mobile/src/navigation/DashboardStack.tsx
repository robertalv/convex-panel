import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon } from "../components/ui/Icon";
import { Avatar } from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { DeploymentHeader } from "../components/DeploymentHeader";
import { ReferralBanner } from "../components/ReferralBanner";
import {
  useTeams,
  useProjects,
  useDeployments,
  useTeamReferralState,
} from "../hooks/useBigBrain";
import { getDeploymentIcon, getDeploymentColors } from "../utils";
import type {
  DashboardStackParamList,
  Team,
  Project,
  Deployment,
} from "../types";

import { useHealthMetrics } from "../features/dashboard/hooks/useHealthMetrics";
import { useFunctionHealth } from "../features/dashboard/hooks/useFunctionHealth";
import { useFunctionActivity } from "../features/dashboard/hooks/useFunctionActivity";
import { useInsights } from "../features/dashboard/hooks/useInsights";
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

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Stack = createNativeStackNavigator<DashboardStackParamList>();

function TeamsProjectsView() {
  const { theme } = useTheme();
  const { session } = useAuth();
  const {
    team,
    project,
    setTeam,
    setProject,
    setDeployment,
    prefetchDashboardData,
  } = useDeployment();
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  const accessToken = session?.accessToken ?? null;

  const selectedTeamId = team?.id ?? null;
  const selectedProjectId = project?.id ?? null;

  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    refetch: refetchTeams,
  } = useTeams(accessToken);

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
  } = useProjects(accessToken, selectedTeamId);

  const {
    data: deployments = [],
    isLoading: isLoadingDeployments,
    refetch: refetchDeployments,
  } = useDeployments(accessToken, selectedProjectId);

  const { data: referralState } = useTeamReferralState(
    accessToken,
    selectedTeamId || teams[0]?.id || null,
  );

  const selectedTeam = team || teams[0];
  const selectedProject = project;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchTeams();
      if (selectedTeamId) {
        await refetchProjects();
      }
      if (selectedProjectId) {
        await refetchDeployments();
      }
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [
    refetchTeams,
    refetchProjects,
    refetchDeployments,
    selectedTeamId,
    selectedProjectId,
  ]);

  const handleSelectTeam = React.useCallback(
    (selectedTeam: Team) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTeam(selectedTeam);
    },
    [setTeam],
  );

  const handleSelectProject = React.useCallback(
    (project: Project) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setProject(project);
    },
    [setProject],
  );

  const handleSelectDeployment = React.useCallback(
    (deployment: Deployment) => {
      setDeployment(deployment);

      // Prefetch dashboard data in the background
      if (accessToken) {
        prefetchDashboardData(deployment, accessToken).catch((error) => {
          console.error("Failed to prefetch dashboard data:", error);
        });
      }
    },
    [setDeployment, accessToken, prefetchDashboardData],
  );

  const renderTeams = () => {
    if (isLoadingTeams) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (teams.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="people" size={48} color={theme.colors.textSecondary} />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No teams found
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Your Teams
        </Text>
        {teams.map((item: Team) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSelectTeam(item)}
            activeOpacity={0.7}
          >
            <Avatar name={item.name} hashKey={item.id} />
            <View style={styles.listItemContent}>
              <Text
                style={[styles.listItemTitle, { color: theme.colors.text }]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.listItemSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Tap to view projects
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderProjects = () => {
    if (isLoadingProjects) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (projects.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon
            name="folder-open"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No projects in this team
          </Text>
        </View>
      );
    }

    return (
      <>
        {projects.map((item: Project) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSelectProject(item)}
            activeOpacity={0.7}
          >
            <Avatar name={item.name} hashKey={item.id} />
            <View style={styles.listItemContent}>
              <Text
                style={[styles.listItemTitle, { color: theme.colors.text }]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.listItemSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {item.slug}
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderDeployments = () => {
    if (isLoadingDeployments) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (deployments.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="rocket" size={48} color={theme.colors.textSecondary} />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No deployments in this project
          </Text>
        </View>
      );
    }

    return (
      <>
        {deployments.map((item: Deployment) => {
          const colors = getDeploymentColors(item.deploymentType, theme);
          const iconName = getDeploymentIcon(item);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.listItem,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={() => handleSelectDeployment(item)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.deploymentIcon,
                  {
                    backgroundColor: colors.backgroundColor,
                    borderWidth: 1,
                    borderColor: colors.borderColor,
                  },
                ]}
              >
                <Icon name={iconName} size={18} color={colors.iconColor} />
              </View>
              <View style={styles.listItemContent}>
                <Text
                  style={[styles.listItemTitle, { color: colors.textColor }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.listItemSubtitle,
                    { color: colors.textColor, opacity: 0.8 },
                  ]}
                >
                  {item.deploymentType.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const currentStep = selectedProjectId
    ? "deployment"
    : selectedTeamId
      ? "project"
      : "team";

  return (
    <SafeAreaView
      edges={[]}
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
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome, {session?.profile?.name || "User"}!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {currentStep === "team" && "Select a team to view projects"}
          {currentStep === "project" && "Select a project to view deployments"}
          {currentStep === "deployment" && "Select a deployment to continue"}
        </Text>

        {/* Referral Banner - only show on teams view */}
        {currentStep === "team" && selectedTeam && (
          <ReferralBanner
            team={selectedTeam}
            referralState={referralState ?? null}
          />
        )}

        {/* Header showing current selection */}
        {selectedTeamId && selectedTeam && (
          <View style={styles.teamHeader}>
            <Avatar
              name={selectedTeam.name}
              hashKey={selectedTeam.id}
              size={24}
            />
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text
                style={[styles.teamHeaderTitle, { color: theme.colors.text }]}
              >
                {selectedTeam.name}
              </Text>
              {selectedProject && (
                <Text
                  style={[
                    styles.listItemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {selectedProject.name}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* List content based on current step */}
        {currentStep === "team" && renderTeams()}
        {currentStep === "project" && renderProjects()}
        {currentStep === "deployment" && renderDeployments()}

        <View style={{ height: 16 + insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardOverviewScreen() {
  const { theme } = useTheme();
  const { session } = useAuth();
  const { deployment } = useDeployment();
  const hasDeployment = Boolean(deployment);
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();
  const healthMetrics = useHealthMetrics();
  const functionHealth = useFunctionHealth();
  const functionActivity = useFunctionActivity();
  const insights = useInsights();

  const onRefresh = React.useCallback(async () => {
    if (!hasDeployment) return;

    setRefreshing(true);
    try {
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
  }, [
    hasDeployment,
    healthMetrics,
    functionHealth,
    functionActivity,
    insights,
  ]);

  if (!hasDeployment) {
    return <TeamsProjectsView />;
  }

  return (
    <SafeAreaView
      edges={[]}
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
        <FailureRateCard />
        <CacheHitRateCard />
        <SchedulerLagCard />
        <LatencyCard />
        <RequestRateCard />

        <TopErrorsCard />
        <SlowestFunctionsCard />
        <TopFunctionsCard />
        <FunctionActivityCard />

        <InsightsSummaryCard />

        <View style={{ height: 16 + insets.bottom }} />
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
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 0,
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
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  listItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 4,
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 8,
    marginBottom: 12,
  },
  teamHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  deploymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
