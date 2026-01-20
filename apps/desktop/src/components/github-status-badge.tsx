import { useState } from "react";
import { Github, LogOut, RefreshCw, ChevronDown } from "lucide-react";
import { useGitHub } from "../contexts/github-context";
import { GitHubAuthModal } from "./github-auth-modal";

interface GitHubStatusBadgeProps {
  className?: string;
}

export function GitHubStatusBadge({ className = "" }: GitHubStatusBadgeProps) {
  const {
    isAuthenticated,
    isLoading,
    user,
    logout,
    refreshRepos,
    reposLoading,
  } = useGitHub();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised ${className}`}
      >
        <Github className="w-4 h-4 text-text-muted animate-pulse" />
        <span className="text-xs text-text-muted">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-overlay border border-border-base hover:border-brand-base transition-colors ${className}`}
        >
          <Github className="w-4 h-4 text-text-muted" />
          <span className="text-xs text-text-base">Connect GitHub</span>
        </button>
        <GitHubAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-overlay border border-border-base transition-colors"
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.login}
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <Github className="w-4 h-4 text-text-muted" />
        )}
        <span className="text-xs text-text-base max-w-[100px] truncate">
          {user?.login || "Connected"}
        </span>
        <ChevronDown className="w-3 h-3 text-text-muted" />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface-base border border-border-base rounded-lg shadow-xl z-50 py-1">
            {/* User info */}
            <div className="px-3 py-2 border-b border-border-base">
              <p className="text-sm font-medium text-text-base truncate">
                {user?.name || user?.login}
              </p>
              <p className="text-xs text-text-muted truncate">@{user?.login}</p>
            </div>

            {/* Actions */}
            <button
              onClick={() => {
                refreshRepos();
                setShowMenu(false);
              }}
              disabled={reposLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-base hover:bg-surface-raised transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${reposLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh Repos</span>
            </button>

            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-raised transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default GitHubStatusBadge;
