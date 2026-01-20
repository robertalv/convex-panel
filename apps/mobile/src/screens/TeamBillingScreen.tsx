import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useAuth } from "../contexts/AuthContext";
import { useTeamSubscription } from "../hooks/useBigBrain";
import { Icon } from "../components/ui/Icon";
import { TeamTierBadge } from "../components/ui/TeamTierBadge";
import { planNameMap, isFreePlan } from "../utils/getPlanInfo";
import { PlansList } from "../components/billing/PlansList";

export default function TeamBillingScreen() {
  const { theme } = useTheme();
  const { team } = useDeployment();
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;

  const { data: teamSubscription, isLoading } = useTeamSubscription(
    accessToken,
    team?.id ?? null,
  );

  const handlePlanSelect = (planId: string) => {
    if (!team) return;

    const billingUrl = `https://dashboard.convex.dev/t/${team.slug}/settings/billing?upgradePlan=${planId}`;
    Linking.openURL(billingUrl);
  };

  if (!team) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Icon name="card" size={48} color={theme.colors.textSecondary} />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No team selected
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView style={styles.scrollView}>
        {/* Subscription Card */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Current Plan
          </Text>

          {isLoading ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, { color: theme.colors.text }]}>
                    {planNameMap[teamSubscription?.plan?.planType ?? "CONVEX_BASE"]} Plan
                  </Text>
                  {teamSubscription?.plan?.name && (
                    <Text
                      style={[
                        styles.planDescription,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {planNameMap[teamSubscription?.plan?.planType ?? "CONVEX_BASE"] || teamSubscription.plan.name}
                    </Text>
                  )}
                </View>
                <TeamTierBadge subscription={teamSubscription ?? null} />
              </View>

              {isFreePlan(teamSubscription?.plan?.planType ?? "CONVEX_BASE") && (
                <>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                  <View style={styles.upgradePromo}>
                    <Icon
                      name="rocket"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <View style={styles.upgradeText}>
                      <Text
                        style={[
                          styles.upgradeTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        Upgrade for more features
                      </Text>
                      <Text
                        style={[
                          styles.upgradeDescription,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Get higher limits, better performance, and priority
                        support
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Plans List */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Available Plans
          </Text>
          <PlansList
            teamId={team.id}
            teamSlug={team.slug}
            onPlanSelect={handlePlanSelect}
          />
        </View>

        {/* Features/Info */}
        <View style={styles.section}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.infoRow}>
              <Icon
                name="information-circle"
                size={20}
                color={theme.colors.info}
              />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                Plan features and pricing details are available on the{" "}
                <Text
                  style={{ color: theme.colors.primary, fontWeight: "600" }}
                >
                  Convex website
                </Text>
                .
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Quick Links
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL("https://convex.dev/plans")}
              activeOpacity={0.6}
            >
              <Icon name="card" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.linkText, { color: theme.colors.text }]}>
                View all plans
              </Text>
              <Icon
                name="open-outline"
                size={18}
                color={theme.colors.textSecondary}
                style={styles.linkIcon}
              />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() =>
                Linking.openURL("https://docs.convex.dev/production/plans")
              }
              activeOpacity={0.6}
            >
              <Icon name="book" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.linkText, { color: theme.colors.text }]}>
                Plans documentation
              </Text>
              <Icon
                name="open-outline"
                size={18}
                color={theme.colors.textSecondary}
                style={styles.linkIcon}
              />
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => Linking.openURL("mailto:support@convex.dev")}
              activeOpacity={0.6}
            >
              <Icon name="mail" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.linkText, { color: theme.colors.text }]}>
                Contact support
              </Text>
              <Icon
                name="open-outline"
                size={18}
                color={theme.colors.textSecondary}
                style={styles.linkIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: -32,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  upgradePromo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  upgradeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  upgradeButtonHint: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  linkIcon: {
    marginLeft: "auto",
  },
});
