import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
} from "react-native-svg";

const colorSchemes = [
  [
    "hsl(255, 60%, 36%)",
    "hsl(37, 35.7%, 55.5%)",
    "hsl(346, 100%, 85%)",
    "hsl(42, 97%, 54%)",
  ],
  [
    "hsl(3, 100%, 32%)",
    "hsl(42, 100%, 80%)",
    "hsl(29, 89%, 54%)",
    "hsl(0, 0%, 36%)",
  ],
  [
    "hsl(270, 13%, 27%)",
    "hsl(220, 56%, 78%)",
    "hsl(316, 59%, 77%)",
    "hsl(260, 60%, 51%)",
  ],
  [
    "hsl(220, 14%, 45%)",
    "hsl(120, 22%, 62%)",
    "hsl(6, 100%, 74%)",
    "hsl(312, 33%, 71%)",
  ],
  [
    "hsl(220, 14%, 45%)",
    "hsl(262, 87%, 74%)",
    "hsl(240, 70%, 42%)",
    "hsl(210, 66%, 84%)",
  ],
  [
    "hsl(6, 100%, 74%)",
    "hsl(40, 80%, 75%)",
    "hsl(316, 59%, 65%)",
    "hsl(42, 100%, 80%)",
  ],
];

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const hslToRgb = (h: number, s: number, l: number): string => {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const parseHslToRgb = (hsl: string): string => {
  const match = hsl.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!match) return "#000000";
  const h = parseInt(match[1], 10);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  return hslToRgb(h, s, l);
};

export interface AvatarProps {
  name: string;
  hashKey?: string | number;
  size?: number;
  borderRadius?: number;
}

export function Avatar({
  name,
  hashKey,
  size = 40,
  borderRadius = 8,
}: AvatarProps) {
  const key = hashKey !== undefined ? String(hashKey) : name;
  const hash = hashString(key);

  const patternIdx = hash % 4;
  const colorSchemeIdx = Math.floor(hash / 4) % colorSchemes.length;
  const baseColors = colorSchemes[colorSchemeIdx];
  const rotationDeg = hash % 360;

  const initial =
    name.split(" ").length > 1
      ? name.split(" ")[0][0] + name.split(" ")[1][0]
      : name.slice(0, 2).toUpperCase();

  const colors = baseColors.map(parseHslToRgb);
  const gradientId = `gradient-${hash}`;

  let gradientElement: React.ReactElement;

  switch (patternIdx) {
    case 0: {
      const theta = (rotationDeg / 180) * Math.PI;
      const x1 = 0.5 - 0.5 * Math.cos(theta);
      const y1 = 0.5 - 0.5 * Math.sin(theta);
      const x2 = 0.5 + 0.5 * Math.cos(theta);
      const y2 = 0.5 + 0.5 * Math.sin(theta);
      gradientElement = (
        <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </LinearGradient>
      );
      break;
    }
    case 1: {
      const theta = ((45 + rotationDeg) / 180) * Math.PI;
      const x1 = 0.5 - 0.5 * Math.cos(theta);
      const y1 = 0.5 - 0.5 * Math.sin(theta);
      const x2 = 0.5 + 0.5 * Math.cos(theta);
      const y2 = 0.5 + 0.5 * Math.sin(theta);
      gradientElement = (
        <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
          <Stop offset="0%" stopColor={colors[2]} />
          <Stop offset="100%" stopColor={colors[3]} />
        </LinearGradient>
      );
      break;
    }
    case 2: {
      const theta = ((135 + rotationDeg) / 180) * Math.PI;
      const x1 = 0.5 - 0.5 * Math.cos(theta);
      const y1 = 0.5 - 0.5 * Math.sin(theta);
      const x2 = 0.5 + 0.5 * Math.cos(theta);
      const y2 = 0.5 + 0.5 * Math.sin(theta);
      gradientElement = (
        <LinearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
          <Stop offset="0%" stopColor={colors[2]} />
          <Stop offset="60%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </LinearGradient>
      );
      break;
    }
    case 3: {
      const theta = (rotationDeg / 180) * Math.PI;
      const r = 0.3;
      const cx = 0.5 + r * Math.cos(theta);
      const cy = 0.5 + r * Math.sin(theta);
      gradientElement = (
        <RadialGradient id={gradientId} cx={cx} cy={cy} r="0.5">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="80%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </RadialGradient>
      );
      break;
    }
    default: {
      gradientElement = (
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </LinearGradient>
      );
    }
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius,
          overflow: "hidden",
        },
      ]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>{gradientElement}</Defs>
        <Rect width={size} height={size} fill={`url(#${gradientId})`} />
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.3)" },
        ]}
      />
      <Text
        style={[
          styles.avatarText,
          {
            fontSize: size * 0.4,
            textShadowColor: "rgba(0, 0, 0, 0.5)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 3,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
  },
});
