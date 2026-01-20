import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GradientBackground } from "../gradient-background";
import { Spinner } from "@/components/ui/spinner";
import type { ThemeType } from "@/types/desktop";

interface LoginTransitionProps {
  theme: ThemeType;
  onComplete: () => void;
}

const INITIAL_DELAY = 150;
const FADE_DURATION = 600;

export function LoginTransition({ theme, onComplete }: LoginTransitionProps) {
  const [isFading, setIsFading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const hasStartedRef = useRef(false);

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
      await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY));

      try {
        await invoke("expand_window");
      } catch (err) {
        console.error("Failed to expand window:", err);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
      setIsFading(true);

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
