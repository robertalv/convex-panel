/**
 * Theme Context
 *
 * Manages app theme (dark mode only)
 */

import React, { createContext, useContext } from "react";

import type { Theme } from "../types";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: "light" | "dark" | "auto") => void;
}

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: "#63a8f8", // rgb(99, 168, 248) - matching desktop brand color
    background: "#1e1c1a", // rgb(30, 28, 26) - matching desktop background-base
    surface: "#2a2825", // rgb(42, 40, 37) - matching desktop surface-base
    text: "#ffffff", // rgb(255, 255, 255)
    textSecondary: "#b9b1aa", // rgb(185, 177, 170) - matching desktop text-muted
    textTertiary: "#908881", // rgb(144, 136, 129) - darker muted text
    border: "rgba(163, 156, 148, 0.3)", // matching desktop border-base
    error: "#ffcac1", // rgb(255, 202, 193) - matching desktop error
    warning: "#e6e2a8", // rgb(230, 226, 168)
    success: "#b4ec92", // rgb(180, 236, 146)
    info: "#07bfe8", // rgb(7, 191, 232)
    accent: "#0cbfe9",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark mode only - no theme switching
  const isDark = true;
  const theme = darkTheme;

  const toggleTheme = () => {
    // No-op: Only dark mode is supported
  };

  const setTheme = () => {
    // No-op: Only dark mode is supported
  };

  const value: ThemeContextValue = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
