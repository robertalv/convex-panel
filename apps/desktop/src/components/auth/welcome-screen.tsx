import { useState } from "react";
import { Modal } from "../ui/modal";
import { AuthCard } from "./auth-card";
import { DeployKeyForm } from "./deploy-key-form";
import { ConvexLettering } from "@/components/svg/convex-lettering";
import { openExternalLink } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DeployKeyConfig } from "@/lib/deployKeyAuth";

type AuthView = "choice" | "oauth" | "deployKey";

interface WelcomeScreenProps {
  isAuthenticating: boolean;
  userCode: string | null;
  verificationUrl?: string | null;
  onStartDeviceAuth: () => void;
  onCancelDeviceAuth: () => void;
  authError: string | null;
  onDeployKeyConnect?: (config: DeployKeyConfig) => void;
}

export function WelcomeScreen({
  isAuthenticating,
  userCode,
  verificationUrl,
  onStartDeviceAuth,
  onCancelDeviceAuth,
  authError,
  onDeployKeyConnect,
}: WelcomeScreenProps) {
  const [authView, setAuthView] = useState<AuthView>("choice");

  const handleOpenLink = async (url: string) => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      await openExternalLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleDeployKeyConnect = (config: DeployKeyConfig) => {
    if (onDeployKeyConnect) {
      onDeployKeyConnect(config);
    }
  };

  const renderAuthContent = () => {
    // If we're in the middle of device auth, show that
    if (authView === "oauth" || (isAuthenticating && userCode)) {
      return (
        <AuthCard
          isAuthenticating={isAuthenticating}
          userCode={userCode}
          verificationUrl={verificationUrl}
          onStartDeviceAuth={onStartDeviceAuth}
          onCancelDeviceAuth={() => {
            onCancelDeviceAuth();
            setAuthView("choice");
          }}
          authError={authError}
        />
      );
    }

    // Deploy key form
    if (authView === "deployKey") {
      return (
        <DeployKeyForm
          onConnect={handleDeployKeyConnect}
          onCancel={() => setAuthView("choice")}
        />
      );
    }

    return (
      <div className="space-y-6 animate-fade-up">
        <div className="space-y-3">
          {/* OAuth Option */}
          <button
            onClick={() => {
              setAuthView("oauth");
              onStartDeviceAuth();
            }}
            className={cn(
              "w-full p-2 rounded-3xl",
              "bg-background-base border border-border-base",
              "hover:border-brand-base/50 hover:bg-background-raised",
              "transition-all duration-200",
              "text-left cursor-pointer",
              "group",
            )}
          >
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-brand-base/10 text-brand-base",
                  "group-hover:bg-brand-base/20",
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-base mb-1">
                  Sign in with Convex
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Full access to all your teams, projects, and deployments.
                  Recommended for most users.
                </p>
              </div>
              <div className="px-2 py-1 rounded-full bg-brand-base/10 text-xs font-medium text-brand-base">
                Recommended
              </div>
            </div>
          </button>

          {/* Deploy Key Option */}
          <button
            onClick={() => setAuthView("deployKey")}
            className={cn(
              "w-full p-2 rounded-3xl",
              "bg-background-base border border-border-base",
              "hover:border-brand-base/50 hover:bg-background-raised",
              "transition-all duration-200",
              "text-left cursor-pointer",
              "group",
            )}
          >
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-text-muted/10 text-text-muted",
                  "group-hover:bg-text-muted/20",
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-base mb-1">
                  Use Deploy Key
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Connect directly to a single deployment. Useful for
                  third-party apps or when you only need access to one
                  deployment.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Error display */}
        {authError && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-error-muted border border-error-base/20">
            <svg
              className="h-4 w-4 text-error-base shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-error-text">{authError}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      fullscreen={true}
      showCloseButton={false}
      contentClassName="relative"
    >
      <div className="absolute top-12 flex justify-center w-full pointer-events-none">
        <ConvexLettering />
      </div>

      <div className="flex items-center justify-center min-h-screen p-6">
        <div
          className="w-full max-w-md animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {renderAuthContent()}
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <button
          onClick={() => handleOpenLink("https://docs.convex.dev/")}
          className="text-xs text-text-disabled hover:text-text-muted transition-colors cursor-pointer"
        >
          Documentation
        </button>
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <span className="text-xs text-text-disabled">
          {typeof __APP_VERSION__ !== "undefined"
            ? `v${__APP_VERSION__}`
            : "v0.0.0"}
        </span>
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
    </Modal>
  );
}

export default WelcomeScreen;
