/**
 * Referral Banner Component
 *
 * Shows referral progress and allows copying referral link.
 * Matches the web dashboard design - clean and minimal.
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Icon } from "./ui/Icon";
import { useTheme } from "../contexts/ThemeContext";
import type { ReferralState, Team } from "../types";

interface ReferralBannerProps {
  team: Team;
  referralState: ReferralState | null;
  onHide?: () => void;
}

export function ReferralBanner({
  team,
  referralState,
  onHide,
}: ReferralBannerProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(false);

  const referralCode = team.referralCode || referralState?.referralCode;
  const referralsCount = referralState?.referrals?.length ?? 0;
  const referralsComplete = referralsCount >= 5;
  const referralUrl = `https://convex.dev/referral/${referralCode}`;

  const handleCopy = useCallback(async () => {
    if (!referralCode) return;

    try {
      await Clipboard.setStringAsync(referralUrl);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [referralCode, referralUrl]);

  if (!referralCode) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Text and copy button */}
        <View style={styles.mainContent}>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            Boost your resource usage limits by up to 5x by sharing your
            referral code
          </Text>

          {/* Copy button */}
          <TouchableOpacity
            style={[
              styles.copyButton,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.urlText, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {referralUrl}
            </Text>
            <View style={styles.copyIconContainer}>
              {copied ? (
                <Text
                  style={[styles.copiedText, { color: theme.colors.success }]}
                >
                  Copied!
                </Text>
              ) : (
                <Icon
                  name="copy"
                  size={14}
                  color={theme.colors.textSecondary}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Progress section */}
        <View style={styles.progressSection}>
          {!referralsComplete ? (
            <>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(referralsCount / 5) * 100}%`,
                      backgroundColor: theme.colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                {referralsCount}/5 referral boosts applied
              </Text>
            </>
          ) : (
            <Text style={[styles.completeText, { color: theme.colors.text }]}>
              🎉 Congrats, your app limits have been boosted 5 times!
            </Text>
          )}
        </View>
      </View>

      {/* Menu button */}
      {onHide && (
        <TouchableOpacity onPress={onHide} style={styles.menuButton}>
          <Icon
            name="ellipsis-vertical"
            size={16}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    gap: 8,
    paddingVertical: 8,
  },
  mainContent: {
    flexDirection: "column",
    gap: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignSelf: "flex-start",
  },
  urlText: {
    fontSize: 12,
  },
  copyIconContainer: {
    minWidth: 44,
    alignItems: "flex-end",
  },
  copiedText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressSection: {
    gap: 4,
  },
  progressBar: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  completeText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
});
