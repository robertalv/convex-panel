/**
 * GitHub Authentication Modal
 *
 * Displays the Device Flow authentication UI:
 * 1. Shows user code and verification URL
 * 2. Opens browser for user to authorize
 * 3. Shows loading state while polling
 * 4. Shows success/error states
 */

import { useEffect, useState, useCallback } from "react";
import {
  Github,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGitHub } from "../contexts/GitHubContext";
import { GradientBackground } from "./auth/GradientBackground";

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubAuthModal({ isOpen, onClose }: GitHubAuthModalProps) {
  const { authStatus, deviceCode, user, error, startAuth, cancelAuth } =
    useGitHub();

  const [copied, setCopied] = useState(false);
  const codeChars = deviceCode?.user_code?.split("") ?? [];

  // Start auth when modal opens
  useEffect(() => {
    if (isOpen && authStatus === "idle") {
      startAuth();
    }
  }, [isOpen, authStatus, startAuth]);

  // Close modal on successful auth
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
      await navigator.clipboard.writeText(deviceCode.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [deviceCode?.user_code]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-[960px] max-w-[960px] h-[600px] max-h-[600px] rounded-3xl overflow-hidden shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <GradientBackground className="min-h-full h-full w-full">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-surface-base/80 border border-border-base/60 shadow hover:bg-surface-overlay transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>

          {/* Header label */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-base/80 border border-border-base/60 shadow-sm">
            <Github className="w-5 h-5 text-text-base" />
            <span className="text-sm font-medium text-text-base">
              Connect to GitHub
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center p-8">
            <div className="w-full max-w-3xl">
            {/* Loading state */}
            {authStatus === "loading" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-8 h-8 text-brand-base animate-spin mb-4" />
                <p className="text-sm text-text-muted">Initializing...</p>
              </div>
            )}

            {/* Device code display - match WelcomeScreen device auth look */}
            {(authStatus === "awaiting_user" || authStatus === "polling") &&
              deviceCode && (
                <div className="space-y-8 animate-fade-up">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-600 dark:border-green-400 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 text-xs font-medium">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Browser window opened</span>
                    </div>
                    <p className="text-sm text-text-muted">
                      Complete the sign-in process in your browser, then return here.
                    </p>
                  </div>

                  <div className="relative max-w-xl mx-auto">
                    <div className="absolute inset-0 rounded-2xl blur-xl animate-pulse-slow bg-brand-base/20" />
                    <div className="relative bg-surface-base/80 backdrop-blur-sm border border-border-base rounded-2xl p-6 shadow-lg">
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
                      <Loader2 className="w-4 h-4 animate-spin text-brand-base" />
                      <span>Waiting for GitHub authorization...</span>
                    </div>
                    <p className="text-xs text-text-subtle text-center">
                      Code expires in{" "}
                      {Math.floor((deviceCode.expires_in || 900) / 60)} minutes
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 max-w-xl mx-auto">
                    <button
                      onClick={handleOpenGitHub}
                      className="w-full flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-lg px-4 py-3 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                      <span className="font-medium">Open GitHub</span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="w-full flex items-center justify-center gap-2 bg-surface-raised border border-border-base hover:border-brand-base text-text-base rounded-lg px-4 py-3 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-text-muted" />
                      )}
                      <span className="font-medium">
                        {copied ? "Code copied" : "Copy code"}
                      </span>
                    </button>
                    <button
                      onClick={handleClose}
                      className="w-full text-sm text-text-muted hover:text-text-base transition-colors"
                    >
                      Cancel
                    </button>
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
                  <Check className="w-6 h-6" />
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
                  <AlertCircle className="w-6 h-6 text-red-500" />
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
          </div>
          </div>
        </GradientBackground>
      </div>
    </div>
  );
}

export default GitHubAuthModal;

