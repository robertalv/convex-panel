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
import { useGitHub } from "../contexts/GitHubContext";

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubAuthModal({ isOpen, onClose }: GitHubAuthModalProps) {
  const { authStatus, deviceCode, user, error, startAuth, cancelAuth } =
    useGitHub();

  const [copied, setCopied] = useState(false);

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
        className="bg-surface-base border border-border-base rounded-xl shadow-2xl w-[420px] overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          data-tauri-drag-region
          className="h-12 bg-surface-raised flex items-center justify-between px-4 border-b border-border-base"
        >
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-text-base" />
            <span className="text-sm font-medium text-text-base">
              Connect to GitHub
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-surface-overlay transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading state */}
          {authStatus === "loading" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-brand-base animate-spin mb-4" />
              <p className="text-sm text-text-muted">Initializing...</p>
            </div>
          )}

          {/* Device code display */}
          {(authStatus === "awaiting_user" || authStatus === "polling") &&
            deviceCode && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-4">
                    Enter this code on GitHub to authorize Convex Panel:
                  </p>

                  {/* User code display */}
                  <div className="relative">
                    <button
                      onClick={handleCopyCode}
                      className="w-full bg-surface-raised border border-border-base rounded-lg px-6 py-4 hover:border-brand-base transition-colors group"
                    >
                      <code className="text-3xl font-mono font-bold text-text-base tracking-widest">
                        {deviceCode.user_code}
                      </code>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {copied ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-text-muted group-hover:text-text-base transition-colors" />
                        )}
                      </div>
                    </button>
                    <p className="text-xs text-text-subtle mt-2">
                      Click to copy
                    </p>
                  </div>
                </div>

                {/* Open GitHub button */}
                <button
                  onClick={handleOpenGitHub}
                  className="w-full flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-lg px-4 py-3 transition-colors"
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">Open GitHub</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </button>

                {/* Polling indicator */}
                {authStatus === "polling" && (
                  <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Waiting for authorization...</span>
                  </div>
                )}

                <p className="text-xs text-text-subtle text-center">
                  Code expires in{" "}
                  {Math.floor((deviceCode.expires_in || 900) / 60)} minutes
                </p>
              </div>
            )}

          {/* Success state */}
          {authStatus === "authenticated" && user && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-500 mb-4">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-full h-full object-cover"
                />
              </div>
              <Check className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-sm text-text-base font-medium">
                Connected as {user.name || user.login}
              </p>
              <p className="text-xs text-text-muted">@{user.login}</p>
            </div>
          )}

          {/* Error state */}
          {authStatus === "error" && error && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-text-base font-medium mb-2">
                Authentication Failed
              </p>
              <p className="text-xs text-text-muted text-center mb-6 max-w-[280px]">
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
    </div>
  );
}

export default GitHubAuthModal;
