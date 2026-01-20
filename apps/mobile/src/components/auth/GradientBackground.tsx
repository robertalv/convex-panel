/**
 * Gradient Background Component
 *
 * Animated gradient background inspired by Convex.dev's welcome screen
 * Matches the desktop app design exactly
 */

import React from "react";
import { View, StyleSheet, ViewStyle, Dimensions } from "react-native";
import Svg, {
  Defs,
  Rect,
  Pattern,
  Path,
  LinearGradient,
  Stop,
  Mask,
  G,
} from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";

// Type workarounds for React 18/19 type compatibility

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GRID_SIZE = 40;

export function GradientBackground({
  children,
  style,
}: GradientBackgroundProps) {
  const { theme } = useTheme();
  // Background color from theme
  const backgroundColor = theme.colors.background;

  // Grid color - lighter than background
  const gridColor = "#808080";

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {/* Grid Pattern with Radial Fade */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <Pattern
              id="gridPattern"
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <Path
                d={`M ${GRID_SIZE} 0 L 0 0 L 0 ${GRID_SIZE}`}
                fill="none"
                stroke={gridColor}
                strokeWidth="1"
              />
            </Pattern>
            <LinearGradient id="gridFadeVertical" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="white" stopOpacity="0" />
              <Stop offset="40%" stopColor="white" stopOpacity="1" />
              <Stop offset="50%" stopColor="white" stopOpacity="1" />
              <Stop offset="100%" stopColor="white" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="gridFadeHorizontal" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="white" stopOpacity="0" />
              <Stop offset="15%" stopColor="white" stopOpacity="1" />
              <Stop offset="85%" stopColor="white" stopOpacity="1" />
              <Stop offset="100%" stopColor="white" stopOpacity="0" />
            </LinearGradient>

            <Mask id="maskVertical">
              <Rect
                x="0"
                y="0"
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                fill="url(#gridFadeVertical)"
              />
            </Mask>
            <Mask id="maskHorizontal">
              <Rect
                x="0"
                y="0"
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                fill="url(#gridFadeHorizontal)"
              />
            </Mask>
          </Defs>

          <G mask="url(#maskHorizontal)">
            <Rect
              x="0"
              y="0"
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fill="url(#gridPattern)"
              opacity={0.2}
              mask="url(#maskVertical)"
            />
          </G>
        </Svg>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  content: {
    position: "relative",
    zIndex: 10,
    flex: 1,
  },
});
