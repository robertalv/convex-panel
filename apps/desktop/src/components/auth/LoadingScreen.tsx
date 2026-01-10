import { GradientBackground } from "../shared/GradientBackground";
import { Spinner } from "@/components/ui/spinner";

interface LoadingScreenProps {
  theme: "light" | "dark" | "system";
  message?: string;
}

/**
 * Loading screen shown while restoring session from keychain.
 */
export function LoadingScreen({
  theme,
  message = "Restoring session...",
}: LoadingScreenProps) {
  // Resolve system theme to actual light/dark
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <GradientBackground className={resolvedTheme}>
      <div className="min-h-screen flex flex-col items-center justify-center">
        {/* Shimmering Convex Logo */}
        <div className="relative mb-8">
          <Spinner size="2xl" className="w-20 h-20" />
        </div>

        {/* Loading message */}
        <div className="flex items-center text-text-muted animate-fade-up">
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </GradientBackground>
  );
}

export default LoadingScreen;
