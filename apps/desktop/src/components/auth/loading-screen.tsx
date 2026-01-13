import { GradientBackground } from "../gradient-background";
import { Spinner } from "@/components/ui/spinner";
import type { ThemeType } from "@/types/desktop";

interface LoadingScreenProps {
  theme: ThemeType;
  message?: string;
}

export function LoadingScreen({
  theme,
  message = "Restoring session...",
}: LoadingScreenProps) {
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <GradientBackground className={resolvedTheme}>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="relative mb-8">
          <Spinner size="2xl" className="w-20 h-20" />
        </div>

        <div className="flex items-center text-text-muted animate-fade-up">
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </GradientBackground>
  );
}

export default LoadingScreen;
