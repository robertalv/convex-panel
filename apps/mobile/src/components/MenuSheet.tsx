import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "./ui/Icon";
import { TierBadge } from "./ui/TierBadge";
import { TeamTierBadge } from "./ui/TeamTierBadge";
import { BaseSheet } from "./sheets/BaseSheet";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useDeployment } from "../contexts/DeploymentContext";
import { useIsProUser } from "../hooks/useIsProUser";
import { useTeamSubscription } from "../hooks/useBigBrain";

interface MenuSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  closeSheet: () => void;
  onClose?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: React.ReactNode;
  onPress: () => void;
  showDivider?: boolean;
}

export function MenuSheet({ sheetRef, closeSheet, onClose }: MenuSheetProps) {
  const { theme } = useTheme();
  const { session, logout } = useAuth();
  const { team, clearSelection } = useDeployment();
  const { isPro } = useIsProUser();
  const navigation = useNavigation();

  // Fetch team subscription
  const accessToken = session?.accessToken ?? null;
  const { data: teamSubscription } = useTeamSubscription(
    accessToken,
    team?.id ?? null,
  );

  const userInfoHeight = session?.profile ? 80 : 0;

  const handleHomePress = () => {
    closeSheet();
    setTimeout(() => {
      clearSelection();
      (navigation as any).navigate("Dashboard");
    }, 300);
  };

  const menuItems: MenuItem[] = [
    // TODO: Add when the rest of the components are created
    // {
    //   id: "subscription",
    //   label: "Subscription",
    //   icon: "rocket",
    //   badge: (
    //     <TierBadge tier={isPro ? "pro" : "free"} size="sm" showIcon={false} />
    //   ),
    //   onPress: () => {
    //     closeSheet();
    //     setTimeout(() => {
    //       (navigation as any).navigate("Subscription");
    //     }, 300);
    //   },
    //   showDivider: true,
    // },
    {
      id: "account",
      label: "Account",
      icon: "user",
      onPress: () => {
        closeSheet();
        setTimeout(() => {
          (navigation as any).navigate("Account");
        }, 300);
      },
    },
    ...(team
      ? [
          {
            id: "team",
            label: "Team",
            icon: "people",
            badge: (
              <View style={styles.teamBadgeContainer}>
                <Text style={[styles.teamName, { color: theme.colors.text }]}>
                  {team.name}
                </Text>
                <TeamTierBadge
                  subscription={teamSubscription ?? null}
                  size="sm"
                />
              </View>
            ),
            onPress: () => {
              closeSheet();
              setTimeout(() => {
                (navigation as any).navigate("Team");
              }, 300);
            },
          } as MenuItem,
        ]
      : []),
    {
      id: "logout",
      label: "Logout",
      icon: "logout",
      onPress: () => {
        closeSheet();
        setTimeout(async () => {
          await logout();
        }, 300);
      },
      showDivider: true,
    },
  ];

  const headerLeft = (
    <TouchableOpacity
      style={styles.homeButton}
      onPress={handleHomePress}
      activeOpacity={0.7}
    >
      <Text style={[styles.homeButtonText, { color: theme.colors.primary }]}>
        Home
      </Text>
    </TouchableOpacity>
  );

  return (
    <BaseSheet
      sheetRef={sheetRef}
      onClose={onClose}
      size="list"
      itemCount={menuItems.length}
      additionalHeight={userInfoHeight}
      showHeader
      title="Menu"
      headerLeft={headerLeft}
    >
      {session?.profile && (
        <View
          style={[
            styles.userInfo,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.userInfoRow}>
            <Icon name="user" size={24} color={theme.colors.textSecondary} />
            <View style={styles.userInfoText}>
              {session.profile.name && (
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {session.profile.name}
                </Text>
              )}
              {session.profile.email && (
                <Text
                  style={[
                    styles.userEmail,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {session.profile.email}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Menu Items */}
      <ScrollView style={styles.menuList}>
        {menuItems.map((item, index) => {
          const isLogout = item.id === "logout";
          const iconColor = isLogout ? "#EF4444" : theme.colors.textSecondary;
          const textColor = isLogout ? "#EF4444" : theme.colors.text;
          const chevronColor = isLogout ? "#EF4444" : theme.colors.textSecondary;

          return (
            <React.Fragment key={item.id}>
              {item.showDivider && (
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: theme.colors.border,
                      marginTop: 8,
                      marginBottom: 0,
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  color={iconColor}
                />
                <Text
                  style={[styles.menuItemLabel, { color: textColor }]}
                >
                  {item.label}
                </Text>
                {item.badge && (
                  <View style={styles.menuItemBadge}>{item.badge}</View>
                )}
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={chevronColor}
                  style={styles.menuItemChevron}
                />
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </BaseSheet>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  userInfo: {
    marginHorizontal: 8,
    marginTop: 16,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userInfoText: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
  },
  menuList: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    flex: 1,
  },
  menuItemBadge: {
    marginLeft: "auto",
  },
  menuItemChevron: {
    marginLeft: 8,
  },
  teamBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 8,
  },
});
