import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useAuth } from "../contexts/AuthContext";
import { useTeamSubscription } from "../hooks/useBigBrain";
import { Icon } from "../components/ui/Icon";
import { TeamTierBadge } from "../components/ui/TeamTierBadge";
import { useNavigation } from "@react-navigation/native";
import { isFreePlan } from "../utils/getPlanInfo";

export default function TeamScreen() {
  const { theme } = useTheme();
  const { team, project, deployment } = useDeployment();
  const { session } = useAuth();
  const navigation = useNavigation();

  const accessToken = session?.accessToken ?? null;
  const { data: teamSubscription } = useTeamSubscription(
    accessToken,
    team?.id ?? null,
  );

  if (!team) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.emptyContainer}>
          <Icon name="people" size={48} color={theme.colors.textSecondary} />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No team selected
          </Text>
          <Text
            style={[styles.emptySubtext, { color: theme.colors.textTertiary }]}
          >
            Select a team from the deployment selector
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
        {/* Team Info Cards */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Team Information
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
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Team ID
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {team.id}
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Team Slug
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {team.slug}
              </Text>
            </View>

            {team.referralCode && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Referral Code
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.text }]}
                  >
                    {team.referralCode}
                  </Text>
                </View>
              </>
            )}

            {team.suspended && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Status
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: theme.colors.error + "20" },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: theme.colors.error }]}
                    >
                      Suspended
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
          >
            Subscription
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
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Current Plan
              </Text>
              <TeamTierBadge
                subscription={teamSubscription ?? null}
                size="sm"
              />
            </View>

            {isFreePlan(teamSubscription?.plan?.planType ?? "CONVEX_BASE") && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => {
                    (navigation as any).navigate("TeamBilling");
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="rocket" size={20} color={theme.colors.primary} />
                  <Text
                    style={[
                      styles.upgradeButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Upgrade Plan
                  </Text>
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.primary}
                    style={styles.upgradeButtonIcon}
                  />
                </TouchableOpacity>
              </>
            )}

            {!isFreePlan(teamSubscription?.plan?.planType ?? "CONVEX_BASE") && (
              <>
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => {
                    (navigation as any).navigate("TeamBilling");
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.manageButtonText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Manage Billing
                  </Text>
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Current Context */}
        {(project || deployment) && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Current Context
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
              {project && (
                <>
                  <View style={styles.infoRow}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Project
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.colors.text }]}
                    >
                      {project.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                </>
              )}

              {deployment && (
                <View style={styles.infoRow}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Deployment
                  </Text>
                  <View style={styles.deploymentInfo}>
                    <Text
                      style={[styles.infoValue, { color: theme.colors.text }]}
                    >
                      {deployment.name}
                    </Text>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            deployment.deploymentType === "prod"
                              ? theme.colors.success + "20"
                              : deployment.deploymentType === "dev"
                                ? theme.colors.warning + "20"
                                : theme.colors.info + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          {
                            color:
                              deployment.deploymentType === "prod"
                                ? theme.colors.success
                                : deployment.deploymentType === "dev"
                                  ? theme.colors.warning
                                  : theme.colors.info,
                          },
                        ]}
                      >
                        {deployment.deploymentType}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  teamSlug: {
    fontSize: 16,
    fontWeight: "500",
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  deploymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  upgradeButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  upgradeButtonIcon: {
    marginLeft: "auto",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
