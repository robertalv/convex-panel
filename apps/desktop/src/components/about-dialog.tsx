import { useEffect, useState, useCallback } from "react";
import { ConvexLogo } from "@/components/svg/convex-logo";
import { ConvexLettering } from "./svg/convex-lettering";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConvexLatestRelease {
  version: string;
  repo: string;
  loading: boolean;
  error: string | null;
}

const CONVEX_REPOS = [
  "convex-backend",
  "convex-js",
  "convex-helpers",
  "convex-py",
  "convex-rs",
  "convex-demos",
  "templates",
];

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const [latestRelease, setLatestRelease] = useState<ConvexLatestRelease>({
    version: "",
    repo: "",
    loading: true,
    error: null,
  });

  const fetchLatestConvexRelease = useCallback(async () => {
    try {
      setLatestRelease({
        version: "",
        repo: "",
        loading: true,
        error: null,
      });

      const releasePromises = CONVEX_REPOS.map(async (repo) => {
        try {
          const response = await fetch(
            `https://api.github.com/repos/get-convex/${repo}/releases/latest`,
          );
          if (response.ok) {
            const data = await response.json();
            return {
              repo,
              version: data.tag_name || data.name || "",
              publishedAt: data.published_at || data.created_at || "",
            };
          }
          return null;
        } catch {
          return null;
        }
      });

      const releases = (await Promise.all(releasePromises)).filter(
        (r): r is { repo: string; version: string; publishedAt: string } =>
          r !== null && r.version !== "",
      );

      if (releases.length > 0) {
        const latest = releases.reduce((prev, current) => {
          return new Date(current.publishedAt) > new Date(prev.publishedAt)
            ? current
            : prev;
        });

        setLatestRelease({
          version: latest.version,
          repo: latest.repo,
          loading: false,
          error: null,
        });
      } else {
        setLatestRelease({
          version: "",
          repo: "",
          loading: false,
          error: "No releases found",
        });
      }
    } catch {
      setLatestRelease({
        version: "",
        repo: "",
        loading: false,
        error: "Failed to fetch",
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLatestConvexRelease();
    }
  }, [isOpen, fetchLatestConvexRelease]);

  const handleOpenLink = async (url: string) => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } else {
      window.open(url, "_blank");
    }
  };

  if (!isOpen) return null;

  const commitHash =
    typeof __GIT_COMMIT_HASH__ !== "undefined"
      ? __GIT_COMMIT_HASH__
      : "unknown";
  const repoUrl =
    typeof __GIT_REPO_URL__ !== "undefined" ? __GIT_REPO_URL__ : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-base border border-border-base rounded-xl shadow-2xl w-[380px] overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          data-tauri-drag-region
          className="h-8 mb-6 bg-surface-raised flex items-center justify-center relative"
        >
          <div className="absolute left-2 flex gap-1.5">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              aria-label="Close"
            />
            <div className="w-3 h-3 rounded-full bg-surface-overlay" />
            <div className="w-3 h-3 rounded-full bg-surface-overlay" />
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <ConvexLogo size={50} />
          <ConvexLettering className="mt-4 mb-2" />

          <p className="text-sm text-text-muted">Version 0.1.0 (0.1.0)</p>

          {commitHash && commitHash !== "unknown" && (
            <div className="mb-4 -mt-1">
              <button
                onClick={() =>
                  repoUrl && handleOpenLink(`${repoUrl}/commit/${commitHash}`)
                }
                className="text-xs text-brand-base hover:text-brand-hover transition-colors cursor-pointer"
              >
                Latest Commit: {commitHash.substring(0, 7)}
              </button>
            </div>
          )}

          <div className="w-full h-px bg-border-base my-2" />

          <div className="mb-4 text-sm">
            <span className="text-text-muted">Latest Release: </span>
            {latestRelease.loading ? (
              <span className="text-text-subtle">Loading...</span>
            ) : latestRelease.error ? (
              <span className="text-text-subtle">-</span>
            ) : (
              <button
                onClick={() =>
                  handleOpenLink(
                    `https://github.com/get-convex/${latestRelease.repo}/releases/tag/${latestRelease.version}`,
                  )
                }
                className="text-brand-base hover:text-brand-hover transition-colors cursor-pointer"
              >
                {latestRelease.repo} {latestRelease.version}
              </button>
            )}
          </div>

          <div className="w-full h-px bg-border-base" />

          <div className="text-sm text-text-muted p-1">
            <span>Created by </span>
            <button
              onClick={() => handleOpenLink("https://devwithbobby.com")}
              className="text-brand-base hover:text-brand-hover transition-colors cursor-pointer font-bold underline"
            >
              Bobby Alv
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutDialog;
