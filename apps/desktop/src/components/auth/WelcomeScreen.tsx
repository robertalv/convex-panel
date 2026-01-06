import { GradientBackground } from "./GradientBackground";
import { AuthCard } from "./AuthCard";
import { ConvexLettering } from "@/components/ui/ConvexLettering";

interface WelcomeScreenProps {
  theme: "light" | "dark" | "system";
  authMethod: "device" | "manual";
  isAuthenticating: boolean;
  userCode: string | null;
  onStartDeviceAuth: () => void;
  onCancelDeviceAuth: () => void;
  deployUrl: string;
  deployKey: string;
  onDeployUrlChange: (value: string) => void;
  onDeployKeyChange: (value: string) => void;
  onManualConnect: () => void;
  authError: string | null;
}

export function WelcomeScreen({
  theme,
  authMethod,
  isAuthenticating,
  userCode,
  onStartDeviceAuth,
  onCancelDeviceAuth,
  deployUrl,
  deployKey,
  onDeployUrlChange,
  onDeployKeyChange,
  onManualConnect,
  authError,
}: WelcomeScreenProps) {
  // Resolve system theme to actual light/dark
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const handleOpenLink = async (url: string) => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <GradientBackground className={resolvedTheme}>
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ maxWidth: "960px", maxHeight: "600px" }}
      >
        {/* Convex Logo at the top - positioned below drag bar */}
        <div className="absolute top-12 flex justify-center w-full pointer-events-none">
          <ConvexLettering />
        </div>

        <div
          className="w-full max-w-md animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <AuthCard
            authMethod={authMethod}
            isAuthenticating={isAuthenticating}
            userCode={userCode}
            onStartDeviceAuth={onStartDeviceAuth}
            onCancelDeviceAuth={onCancelDeviceAuth}
            deployUrl={deployUrl}
            deployKey={deployKey}
            onDeployUrlChange={onDeployUrlChange}
            onDeployKeyChange={onDeployKeyChange}
            onManualConnect={onManualConnect}
            authError={authError}
          />
        </div>

        {/* Documentation link at the bottom */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => handleOpenLink("https://docs.convex.dev/")}
            className="text-xs text-text-disabled hover:text-text-muted transition-colors cursor-pointer"
          >
            Documentation
          </button>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <span className="text-xs text-text-disabled">v0.1.0</span>
          <span className="text-xs text-text-disabled">-</span>
          {typeof __GIT_COMMIT_HASH__ !== "undefined" &&
            __GIT_COMMIT_HASH__ !== "unknown" &&
            __GIT_REPO_URL__ && (
              <button
                onClick={() =>
                  handleOpenLink(
                    `${__GIT_REPO_URL__}/commit/${__GIT_COMMIT_HASH__}`,
                  )
                }
                className="text-xs text-text-disabled hover:text-text-secondary transition-colors cursor-pointer"
              >
                {__GIT_COMMIT_HASH__.substring(0, 7)}
              </button>
            )}
        </div>
      </div>
    </GradientBackground>
  );
}

export default WelcomeScreen;
