/**
 * Convex Logo Component
 *
 * The official Convex logo (three-color pinwheel design)
 */

import React from "react";
import Svg, { Path, G } from "react-native-svg";

// Type assertions to fix React 18/19 type compatibility

interface ConvexLogoProps {
  size?: number;
  color?: string;
  monochrome?: boolean;
  style?: any;
}

export function ConvexLogo({
  size = 64,
  color = "currentColor",
  monochrome = false,
  style,
}: ConvexLogoProps) {
  const colors = monochrome
    ? { yellow: color, purple: color, red: color }
    : {
        yellow: "rgb(245,176,26)",
        purple: "rgb(141,37,118)",
        red: "rgb(238,52,47)",
      };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 367 370"
      fill="none"
      style={style}
    >
      <G transform="matrix(1,0,0,1,-129.225,-127.948)">
        <G transform="matrix(4.16667,0,0,4.16667,0,0)">
          <G transform="matrix(1,0,0,1,86.6099,107.074)">
            <Path
              d="M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544"
              fill={colors.yellow}
            />
          </G>
          <G transform="matrix(1,0,0,1,47.1708,74.7779)">
            <Path
              d="M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489"
              fill={colors.purple}
            />
          </G>
          <G transform="matrix(1,0,0,1,91.325,66.4152)">
            <Path
              d="M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199"
              fill={colors.red}
            />
          </G>
        </G>
      </G>
    </Svg>
  );
}
