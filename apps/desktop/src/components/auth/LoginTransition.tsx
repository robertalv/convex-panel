import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GradientBackground } from "./GradientBackground";
import { Spinner } from "@/components/ui/spinner";

interface LoginTransitionProps {
  theme: "light" | "dark" | "system";
  onComplete: () => void;
  children?: React.ReactNode;
}

// Starting window size (matches tauri.conf.json)
const START_WIDTH = 960;
const START_HEIGHT = 600;

// Animation timing
const EXPAND_DELAY = 200; // Wait before starting window expansion
const EXPAND_DURATION = 800; // Window expansion duration (longer for smoother feel)
const FADE_START_DELAY = 400; // When to start fading (during expansion)
const FADE_DURATION = 500; // Crossfade duration

/**
 * Animated transition screen shown after successful login.
 * Uses CSS animations for smooth visuals, with minimal native calls.
 */
export function LoginTransition({
  theme,
  onComplete,
  children,
}: LoginTransitionProps) {
  const [phase, setPhase] = useState<
    "initial" | "expanding" | "fading" | "complete"
  >("initial");
  const [showOverlay, setShowOverlay] = useState(true);
  const hasStartedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const fadeStartedRef = useRef(false);

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
    fadeStartedRef.current = false;

    const runTransition = async () => {
      // Brief pause to let the UI settle
      await new Promise((resolve) => setTimeout(resolve, EXPAND_DELAY));

      setPhase("expanding");

      // Get target size
      const targetWidth = window.screen.availWidth;
      const targetHeight = window.screen.availHeight;

      // Use requestAnimationFrame for smooth, frame-synced animation
      const startTime = performance.now();
      let lastResizeTime = 0;
      const minResizeInterval = 16; // ~60fps for window resizes (don't spam native calls)

      const animate = async (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / EXPAND_DURATION, 1);

        // Use ease-in-out cubic for more natural acceleration and deceleration
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const width = Math.round(
          START_WIDTH + (targetWidth - START_WIDTH) * eased,
        );
        const height = Math.round(
          START_HEIGHT + (targetHeight - START_HEIGHT) * eased,
        );

        // Throttle window resize calls to avoid overwhelming the native layer
        if (currentTime - lastResizeTime >= minResizeInterval) {
          try {
            // Fire and forget for smoother animation (don't await)
            invoke("set_window_size_centered", { width, height }).catch(() => {
              // Ignore errors
            });
            lastResizeTime = currentTime;
          } catch {
            // Ignore errors, continue animation
          }
        }

        // Start fade transition partway through expansion for smoother feel
        if (elapsed >= FADE_START_DELAY && !fadeStartedRef.current) {
          fadeStartedRef.current = true;
          setPhase("fading");
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Final maximize
          try {
            await invoke("expand_window");
          } catch (err) {
            console.error("Failed to expand window:", err);
          }

          // Ensure fade phase is set if it wasn't already
          if (!fadeStartedRef.current) {
            fadeStartedRef.current = true;
            setPhase("fading");
          }

          // Complete after fade and remove overlay from DOM
          setTimeout(() => {
            setPhase("complete");
            // Small delay to ensure fade completes before removing from DOM
            setTimeout(() => {
              setShowOverlay(false);
            }, 50);
            onComplete();
          }, FADE_DURATION);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    runTransition();

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [onComplete]);

  const isFading = phase === "fading" || phase === "complete";
  const isExpanding =
    phase === "expanding" || phase === "fading" || phase === "complete";

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Main layout - fades in simultaneously with overlay fade out */}
      {children && (
        <div
          className="absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: isFading ? 1 : 0,
            transitionDuration: `${FADE_DURATION}ms`,
          }}
        >
          {children}
        </div>
      )}

      {/* Animated overlay - stays mounted during fade, then removed */}
      {showOverlay && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity ease-in-out"
          style={{
            opacity: isFading ? 0 : 1,
            transitionDuration: `${FADE_DURATION}ms`,
          }}
        >
          <GradientBackground className={resolvedTheme}>
            <div className="min-h-screen flex flex-col items-center justify-center">
              {/* Spinner with CSS scale animation */}
              <div
                className="relative transition-transform ease-in-out"
                style={{
                  transform: isExpanding ? "scale(6)" : "scale(1)",
                  transitionDuration: `${EXPAND_DURATION}ms`,
                }}
              >
                <Spinner size="2xl" className="w-20 h-20" />
              </div>

              {/* Loading message - fades out during expansion */}
              <div
                className="flex items-center text-text-muted mt-8 transition-opacity ease-out"
                style={{
                  opacity: isExpanding ? 0 : 1,
                  transitionDuration: "300ms",
                }}
              >
                <span className="text-sm">Launching...</span>
              </div>
            </div>
          </GradientBackground>
        </div>
      )}
    </div>
  );
}

export default LoginTransition;
