import { Modal } from "../ui/modal";
import { AuthCard } from "./auth-card";
import { ConvexLettering } from "@/components/svg/convex-lettering";
import { openExternalLink } from "@/lib/utils";

interface WelcomeScreenProps {
  isAuthenticating: boolean;
  userCode: string | null;
  onStartDeviceAuth: () => void;
  onCancelDeviceAuth: () => void;
  authError: string | null;
}

export function WelcomeScreen({
  isAuthenticating,
  userCode,
  onStartDeviceAuth,
  onCancelDeviceAuth,
  authError,
}: WelcomeScreenProps) {

  const handleOpenLink = async (url: string) => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      await openExternalLink(url);
    } else {
      window.open(url, "_blank");
    }
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
          <AuthCard
            isAuthenticating={isAuthenticating}
            userCode={userCode}
            onStartDeviceAuth={onStartDeviceAuth}
            onCancelDeviceAuth={onCancelDeviceAuth}
            authError={authError}
          />
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
          {typeof __APP_VERSION__ !== "undefined" ? `v${__APP_VERSION__}` : "v0.0.0"}
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
