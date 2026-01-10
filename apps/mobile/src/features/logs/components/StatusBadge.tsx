/**
 * StatusBadge - Displays status with animated dot indicator
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const getStatusColors = () => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "success") {
      return {
        bg: "rgba(16, 185, 129, 0.1)",
        text: "#34D399",
        border: "rgba(16, 185, 129, 0.2)",
        dot: "#34D399",
      };
    } else if (normalizedStatus === "error" || normalizedStatus === "failure") {
      return {
        bg: "rgba(239, 68, 68, 0.1)",
        text: "#F87171",
        border: "rgba(239, 68, 68, 0.2)",
        dot: "#F87171",
      };
    } else if (normalizedStatus === "warning") {
      return {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#FBBF24",
        border: "rgba(245, 158, 11, 0.2)",
        dot: "#FBBF24",
      };
    }
    return {
      bg: "rgba(59, 130, 246, 0.1)",
      text: "#60A5FA",
      border: "rgba(59, 130, 246, 0.2)",
      dot: "#60A5FA",
    };
  };

  const colors = getStatusColors();
  const text = status.charAt(0).toUpperCase() + status.slice(1);
  const sizeStyles = size === "sm" ? styles.badgeSm : styles.badgeMd;

  return (
    <View
      style={[
        styles.badge,
        sizeStyles,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: colors.dot,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    gap: 6,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
