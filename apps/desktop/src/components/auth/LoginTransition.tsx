import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GradientBackground } from "./GradientBackground";
import { Spinner } from "@/components/ui/spinner";

interface LoginTransitionProps {
  theme: "light" | "dark" | "system";
  onComplete: () => void;
}

// Animation timing
const INITIAL_DELAY = 150; // Brief pause before starting
const FADE_DURATION = 600; // Crossfade duration

/**
 * Animated transition overlay shown after successful login.
 * Simple crossfade approach - expand window instantly, then fade out overlay.
 */
export function LoginTransition({ theme, onComplete }: LoginTransitionProps) {
  const [isFading, setIsFading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const hasStartedRef = useRef(false);

  // Resolve system theme to actual light/dark
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const runTransition = async () => {
      // Brief pause to let the UI settle
      await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY));

      // Expand window immediately (no animated resize)
      try {
        await invoke("expand_window");
      } catch (err) {
        console.error("Failed to expand window:", err);
      }

      // Small delay to let the window settle, then start fade
      await new Promise((resolve) => setTimeout(resolve, 50));
      setIsFading(true);

      // Remove overlay after fade completes
      setTimeout(() => {
        setShowOverlay(false);
        onComplete();
      }, FADE_DURATION + 50);
    };

    runTransition();
  }, [onComplete]);

  if (!showOverlay) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        opacity: isFading ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease-out`,
      }}
    >
      <GradientBackground className={resolvedTheme}>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Spinner size="2xl" className="w-20 h-20" />
          <div className="flex items-center text-text-muted mt-8">
            <span className="text-sm">Launching...</span>
          </div>
        </div>
      </GradientBackground>
    </div>
  );
}

export default LoginTransition;
