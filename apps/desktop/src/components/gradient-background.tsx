import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  enableDragRegion?: boolean;
}

/**
 * Animated gradient background inspired by Convex.dev's welcome screen.
 * Features multiple layered gradients with subtle animations.
 */
export function GradientBackground({
  children,
  className,
  enableDragRegion = true,
}: GradientBackgroundProps) {
  return (
    <div
      {...(enableDragRegion ? { "data-tauri-drag-region": "" } : {})}
      className={cn(
        "relative min-h-screen w-full overflow-hidden",
        "bg-background-base",
        className,
      )}
    >
      {/* Base gradient layer - very subtle blue accents matching web app */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 168, 248, 0.04), transparent),
            radial-gradient(ellipse 60% 40% at 100% 50%, rgba(177, 202, 240, 0.03), transparent),
            radial-gradient(ellipse 60% 40% at 0% 50%, rgba(99, 168, 248, 0.02), transparent)
          `,
        }}
      />

      {/* Subtle animated orb 1 - top right - barely visible blue accent */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-float-slow opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 168, 248, 0.08), transparent 70%)",
        }}
      />

      {/* Subtle animated orb 2 - bottom left - barely visible blue */}
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl animate-float-delayed opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(177, 202, 240, 0.06), transparent 70%)",
        }}
      />

      {/* Grid pattern with radial fade - matching EmptyStateWithGrid style */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="gradient-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
            <radialGradient id="gradient-gridFadeGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="30%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="gradient-gridFadeMask">
              <rect
                width="100%"
                height="100%"
                fill="url(#gradient-gridFadeGradient)"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#gradient-grid)"
            mask="url(#gradient-gridFadeMask)"
            className="text-text-disabled"
          />
        </svg>

        {/* Plus symbols in corners */}
        <div className="absolute top-4 left-4 text-text-disabled">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div className="absolute top-4 right-4 text-text-disabled">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div className="absolute bottom-4 left-4 text-text-disabled">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div className="absolute bottom-4 right-4 text-text-disabled">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>

      {/* Title bar drag region - transparent bar at top for window dragging */}
      {enableDragRegion && (
        <div
          data-tauri-drag-region
          className="absolute top-0 left-0 right-0 h-8 z-50"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default GradientBackground;
