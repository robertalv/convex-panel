import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface SkeletonProps {
  /** Width of the skeleton (number or percentage string) */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Additional styles */
  style?: object;
}

/**
 * Skeleton loading component with shimmer animation.
 * Used to indicate loading state with a placeholder UI.
 */
export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
  },
});
