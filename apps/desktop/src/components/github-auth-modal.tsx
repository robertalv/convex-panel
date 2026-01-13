import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useGitHub } from "../contexts/github-context";
import { Modal } from "./ui/modal";
import { Button } from "./ui";
import { Icon } from "@/components/ui/icon";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubAuthModal({ isOpen, onClose }: GitHubAuthModalProps) {
  const { authStatus, deviceCode, user, error, startAuth, cancelAuth } =
    useGitHub();

  const { copied, copy } = useCopyToClipboard();
  const codeChars = deviceCode?.user_code?.split("") ?? [];

  useEffect(() => {
    if (isOpen && authStatus === "idle") {
      startAuth();
    }
  }, [isOpen, authStatus, startAuth]);

  useEffect(() => {
    if (authStatus === "authenticated" && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [authStatus, isOpen, onClose]);

  const handleClose = useCallback(() => {
    cancelAuth();
    onClose();
  }, [cancelAuth, onClose]);

  const handleCopyCode = useCallback(async () => {
    if (deviceCode?.user_code) {
      await copy(deviceCode.user_code);
    }
  }, [deviceCode?.user_code, copy]);

  const handleOpenGitHub = useCallback(async () => {
    if (deviceCode?.verification_uri) {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { __TAURI_INTERNALS__: unknown })
          .__TAURI_INTERNALS__
      ) {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(deviceCode.verification_uri);
      } else {
        window.open(deviceCode.verification_uri, "_blank");
      }
    }
  }, [deviceCode?.verification_uri]);

  const handleRetry = useCallback(() => {
    startAuth();
  }, [startAuth]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} width={960} height={420}>
      {/* Loading state */}
      {authStatus === "loading" && (
        <div className="flex flex-col items-center py-8">
          <Icon name="spinner" size={32} className="animate-spin mb-4" />
          <p className="text-sm text-text-muted">Initializing...</p>
        </div>
      )}

      {/* Device code display - match WelcomeScreen device auth look */}
      {(authStatus === "awaiting_user" || authStatus === "polling") &&
        deviceCode && (
          <div className="space-y-8 animate-fade-up">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-600 dark:border-green-400 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 text-xs font-medium">
                <Icon name="external-link" size={14} />
                <span>Browser window opened</span>
              </div>
              <p className="text-sm text-text-muted">
                Complete the sign-in process in your browser, then return here.
              </p>
            </div>

            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 rounded-2xl blur-xl animate-pulse-slow bg-brand-base/20" />
              <div className="relative bg-surface-base/80 backdrop-blur-sm border border-border-base rounded-2xl p-6 shadow-lg">
                <button
                  onClick={handleCopyCode}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-raised transition-colors text-text-muted hover:text-text-base"
                  title={copied ? "Code copied" : "Copy code"}
                >
                  {copied ? (
                    <Icon name="check" size={16} color="green" />
                  ) : (
                    <Icon name="copy" size={16} />
                  )}
                </button>
                <p className="text-xs text-text-subtle text-center mb-3 uppercase tracking-wider font-medium">
                  Verification Code
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  {codeChars.map((char, index) => (
                    <span
                      key={`${char}-${index}`}
                      className={cn(
                        "inline-flex items-center justify-center w-10 h-12 rounded-lg",
                        "bg-surface-raised border border-border-muted",
                        "text-2xl font-mono font-bold text-primary-foreground",
                        "animate-fade-up",
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "backwards",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Icon name="spinner" size={16} className="animate-spin" />
                <span>Waiting for GitHub authorization...</span>
              </div>
              <p className="text-xs text-text-subtle text-center">
                Code expires in{" "}
                {Math.floor((deviceCode.expires_in || 900) / 60)} minutes
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-xl mx-auto">
              <Button variant="default" onClick={handleOpenGitHub}>
                <Icon name="github" size={20} />
                <span className="font-medium">Open GitHub</span>
                <Icon name="external-link" size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

      {/* Success state */}
      {authStatus === "authenticated" && user && (
        <div className="flex flex-col items-center py-8 space-y-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500 shadow-lg">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center gap-2 text-green-500">
            <Icon name="check" size={24} color="green" />
            <span className="text-sm font-medium">Connected</span>
          </div>
          <p className="text-base text-text-base font-medium">
            {user.name || user.login}
          </p>
          <p className="text-xs text-text-muted">@{user.login}</p>
        </div>
      )}

      {/* Error state */}
      {authStatus === "error" && error && (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <Icon name="alert-circle" size={24} color="red" />
          </div>
          <p className="text-sm text-text-base font-medium">
            Authentication Failed
          </p>
          <p className="text-xs text-text-muted text-center max-w-sm">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-brand-base hover:bg-brand-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </Modal>
  );
}

export default GitHubAuthModal;
