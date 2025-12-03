import { useEffect, useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react'
import { MoonFreeIcons, SunFreeIcons } from '@hugeicons/core-free-icons'

type Theme = "light" | "dark";

const STORAGE_KEY = "convexpanel-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-1.5 rounded-full bg-background-secondary/80 py-1.5 text-content-primary hover:bg-background-secondary/90 transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <HugeiconsIcon icon={MoonFreeIcons} className="h-6 w-6" />
      ) : (
        <HugeiconsIcon icon={SunFreeIcons} className="h-6 w-6" />
      )}
    </button>
  );
}


