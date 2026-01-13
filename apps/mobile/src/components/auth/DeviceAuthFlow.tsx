/**
 * Device Auth Flow Component
 *
 * Shows the user code and handles the device authorization flow
 */

import React, { useEffect, useRef, ComponentType, useState } from "react";
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
import * as WebBrowser from "expo-web-browser";

const AnimatedView = Animated.View as unknown as ComponentType<any>;

interface DeviceAuthFlowProps {
  userCode: string;
  verificationUrl: string;
  onCancel: () => void;
  theme?: Theme;
}

export function DeviceAuthFlow({
  userCode,
  verificationUrl,
  onCancel,
  theme: themeOverride,
}: DeviceAuthFlowProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const codeChars = userCode.split("");
  const spinValue = useRef(new Animated.Value(0)).current;
  const colorCycleValue = useRef(new Animated.Value(0)).current;
  const [currentColorSet, setCurrentColorSet] = useState(0);

  // Three sets of brighter colors
  const colorSets = React.useMemo(
    () => [
      // Set 1: Slightly brighter
      {
        yellow: "rgb(255,200,50)",
        purple: "rgb(170,60,150)",
        red: "rgb(255,80,80)",
      },
      // Set 2: More vibrant
      {
        yellow: "rgb(255,220,70)",
        purple: "rgb(200,80,180)",
        red: "rgb(255,100,100)",
      },
      // Set 3: Brightest
      {
        yellow: "rgb(255,240,90)",
        purple: "rgb(230,100,210)",
        red: "rgb(255,120,120)",
      },
    ],
    [],
  );

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Color cycling animation - cycles through 3 sets continuously
    Animated.loop(
      Animated.timing(colorCycleValue, {
        toValue: 3,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
  }, [spinValue, colorCycleValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Update color set based on animation value
  useEffect(() => {
    const listenerId = colorCycleValue.addListener(({ value }) => {
      const setIndex = Math.floor(value) % 3;
      setCurrentColorSet(setIndex);
    });

    return () => {
      colorCycleValue.removeListener(listenerId);
    };
  }, [colorCycleValue]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(userCode);
  };

  const handleOpenBrowser = async () => {
    try {
      await WebBrowser.openAuthSessionAsync(verificationUrl, undefined, {
        preferEphemeralSession: true,
      });
    } catch (error) {
      console.error("Failed to open browser:", error);
    }
  };

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

      {/* Re-open browser button */}
      <TouchableOpacity
        style={[
          styles.reopenButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={handleOpenBrowser}
        activeOpacity={0.7}
      >
        <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
        <Text
          style={[styles.reopenButtonText, { color: theme.colors.primary }]}
        >
          Re-open Browser
        </Text>
      </TouchableOpacity>

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
    fontSize: 11,
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
  reopenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  reopenButtonText: {
    fontSize: 14,
    fontWeight: "500",
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
  versionContainer: {
    alignItems: "center",
    paddingTop: 8,
  },
  versionText: {
    fontSize: 11,
  },
});
