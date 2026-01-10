/**
 * Device Auth Flow Component
 *
 * Shows the user code and handles the device authorization flow
 */

import React, { useEffect, useRef, ComponentType } from "react";
import {
  View as RNView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ViewProps,
  Platform,
} from "react-native";

// Fix for React 18 vs 19 type mismatch
const View = RNView as unknown as ComponentType<ViewProps>;
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../contexts/ThemeContext";
import { Theme } from "../../types";
import { ConvexLogo } from "../ui/ConvexLogo";

const AnimatedView = Animated.View as unknown as ComponentType<any>;

interface DeviceAuthFlowProps {
  userCode: string;
  onCancel: () => void;
  theme?: Theme;
}

export function DeviceAuthFlow({
  userCode,
  onCancel,
  theme: themeOverride,
}: DeviceAuthFlowProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const codeChars = userCode.split("");
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(userCode);
  };

  // Browser opening is handled in parent component

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.browserOpenedBadge,
            {
              backgroundColor: theme.dark
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(34, 197, 94, 0.1)",
              borderColor: theme.dark
                ? "rgba(74, 222, 128, 0.6)"
                : "rgba(34, 197, 94, 0.6)",
            },
          ]}
        >
          <Ionicons
            name="globe-outline"
            size={14}
            color={theme.dark ? "#4ade80" : "#22c55e"}
          />
          <Text
            style={[
              styles.browserOpenedText,
              { color: theme.dark ? "#4ade80" : "#22c55e" },
            ]}
          >
            Browser opened
          </Text>
        </View>
        <Text
          style={[styles.instruction, { color: theme.colors.textSecondary }]}
        >
          Complete the sign-in process in your browser, then return here.
        </Text>
      </View>

      <View style={styles.codeContainer}>
        <Text style={[styles.codeLabel, { color: theme.colors.textSecondary }]}>
          VERIFICATION CODE
        </Text>
        <View style={styles.codeBox}>
          <View style={styles.codeChars}>
            {codeChars.map((char, index) => (
              <View
                key={index}
                style={[
                  styles.codeChar,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.codeCharText, { color: theme.colors.text }]}
                >
                  {char}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.waitingContainer}>
        <AnimatedView style={{ transform: [{ rotate: spin }] }}>
          <ConvexLogo size={18} monochrome color={theme.colors.border} />
        </AnimatedView>
        <Text
          style={[styles.waitingText, { color: theme.colors.textSecondary }]}
        >
          Waiting for authentication...
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.cancelButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  browserOpenedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  browserOpenedText: {
    fontSize: 14,
    fontWeight: "500",
  },
  instruction: {
    fontSize: 14,
    textAlign: "center",
  },
  codeContainer: {
    gap: 12,
  },
  codeLabel: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  codeBox: {
    position: "relative",
  },
  codeChars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  codeChar: {
    width: 36,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  codeCharText: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  waitingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  waitingText: {
    fontSize: 14,
  },
  actions: {
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
  },
});
